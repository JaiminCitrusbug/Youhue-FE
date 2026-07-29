import { setToken } from "../../api/client"

// FR-01-02 · POST /api/v1/auth/student/sign-in
// `school_or_class_code` and `qr_token` are MUTUALLY EXCLUSIVE — send exactly one (the container
// enforces this as a convenience; the server is the authoritative gate). On success the response's
// `session_token` (NOT `access_token`) is the student bearer, held in memory only.

export interface StudentSignInRequest {
  student_id: string
  school_or_class_code?: string
  qr_token?: string
  device_id?: string
}

export interface StudentSignInResponse {
  session_token: string
  student_id: string
  age_band: string
}

// FR-01-02 · GET /api/v1/auth/student/roster — the REAL name/avatar list for the picker screen
// (SC-021), scoped by the same code/qr_token the student already entered. Public (pre-auth), same
// posture as sign-in itself.
export interface RosterEntry {
  id: string
  display_name: string
}

export interface RosterListResponse {
  students: RosterEntry[]
}

export interface RosterQuery {
  school_or_class_code?: string
  qr_token?: string
}

export async function getStudentRoster(query: RosterQuery): Promise<RosterListResponse> {
  const params = new URLSearchParams()
  if (query.school_or_class_code) params.set("school_or_class_code", query.school_or_class_code)
  if (query.qr_token) params.set("qr_token", query.qr_token)
  const res = await fetch(`/api/v1/auth/student/roster?${params.toString()}`)
  if (!res.ok) {
    throw new Error(ERROR_BY_STATUS[res.status] ?? "Something went wrong. Please try again.")
  }
  return (await res.json()) as RosterListResponse
}

// Child-friendly copy per surfaced status. Errors are surfaced, never swallowed.
const ERROR_BY_STATUS: Record<number, string> = {
  400: "That code didn't work — ask your teacher.",
  404: "We couldn't find your name in that class — ask your teacher.",
  429: "Too many tries just now. Wait a moment, then try again.",
}

export async function studentSignIn(body: StudentSignInRequest): Promise<StudentSignInResponse> {
  const res = await fetch("/api/v1/auth/student/sign-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(ERROR_BY_STATUS[res.status] ?? "Something went wrong. Please try again.")
  }
  const data = (await res.json()) as StudentSignInResponse
  setToken(data.session_token) // session_token is the student bearer — never access_token
  return data
}
