import { getToken, setToken } from "../../api/client"

// FR-02-02 · /api/v1/schools — District/Trust leadership reviews + decides a pending school.
//
//   GET  /schools/pending          -> 200 { schools: [{ school_id, name, registrant_email, created_at }] }
//                                      (SC-069 queue, oldest first; district-role only)
//   GET  /schools/{id}             -> 200 { school_id, name, status, registrant_email, student_count,
//                                            created_at }   (SC-070 single-school review)
//   POST /schools/{id}/decision    { decision: "approve" | "reject" }
//                                   -> 200 { school_id, status: "active" | "rejected" }
//   403  caller is not District/Trust leadership (or no/non-staff session)
//   404  no such school
//   409  { detail: { code: "not_pending", message } }   the school was already decided
//   422  invalid decision value (FE never sends one — the two buttons are the only source)
//   500  { detail }   nothing was written
//
// The bearer is attached from the in-memory staff session token (src/api/client.ts — never
// localStorage). Errors are surfaced as GENERIC, non-leaking copy, matching the FR-19-05
// admin-word-lists convention this module reuses.

const BASE = "/api/v1/schools"

export interface PendingSchool {
  school_id: string
  name: string
  registrant_email: string | null
  created_at: string
}

export interface PendingSchoolsResponse {
  schools: PendingSchool[]
}

export type SchoolStatus = "pending" | "active" | "rejected"

export interface SchoolDetail {
  school_id: string
  name: string
  status: SchoolStatus
  registrant_email: string | null
  student_count: number
  created_at: string
}

export type Decision = "approve" | "reject"

export interface DecisionResult {
  school_id: string
  status: "active" | "rejected"
}

const FORBIDDEN = "You don't have permission to review school approvals."
const NOT_FOUND = "This school could not be found."
const ALREADY_DECIDED = "This school has already been decided — it is no longer pending."
const LOAD_ERROR = "Couldn't load the approval queue. Please try again."
const DETAIL_LOAD_ERROR = "Couldn't load this school's details. Please try again."
const GENERIC_ERROR = "Couldn't record that decision. Please try again."

function authHeaders(): HeadersInit {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// A 401 means the session is invalid/expired — drop the stale token so it can't persist.
function dropStaleToken(status: number): void {
  if (status === 401) setToken(null)
}

export async function getPendingSchools(): Promise<PendingSchoolsResponse> {
  const res = await fetch(`${BASE}/pending`, { method: "GET", headers: authHeaders() })
  dropStaleToken(res.status)
  if (res.status === 401 || res.status === 403) throw new Error(FORBIDDEN)
  if (!res.ok) throw new Error(LOAD_ERROR)
  return (await res.json()) as PendingSchoolsResponse
}

export async function getSchoolDetail(schoolId: string): Promise<SchoolDetail> {
  const res = await fetch(`${BASE}/${schoolId}`, { method: "GET", headers: authHeaders() })
  dropStaleToken(res.status)
  if (res.status === 401 || res.status === 403) throw new Error(FORBIDDEN)
  if (res.status === 404) throw new Error(NOT_FOUND)
  if (!res.ok) throw new Error(DETAIL_LOAD_ERROR)
  return (await res.json()) as SchoolDetail
}

export async function decideSchool(schoolId: string, decision: Decision): Promise<DecisionResult> {
  const res = await fetch(`${BASE}/${schoolId}/decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ decision }),
  })
  dropStaleToken(res.status)
  if (res.status === 401 || res.status === 403) throw new Error(FORBIDDEN)
  if (res.status === 404) throw new Error(NOT_FOUND)
  if (res.status === 409) throw new Error(ALREADY_DECIDED)
  if (!res.ok) throw new Error(GENERIC_ERROR)
  return (await res.json()) as DecisionResult
}
