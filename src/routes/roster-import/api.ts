import { getToken, setToken } from "../../api/client"

// FR-03-01 · POST /api/v1/schools/{id}/roster/import — staff-only (teacher/support),
// same-school-only CSV roster import (SC-036). Multipart upload, so this bypasses the JSON-only
// `api()` helper (setting Content-Type manually on a FormData body breaks the browser's
// multipart boundary) — same reasoning as `leadership-consent/api.ts`'s raw-fetch use.
//
// Contract read from the FINAL backend (`feat/FR-03-01-roster-import`, `src/routers/schools.py`
// `import_roster` + `src/application/roster/services.py` + `src/schemas/roster.py`):
//
//   request   multipart/form-data, one field "file" (the .csv)
//   200       { imported: number, banded: number }
//   400       { detail: { code: "failed_scan", message } }        content scan failed
//   403       { detail: string }                                   wrong role / cross-school
//   413       { detail: { code: "file_too_large", message } }      oversize file OR too many rows
//   415       { detail: { code: "unsupported_file_type", message } } TRUE reason always named
//   422       { detail: { code: "malformed_rows", message, errors: [{row, error}] } }
//   500       { detail: string }                                   nothing was written
//
// Server-side validation is authoritative; the client's `.csv`-only picker filter is convenience.

export interface RosterImportResult {
  imported: number
  banded: number
}

export interface RosterRowError {
  row: number
  error: string
}

export type RosterImportFailure =
  | { kind: "unsupported_type"; message: string }
  | { kind: "too_large"; message: string }
  | { kind: "failed_scan"; message: string }
  | { kind: "malformed_rows"; message: string; errors: RosterRowError[] }
  | { kind: "forbidden"; message: string }
  | { kind: "error"; message: string }

export type RosterImportOutcome =
  | { kind: "success"; result: RosterImportResult }
  | { kind: "failed"; failure: RosterImportFailure }

const GENERIC_ERROR = "Couldn't import the roster. Please try again."
const FORBIDDEN = "You don't have permission to import a roster for this school."
const SESSION_EXPIRED = "Your session has expired. Please sign in again."

interface ErrorBody {
  detail?: {
    code?: unknown
    message?: unknown
    errors?: unknown
  } | string
}

function isRowError(value: unknown): value is RosterRowError {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as RosterRowError).row === "number" &&
    typeof (value as RosterRowError).error === "string"
  )
}

function messageOf(body: ErrorBody | null, fallback: string): string {
  const detail = body?.detail
  if (detail && typeof detail === "object" && typeof detail.message === "string") {
    return detail.message
  }
  if (typeof detail === "string" && detail.trim().length > 0) return detail
  return fallback
}

function rowErrorsOf(body: ErrorBody | null): RosterRowError[] {
  const detail = body?.detail
  const errors = detail && typeof detail === "object" ? detail.errors : undefined
  return Array.isArray(errors) ? errors.filter(isRowError) : []
}

/**
 * Uploads a roster CSV for `schoolId`. Never throws on a 4xx/5xx — the status is load-bearing
 * (each one renders different UI, per ticket), so it is mapped to an outcome the screen renders.
 * A network failure is surfaced as the generic outcome, never swallowed.
 */
export async function importRoster(schoolId: string, file: File): Promise<RosterImportOutcome> {
  const token = getToken()
  const form = new FormData()
  form.append("file", file)

  let res: Response
  try {
    res = await fetch(`/api/v1/schools/${schoolId}/roster/import`, {
      method: "POST",
      // No Content-Type here on purpose — the browser must own the multipart boundary.
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: form,
    })
  } catch {
    return { kind: "failed", failure: { kind: "error", message: GENERIC_ERROR } }
  }

  if (res.status === 200) {
    const body = (await res.json().catch(() => null)) as Partial<RosterImportResult> | null
    if (body && typeof body.imported === "number" && typeof body.banded === "number") {
      return { kind: "success", result: { imported: body.imported, banded: body.banded } }
    }
    return { kind: "failed", failure: { kind: "error", message: GENERIC_ERROR } }
  }

  if (res.status === 401) {
    // The staff session is invalid/expired — drop the stale token so it can't persist.
    setToken(null)
    return { kind: "failed", failure: { kind: "forbidden", message: SESSION_EXPIRED } }
  }

  const body = (await res.json().catch(() => null)) as ErrorBody | null

  switch (res.status) {
    case 403:
      return { kind: "failed", failure: { kind: "forbidden", message: FORBIDDEN } }
    case 415:
      return {
        kind: "failed",
        failure: { kind: "unsupported_type", message: messageOf(body, GENERIC_ERROR) },
      }
    case 413:
      return {
        kind: "failed",
        failure: { kind: "too_large", message: messageOf(body, GENERIC_ERROR) },
      }
    case 400:
      return {
        kind: "failed",
        failure: { kind: "failed_scan", message: messageOf(body, GENERIC_ERROR) },
      }
    case 422:
      return {
        kind: "failed",
        failure: {
          kind: "malformed_rows",
          message: messageOf(body, GENERIC_ERROR),
          errors: rowErrorsOf(body),
        },
      }
    default:
      return { kind: "failed", failure: { kind: "error", message: GENERIC_ERROR } }
  }
}
