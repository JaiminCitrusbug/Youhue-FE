import { getToken, setToken } from "../../api/client"

// FR-19-05 · /api/v1/admin/concern-words/default — the internal team reads and replaces the platform
// default concern-word list (full-replacement set model; the BE normalizes + de-dupes and is the
// authoritative validator). The updated default applies to every school that has NOT overridden it;
// a school override is untouched (GATE G-6, enforced BE-side).
//
//   GET      → 200 { words: string[], count: number, is_default: true }   the CURRENT default
//              (`words: []` only when no default has been seeded yet — a real, empty state, NOT a
//              load failure; a genuine read failure surfaces as 500 and is thrown, never swallowed)
//   PUT      { words: string[] } → 200 { words, count, is_default: true }   (persisted, normalized)
//   403      caller lacks `manage_word_lists`, or no/!admin session   (audit-logged BE-side)
//   422      invalid input on PUT (empty-after-normalize / too many / over-long entry)
//   500      { error }   read/persistence failure
//
// The editor GETs the current default on mount so entries can be EDITED and REMOVED rather than
// replaced blind — without the read, a full-replacement PUT would silently drop every word the admin
// never saw (the Blocker-1 trap). The admin session bearer is attached from the in-memory token
// store (src/api/client.ts — Authorization: Bearer, never localStorage). Errors are surfaced as
// GENERIC copy, never swallowed.

const ENDPOINT = "/api/v1/admin/concern-words/default"

export interface DefaultWordListResponse {
  words: string[]
  count: number
  is_default: boolean
}

// Generic, non-leaking copy per surfaced status. 401/403 → a permission message; everything else →
// one generic failure. No server detail (e.g. the 500 `error` body) is shown to the user.
const FORBIDDEN = "You don't have permission to edit the default word list."
const GENERIC_ERROR = "Couldn't save the default word list. Please try again."
const LOAD_ERROR = "Couldn't load the current default word list. Please try again."

export async function getDefaultConcernWords(): Promise<DefaultWordListResponse> {
  const token = getToken()
  const res = await fetch(ENDPOINT, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (res.status === 401) {
    // The admin session is invalid/expired — drop the stale token so it can't persist.
    setToken(null)
    throw new Error(FORBIDDEN)
  }
  if (res.status === 403) throw new Error(FORBIDDEN)
  // A non-OK read MUST throw: the editor treats a thrown load as "unknown", never as "empty".
  // Silently rendering an empty editor after a failed read is the whole Blocker-1 trap.
  if (!res.ok) throw new Error(LOAD_ERROR)

  return (await res.json()) as DefaultWordListResponse
}

export async function saveDefaultConcernWords(words: string[]): Promise<DefaultWordListResponse> {
  const token = getToken()
  const res = await fetch(ENDPOINT, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ words }),
  })

  if (res.status === 401) {
    // The admin session is invalid/expired — drop the stale token so it can't persist; the next
    // /me refresh signs the console out. Surface a generic permission message.
    setToken(null)
    throw new Error(FORBIDDEN)
  }
  if (res.status === 403) throw new Error(FORBIDDEN)
  if (!res.ok) throw new Error(GENERIC_ERROR)

  return (await res.json()) as DefaultWordListResponse
}
