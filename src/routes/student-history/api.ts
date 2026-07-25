import { getToken } from "../../api/client"

// FR-08-01 · GET /api/v1/students/me/history — the caller's OWN moods over time + own reflections.
// Same shape of error-surfacing as `../checkin/api.ts`'s `authedFetch` (keeps the server's real
// `detail`/status, not a generic message) — this endpoint has no write path, so only a `get`.

const BASE = "/api/v1"

export interface MoodPoint {
  local_date: string
  mood_value: number
}

export interface ReflectionPoint {
  local_date: string
  reflection_text: string
}

export interface HistoryResponse {
  moods_over_time: MoodPoint[]
  reflections: ReflectionPoint[]
}

export class HistoryApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function getMyHistory(): Promise<HistoryResponse> {
  const token = getToken()
  const res = await fetch(`${BASE}/students/me/history`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    let detail = "Couldn't load your history. Please try again."
    try {
      const body = (await res.json()) as { detail?: string }
      if (body.detail) detail = body.detail
    } catch {
      // no/invalid JSON body — keep the generic message, still surfaced via the thrown error
    }
    throw new HistoryApiError(res.status, detail)
  }
  return (await res.json()) as HistoryResponse
}
