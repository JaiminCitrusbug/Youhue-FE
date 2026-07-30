import { getToken } from "../../api/client"

// FR-10-01 — GET /api/v1/classes/mine (FR-02-03, reused) + GET /api/v1/classes/{id}/dashboard.
// Every field in `ClassDashboard` is server-owned (SRS §13.5); this client never derives `trend`
// from `mood_index` deltas itself.
//
// FR-10-05 adds `data_state` to the SAME response (no new endpoint) — `has_data` when mood_index
// is populated; `no_data_yet` when this class has NEVER checked in, in any period; `no_results`
// when the current window is empty but the class DOES have check-ins outside it. The two empty
// cases render distinct copy (ticket §Must-nots) — see index.tsx.

const BASE = "/api/v1"

export interface MyClass {
  id: string
  name: string
}

export interface ClassDashboard {
  class_id: string
  class_name: string
  mood_index: number | null
  trend: "up" | "down" | "flat"
  as_of: string
  live: boolean
  period: string
  timezone: string
  data_state: "has_data" | "no_data_yet" | "no_results"
}

export interface RosterStudent {
  id: string
  display_name: string
}

export class DashboardApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// FR-10-05 — a real server message when we have one (DashboardApiError, e.g. a 500's "Could not
// load the dashboard" or a 422's real validation detail), a caller-supplied fallback otherwise
// (e.g. a network-level failure with no response at all). Shared so each section's own error
// state (dashboard figures vs. roster) surfaces this the same way, never a silently dropped error.
export function dashboardErrorMessage(err: unknown, fallback: string): string {
  return err instanceof DashboardApiError ? err.message : fallback
}

async function authedFetch<T>(path: string): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    let detail = "Something went wrong. Please try again."
    try {
      const body = (await res.json()) as { detail?: string }
      if (body.detail) detail = body.detail
    } catch {
      // no/invalid JSON body — keep the generic message, still surfaced via the thrown error
    }
    throw new DashboardApiError(res.status, detail)
  }
  return (await res.json()) as T
}

export async function getMyClasses(): Promise<MyClass[]> {
  const data = await authedFetch<{ classes: MyClass[] }>("/classes/mine")
  return data.classes
}

export async function getClassDashboard(classId: string, range?: string): Promise<ClassDashboard> {
  const query = range ? `?range=${encodeURIComponent(range)}` : ""
  return authedFetch<ClassDashboard>(`/classes/${classId}/dashboard${query}`)
}

export async function getClassRoster(classId: string): Promise<RosterStudent[]> {
  const data = await authedFetch<{ students: RosterStudent[] }>(`/classes/${classId}/roster`)
  return data.students
}
