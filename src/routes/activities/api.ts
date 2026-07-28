import { getToken } from "../../api/client"

// FR-14-02 — GET /api/v1/activities/seed (minimal-GET-add, same precedent as FR-02-03's
// GET /classes/mine) + POST /api/v1/activities/{id}/run. Reuses GET /classes/mine and
// GET /classes/{id}/roster (dashboard/api.ts already exposes both) rather than duplicating them.

const BASE = "/api/v1"

export interface SeedActivity {
  id: string
  title: string
  type: string
  topic: string | null
}

export class ActivitiesApiError extends Error {
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
    throw new ActivitiesApiError(res.status, detail)
  }
  return (await res.json()) as T
}

export async function getSeedActivities(): Promise<SeedActivity[]> {
  const data = await authedFetch<{ activities: SeedActivity[] }>("/activities/seed")
  return data.activities
}

export async function runOrAssignActivity(
  activityId: string,
  target: string,
): Promise<string[]> {
  const data = await authedFetch<{ assigned: string[] }>(`/activities/${activityId}/run`, {
    method: "POST",
    body: JSON.stringify({ target }),
  })
  return data.assigned
}
