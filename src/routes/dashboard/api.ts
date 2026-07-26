import { getToken } from "../../api/client"

// FR-10-01 — GET /api/v1/classes/mine (FR-02-03, reused) + GET /api/v1/classes/{id}/dashboard.
// Every field in `ClassDashboard` is server-owned (SRS §13.5); this client never derives `trend`
// from `mood_index` deltas itself.

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
