/**
 * Staff-auth API client (FR-01-03). Thin typed wrappers over the pre-auth `authFetch` helper —
 * no business logic, no token attachment. Errors are surfaced to the caller via `status`, which
 * the screens turn into GENERIC messages (no account-existence disclosure — FR-01-03 security).
 *
 * Backend contract (already built — do not change BE):
 *   POST /auth/staff/sign-in        {email,password,device_id?} -> 200 {access_token,token_type,mfa_required} · 401 · 423 · 429
 *   POST /auth/staff/mfa/verify     {session_token,code}        -> 200 {access_token,token_type}
 *   POST /auth/staff/forgot-password{email}                     -> 202 {status:"accepted"}   (no disclosure)
 *   POST /auth/staff/reset-password {token,new_password}        -> 204
 */
import { authFetch, type AuthResult } from "../../api/client"

export interface SignInResponse {
  access_token: string
  token_type: string
  mfa_required: boolean
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export function staffSignIn(
  email: string,
  password: string,
  deviceId?: string,
): Promise<AuthResult<SignInResponse>> {
  return authFetch<SignInResponse>("/auth/staff/sign-in", {
    email,
    password,
    ...(deviceId ? { device_id: deviceId } : {}),
  })
}

export function staffMfaVerify(
  sessionToken: string,
  code: string,
): Promise<AuthResult<TokenResponse>> {
  return authFetch<TokenResponse>("/auth/staff/mfa/verify", {
    session_token: sessionToken,
    code,
  })
}

export function staffForgotPassword(email: string): Promise<AuthResult<{ status: string }>> {
  return authFetch<{ status: string }>("/auth/staff/forgot-password", { email })
}

export function staffResetPassword(
  token: string,
  newPassword: string,
): Promise<AuthResult<null>> {
  return authFetch<null>("/auth/staff/reset-password", { token, new_password: newPassword })
}

/**
 * Confirm linking a first-time SSO identity to an existing email account (Scenario 3), exchanging
 * the short-lived link token for a full staff session. NOTE (BE reconciliation — see gate doc): the
 * current BE callback auto-links and returns the token directly; this explicit-confirm endpoint is
 * needed only if the owner wants the LinkSSO confirmation step. Consumed defensively by LinkSSOScreen.
 */
export function staffSsoLink(linkToken: string): Promise<AuthResult<TokenResponse>> {
  return authFetch<TokenResponse>("/auth/staff/sso/link", { link_token: linkToken })
}
