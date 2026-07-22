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
