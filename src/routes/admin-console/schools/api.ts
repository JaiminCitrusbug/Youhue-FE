import { api } from "../../../api/client"

// FR-19-02 · /api/v1/admin/schools[...] — manage school accounts/trial settings, grant the ONE
// 14-day trial extension, and permission-bound, audited support access to a school's children's
// data. All three PATCH actions share one endpoint (`action` discriminates); GET reads support the
// three approved screens (SC-075 list, SC-076 trial, SC-077 support) with real data.
//
//   GET   /admin/schools                 -> { schools: SchoolListItem[], count }   (SC-075)
//   GET   /admin/schools/{id}            -> SchoolDetail                            (SC-076/077)
//   PATCH /admin/schools/{id}  { action: "extend_trial" }                    -> 200 | 409 | 403
//   PATCH /admin/schools/{id}  { action: "update_account", tier?, status?, timezone? } -> 200 | 403
//   PATCH /admin/schools/{id}  { action: "support_access", reason }          -> 200 | 403 | 422
//   403   caller's role lacks the action's permission (audit-logged BE-side)
//   409   extend_trial: the school's one-time extension is already used
//   500   { error }-shaped persistence failure
//
// Errors are surfaced as GENERIC copy (never a raw server message), matching the FR-19-05
// convention; the admin session bearer is attached by the shared `api()` helper.

export type SchoolTier = "free" | "premium"
export type SchoolStatus = "pending" | "active" | "rejected"
export type SubscriptionState = "trial" | "active" | "free" | "cancelled"
export type AdminSchoolAction = "extend_trial" | "update_account" | "support_access"

export interface SchoolListItem {
  id: string
  name: string
  tier: SchoolTier
  status: SchoolStatus
}

export interface SchoolsListResponse {
  schools: SchoolListItem[]
  count: number
}

export interface SchoolDetail {
  id: string
  name: string
  tier: SchoolTier
  status: SchoolStatus
  timezone: string
  subscription_state: SubscriptionState | null
  trial_end_at: string | null
  trial_extension_count: number
}

export interface SchoolActionResponse {
  action: AdminSchoolAction
  school: SchoolDetail
}

// Map a failed request to human, non-technical copy — surfaced, never dropped. The 409 (extension
// already used) and 403 (permission-bound support access / account management) get their own copy;
// everything else is one generic failure message.
export function adminSchoolErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : ""
  const status = Number(/(\d{3})/.exec(msg)?.[1])
  if (status === 403) return "You don't have permission to do that."
  if (status === 409) return "This school's one-time trial extension has already been used."
  if (status === 404) return "That school no longer exists."
  if (status === 422) return "A reason is required to open support access."
  return "Something went wrong. Please try again."
}

export async function listSchools(q?: string): Promise<SchoolsListResponse> {
  const qs = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""
  return api<SchoolsListResponse>(`/admin/schools${qs}`)
}

export async function getSchool(schoolId: string): Promise<SchoolDetail> {
  return api<SchoolDetail>(`/admin/schools/${schoolId}`)
}

export async function extendTrial(schoolId: string): Promise<SchoolActionResponse> {
  return api<SchoolActionResponse>(`/admin/schools/${schoolId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "extend_trial" }),
  })
}

export async function updateAccount(
  schoolId: string,
  patch: { tier?: SchoolTier; status?: SchoolStatus; timezone?: string },
): Promise<SchoolActionResponse> {
  return api<SchoolActionResponse>(`/admin/schools/${schoolId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "update_account", ...patch }),
  })
}

export async function openSupportAccess(
  schoolId: string,
  reason: string,
): Promise<SchoolActionResponse> {
  return api<SchoolActionResponse>(`/admin/schools/${schoolId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "support_access", reason }),
  })
}
