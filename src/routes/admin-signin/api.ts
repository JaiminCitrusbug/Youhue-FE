import { setToken } from "../../api/client"

// FR-19-01 · POST /api/v1/admin/sign-in — SINGLE endpoint, TWO-PHASE email-OTP MFA.
//
//   Phase 1 (no mfa_code):  the BE verifies email+password and emails a 6-digit OTP →
//       200 { admin_session: null, role: null, mfa_required: true }
//   Phase 2 (email+password RESUBMITTED together with mfa_code): the BE re-verifies the
//       credentials, verifies the OTP and mints the session →
//       200 { admin_session: <bearer>, role, mfa_required: false }
//
// There is NO separate verify endpoint and NO pending-session token — the FE holds email+password
// and resubmits with the code. `admin_session` is the bearer (Authorization: Bearer), NOT
// access_token, and is held IN MEMORY ONLY (src/api/client.ts — never localStorage).
//
// Errors are GENERIC (no account-existence / factor disclosure): a bad email, wrong password and
// wrong OTP all surface the identical 401 message. 423 = locked, 429 = throttled, 5xx = generic.

export interface AdminSignInRequest {
  email: string
  password: string
  mfa_code?: string
  device_id?: string
}

export interface AdminSignInResponse {
  admin_session: string | null
  role: string | null
  mfa_required: boolean
}

// Generic, non-enumerating copy per surfaced status. Errors are surfaced, never swallowed.
const ERROR_BY_STATUS: Record<number, string> = {
  401: "Sign-in failed. Check your details and try again.",
  423: "This account is locked. Contact platform security.",
  429: "Too many attempts. Please wait a moment, then try again.",
}
const GENERIC_ERROR = "Something went wrong. Please try again."

export async function adminSignIn(body: AdminSignInRequest): Promise<AdminSignInResponse> {
  const res = await fetch("/api/v1/admin/sign-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(ERROR_BY_STATUS[res.status] ?? GENERIC_ERROR)
  }
  const data = (await res.json()) as AdminSignInResponse
  // Only phase 2 returns a bearer; store it as the in-memory admin session token.
  if (data.admin_session) setToken(data.admin_session)
  return data
}
