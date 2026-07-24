import { getToken } from "../../api/client"

// FR-04-01 · GET /api/v1/check-ins/mood-set + POST /api/v1/check-ins
//
// Unlike the shared `api()` helper (`../../api/client`), this keeps the SERVER's own `detail`
// message and status code on the thrown error — the ticket requires the real 403/409/422 copy be
// shown, not a generic "something went wrong" (`CheckInApiError.status` / `.message`).

const BASE = "/api/v1"

export interface MoodSetResponse {
  values: number[]
}

export interface ActivityOffer {
  activity_id: string
  title: string
  type: string
}

export interface CheckInResponse {
  checkin_id: string
  activity_offer: ActivityOffer | null
}

export class CheckInApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function authedFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  })
  if (!res.ok) {
    let detail = "Something went wrong. Please try again."
    try {
      const body = (await res.json()) as { detail?: string }
      if (body.detail) detail = body.detail
    } catch {
      // no/invalid JSON body — keep the generic message, still surfaced via the thrown error
    }
    throw new CheckInApiError(res.status, detail)
  }
  return (await res.json()) as T
}

export function getMoodSet(): Promise<MoodSetResponse> {
  return authedFetch<MoodSetResponse>("/check-ins/mood-set")
}

export function submitCheckIn(
  moodValue: number,
  reflectionText?: string,
): Promise<CheckInResponse> {
  return authedFetch<CheckInResponse>("/check-ins", {
    method: "POST",
    body: JSON.stringify({
      mood_value: moodValue,
      ...(reflectionText ? { reflection_text: reflectionText } : {}),
    }),
  })
}
