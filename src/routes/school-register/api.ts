import { authFetch } from "../../api/client"

// FR-02-01 · POST /api/v1/schools — PUBLIC (pre-login), rate-limited school self-registration.
//
// Contract read from the FINAL, security-hardened backend (`feat/FR-02-01-school-register` @ b2b9bcf:
// `src/routers/schools.py`, `src/schemas/schools.py`, `src/application/schools/services.py`,
// `tests/test_schools.py`) — not guessed. This backend was hardened after a security review closed a
// Blocker + 4 Majors; the shapes below are the POST-hardening contract:
//
//   request   { school_name: str (trimmed, 1..200), registrant_email: RFC-5322, password: 8..256 }
//             `extra="forbid"` on the server — we send ONLY these three fields, nothing else.
//   201       { school_id: uuid, status: "pending" }   → a pending school exists for this registrant.
//             NOTE: an already-registered email ALSO gets 201 here (the enumeration oracle was
//             removed) — the endpoint answers no question about who has an account, and neither do
//             we: we read `status` and DISCARD `school_id` (never store/display a tenant UUID).
//   409       { detail: { code: "school_exists", message } }  → a school of this name already exists
//             (pending OR live). Terminal for this endpoint — there is NO join endpoint. NO school_id
//             and NO `action:"join"` are returned any more; we surface guidance + a route to sign-in.
//   422       { detail: [ { loc, msg, type } ] }  → server-side validation (ARRAY). We type-guard
//             (409's `detail` is an OBJECT) and surface the server's own message(s).
//   429       rate limited → generic "slow down" copy.
//   500       transaction rolled back → generic error.
//
// Server-side validation is the authoritative gate; anything the client checks is convenience only.

export interface RegisterSchoolRequest {
  school_name: string
  registrant_email: string
  password: string
}

export type RegisterFailure = "conflict" | "invalid" | "throttled" | "error"

/** The registration outcome the screen renders. `created` carries ONLY the lifecycle status the
 *  server reported — never the tenant UUID (we parse the 201 body but do not retain `school_id`). */
export type RegisterOutcome =
  | { kind: "created"; status: string }
  | { kind: "failed"; reason: RegisterFailure; message: string }

const GENERIC_ERROR = "Something went wrong. Please try again."

// 409 is terminal (no join flow exists). Guidance only — sign in if it's your school, or ask a
// colleague there to invite you. We do NOT say whether the school is pending or live, and we surface
// no tenant id.
const CONFLICT_MESSAGE =
  "A school with this name is already registered with Youhue. If it's your school, sign in — or ask a colleague there to invite you. We won't create a duplicate."

const THROTTLE_MESSAGE = "Too many attempts. Please wait a moment, then try again."

const VALIDATION_FALLBACK =
  "Please check the details: a school name is required, the email must be a valid work email, and the password must be at least 8 characters."

interface ValidationItem {
  msg?: unknown
}

/** 422 `detail` is an ARRAY of {loc,msg,type}; 409 `detail` is an OBJECT — hence the guard. Surface
 *  the server's own validation message(s); fall back to guidance copy if the shape is unexpected. */
function validationMessage(detail: unknown): string {
  if (!Array.isArray(detail)) return VALIDATION_FALLBACK
  const msgs = detail
    .map((item) => (item as ValidationItem)?.msg)
    .filter((m): m is string => typeof m === "string" && m.trim().length > 0)
  return msgs.length > 0 ? msgs.join(" ") : VALIDATION_FALLBACK
}

interface RegisterBody {
  status?: unknown
  detail?: unknown
}

/**
 * Registers a school. Sends ONLY the three contract fields. Never throws on a 4xx — the status is
 * load-bearing, so it is mapped to an outcome the screen renders (an error is surfaced, never
 * swallowed). A network/parse failure rejects and the caller shows the generic message.
 */
export async function registerSchool(req: RegisterSchoolRequest): Promise<RegisterOutcome> {
  const { status, data } = await authFetch<RegisterBody>("/schools", req)
  if (status === 201 && data && typeof data.status === "string") {
    return { kind: "created", status: data.status }
  }
  switch (status) {
    case 409:
      return { kind: "failed", reason: "conflict", message: CONFLICT_MESSAGE }
    case 422:
      return { kind: "failed", reason: "invalid", message: validationMessage(data?.detail) }
    case 429:
      return { kind: "failed", reason: "throttled", message: THROTTLE_MESSAGE }
    default:
      return { kind: "failed", reason: "error", message: GENERIC_ERROR }
  }
}
