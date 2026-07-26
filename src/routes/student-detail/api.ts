import { getToken } from "../../api/client"

// FR-10-02 — GET /api/v1/students/{id} (existing, FR-10-01-adjacent read) + the new
// GET /api/v1/students/{id}/detail. Every field is server-owned (SRS §13.5); this client never
// recomputes `participation_rate` from the raw check-in list itself.

const BASE = "/api/v1"

export interface StudentSummary {
  id: string
  display_name: string
  age_band: string
  school_id: string
}

export interface MoodPoint {
  local_date: string
  mood_value: number
}

export interface ReflectionPoint {
  local_date: string
  reflection_text: string
}

export interface StudentDetail {
  mood_history: MoodPoint[]
  reflections: ReflectionPoint[]
  participation_rate: number
}

export class StudentDetailApiError extends Error {
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
    throw new StudentDetailApiError(res.status, detail)
  }
  return (await res.json()) as T
}

export async function getStudentSummary(studentId: string): Promise<StudentSummary> {
  return authedFetch<StudentSummary>(`/students/${studentId}`)
}

export async function getStudentDetail(studentId: string): Promise<StudentDetail> {
  return authedFetch<StudentDetail>(`/students/${studentId}/detail`)
}
