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
