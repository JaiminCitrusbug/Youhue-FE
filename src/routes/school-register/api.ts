import { authFetch } from "../../api/client"

// FR-02-01 · POST /api/v1/schools — PUBLIC (pre-login), rate-limited school self-registration.
//
// Contract read from the built backend branch `feat/FR-02-01-school-register`
// (`src/routers/schools.py`, `src/schemas/schools.py`, `src/application/schools/services.py`,
// `tests/test_schools.py`) — not guessed:
//
//   request   { school_name: str (trimmed, 1..200), registrant_email: RFC-5322, password: 8..256 }
//   201       { school_id: uuid, status: "pending" }   → school recorded PENDING, NOT yet live
//   403       { detail: { message, school_id } }       → this email already belongs to a school
//   409       { detail: { message, school_id, action: "join" } } → an APPROVED school of this name
//                                                        exists; the BE routes to join, never a duplicate
//   422       FastAPI validation (empty/blank name · bad email · password < 8)
//   429       "Too many requests, slow down" (rate_limit dependency)
//   500       "Registration failed" (transaction rolled back)
//
// Server-side validation is the authoritative gate; anything the client checks is convenience only.
// The BE's `detail.message` / `detail.school_id` are deliberately NOT echoed — surfacing a school id
// to an unauthenticated caller discloses more than the screen needs; the copy below is our own.

export interface RegisterSchoolRequest {
  school_name: string
  registrant_email: string
  password: string
}

/** 201 body — the created (or idempotently replayed) school and its lifecycle status. */
export interface RegisterSchoolResponse {
  school_id: string
  status: string
}

export type RegisterFailure = "conflict" | "forbidden" | "invalid" | "throttled" | "error"

export type RegisterOutcome =
  | { kind: "created"; school: RegisterSchoolResponse }
  | { kind: "failed"; reason: RegisterFailure; message: string }

const GENERIC_ERROR = "Something went wrong. Please try again."

const FAILURE_BY_STATUS: Record<number, { reason: RegisterFailure; message: string }> = {
  403: {
    reason: "forbidden",
    message: "This email already belongs to a school. Please sign in instead.",
  },
  409: {
    reason: "conflict",
    message:
      "A school with this name is already registered and approved. Sign in, or ask a colleague there to invite you — we won't create a duplicate.",
  },
  422: {
    reason: "invalid",
    message:
      "Please check the details: a school name is required, the email must be a valid work email, and the password must be at least 8 characters.",
  },
  429: {
    reason: "throttled",
    message: "Too many attempts. Please wait a moment, then try again.",
  },
}

/**
 * Registers a school. Sends ONLY the three contract fields. Never throws on a 4xx — the status is
 * load-bearing, so it is mapped to an outcome the screen renders (an error is surfaced, never
 * swallowed). A network/parse failure rejects and the caller shows the generic message.
 */
export async function registerSchool(req: RegisterSchoolRequest): Promise<RegisterOutcome> {
  const { status, data } = await authFetch<RegisterSchoolResponse>("/schools", req)
  if (status === 201 && data) return { kind: "created", school: data }
  const failure = FAILURE_BY_STATUS[status]
  return failure
    ? { kind: "failed", reason: failure.reason, message: failure.message }
    : { kind: "failed", reason: "error", message: GENERIC_ERROR }
}
