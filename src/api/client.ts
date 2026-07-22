// Thin fetch wrapper for the Youhue backend. Attaches the bearer token; no business logic.
// SECURITY (frontend.md): the access token is held IN MEMORY ONLY — never localStorage (XSS).
const BASE = "/api/v1"

let _token: string | null = null
type AuthFailureListener = () => void
const _authFailureListeners = new Set<AuthFailureListener>()

export function getToken(): string | null {
  return _token
}

export function setToken(token: string | null): void {
  _token = token
}

/** Subscribe to auth-failure (401) so the app can end the session in one place. */
export function onAuthFailure(listener: AuthFailureListener): () => void {
  _authFailureListeners.add(listener)
  return () => _authFailureListeners.delete(listener)
}

/** Result of a pre-auth request: the status is load-bearing (401 vs 423 vs 429 drive the UI). */
export interface AuthResult<T> {
  status: number
  data: T | null
}

/**
 * Pre-authentication POST helper for the sign-in / forgot / reset / MFA endpoints.
 *
 * Unlike `api()`, this does NOT attach the bearer token and does NOT route 401 through the
 * global auth-failure choke — a failed *sign-in* is not an expired *session*, so it must not
 * sign anybody out. It never throws on a 4xx: the caller inspects `status` to render the correct
 * (generic) message, so an error is surfaced, never silently dropped. Handles the 204 (reset) and
 * 202 (forgot) bodies safely.
 */
export async function authFetch<T>(
  path: string,
  body: unknown,
  method = "POST",
): Promise<AuthResult<T>> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  let data: T | null = null
  if (res.status !== 204) {
    try {
      data = (await res.json()) as T
    } catch {
      data = null // empty / non-JSON body (e.g. an error page) — status still tells the story
    }
  }
  return { status: res.status, data }
}

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
      ...(opts.headers ?? {}),
    },
  })
  if (res.status === 401) {
    // token invalid/expired/revoked -> clear it and notify, so a stale session can't persist
    _token = null
    _authFailureListeners.forEach((l) => l())
  }
  if (!res.ok) throw new Error(`request failed: ${res.status}`)
  return (await res.json()) as T
}
