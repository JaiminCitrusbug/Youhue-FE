import { api, getToken, setToken } from "../../api/client"

// FR-03-05 · SC-037 — Roster list + re-import reconciliation.
//
//   GET  /schools/{id}/roster            -> { students: RosterStudent[] }   (any status, real DB)
//   POST /schools/{id}/roster/reconcile  -> { stayers_active, leavers_deactivated, new_added }
//
// Contract read from the FINAL backend (`feat/FR-03-05-roster-reconcile`,
// `src/routers/schools.py` `get_roster` / `reconcile_roster` + `src/application/roster/services.py`
// + `src/schemas/roster.py`). The reconcile request is multipart (same reasoning as
// `roster-import/api.ts` — a manually-set Content-Type breaks the browser's multipart boundary),
// so it bypasses the JSON-only `api()` helper the same way; the GET list uses `api()` normally.
// Reconcile's negative-status shapes are IDENTICAL to FR-03-01's import (415/413/422/400) because
// the backend reuses the SAME validation pipeline — never a fixture number, and never a duplicated
// error contract.

export interface RosterStudent {
  id: string
  display_name: string
  age_band: "b5_7" | "b8_11" | "b12_18"
  status: "active" | "inactive"
  external_ref: string | null
}

export interface RosterReconcileResult {
  stayers_active: number
  leavers_deactivated: number
  new_added: number
}

export interface RosterRowError {
  row: number
  error: string
}

export type RosterReconcileFailure =
  | { kind: "unsupported_type"; message: string }
  | { kind: "too_large"; message: string }
  | { kind: "failed_scan"; message: string }
  | { kind: "malformed_rows"; message: string; errors: RosterRowError[] }
  | { kind: "forbidden"; message: string }
  | { kind: "error"; message: string }

export type RosterReconcileOutcome =
  | { kind: "success"; result: RosterReconcileResult }
  | { kind: "failed"; failure: RosterReconcileFailure }

const GENERIC_ERROR = "Couldn't reconcile the roster. Please try again."
const FORBIDDEN = "You don't have permission to re-import a roster for this school."
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

/** GET the current roster (every student, any status) — real data, never a fixture. */
export async function getRoster(schoolId: string): Promise<RosterStudent[]> {
  const res = await api<{ students: RosterStudent[] }>(`/schools/${schoolId}/roster`)
  return res.students
}

/**
 * Uploads a re-imported roster CSV for `schoolId` and reconciles it. Never throws on a 4xx/5xx —
 * the status is load-bearing (each one renders different UI, mirroring `roster-import/api.ts`), so
 * it is mapped to an outcome the screen renders. A network failure is surfaced as the generic
 * outcome, never swallowed.
 */
export async function reconcileRoster(
  schoolId: string,
  file: File,
): Promise<RosterReconcileOutcome> {
  const token = getToken()
  const form = new FormData()
  form.append("file", file)

  let res: Response
  try {
    res = await fetch(`/api/v1/schools/${schoolId}/roster/reconcile`, {
      method: "POST",
      // No Content-Type here on purpose — the browser must own the multipart boundary.
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: form,
    })
  } catch {
    return { kind: "failed", failure: { kind: "error", message: GENERIC_ERROR } }
  }

  if (res.status === 200) {
    const body = (await res.json().catch(() => null)) as Partial<RosterReconcileResult> | null
    if (
      body &&
      typeof body.stayers_active === "number" &&
      typeof body.leavers_deactivated === "number" &&
      typeof body.new_added === "number"
    ) {
      return {
        kind: "success",
        result: {
          stayers_active: body.stayers_active,
          leavers_deactivated: body.leavers_deactivated,
          new_added: body.new_added,
        },
      }
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

/** Map a failed GET-roster request to human, non-technical copy (mirrors `leadershipErrorMessage`). */
export function rosterListErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : ""
  const status = Number(/(\d{3})/.exec(msg)?.[1])
  if (status === 403) return "You don't have permission to view this roster."
  return "Couldn't load the roster. Please try again."
}
