import { api } from "../../api/client"

// FR-16-02 · /api/v1/schools/{id}/staff[...] + /api/v1/schools/{id}/settings — the school
// leadership hub: staff management (SC-057) + the leadership-exposed settings surfaces (SC-060
// concern words · SC-061 alert routing · SC-063 access window), all scoped to the leader's OWN
// school (BE re-checks role=leadership + school_id match; 403 cross-tenant/non-leadership).
//
//   GET   /schools/{id}/staff                                     -> { staff: StaffRow[] }
//   PATCH /schools/{id}/staff/{staffId}  { status: "deactivated" } -> { staff } | 403 | 404 | 422
//   GET   /schools/{id}/settings                                  -> { settings: SchoolSettings }
//   PATCH /schools/{id}/settings  { concern_words | alert_routing | access_window }
//         (exactly ONE of the three per call)                     -> { settings } | 403 | 422
//
// Errors are surfaced as GENERIC copy (never a raw server message), matching the FR-19-02/05
// convention; the staff session bearer is attached by the shared `api()` helper.

export interface StaffRow {
  id: string
  email: string
  role: string
  status: string
  created_at: string
}

export interface ConcernWordsSettings {
  platform_defaults: string[]
  school_additions: string[]
}

export type AlertType = "immediate" | "triage"

export interface AlertRoutingEntry {
  alert_type: AlertType
  recipient_staff_ids: string[]
}

export interface AccessWindowSettings {
  window_start: string
  window_end: string
  timezone: string
}

export interface SchoolSettings {
  concern_words: ConcernWordsSettings
  alert_routing: AlertRoutingEntry[]
  access_window: AccessWindowSettings | null
}

// Map a failed request to human, non-technical copy — surfaced, never dropped.
export function leadershipErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : ""
  const status = Number(/(\d{3})/.exec(msg)?.[1])
  if (status === 403) return "You don't have permission to do that."
  if (status === 404) return "That colleague no longer exists."
  if (status === 422) return "That value isn't valid — check it and try again."
  return "Something went wrong. Please try again."
}

export async function listStaff(schoolId: string): Promise<{ staff: StaffRow[] }> {
  return api<{ staff: StaffRow[] }>(`/schools/${schoolId}/staff`)
}

export async function deactivateStaff(
  schoolId: string,
  staffId: string,
): Promise<{ staff: StaffRow }> {
  return api<{ staff: StaffRow }>(`/schools/${schoolId}/staff/${staffId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "deactivated" }),
  })
}

export async function getSettings(schoolId: string): Promise<{ settings: SchoolSettings }> {
  return api<{ settings: SchoolSettings }>(`/schools/${schoolId}/settings`)
}

export async function updateConcernWords(
  schoolId: string,
  words: string[],
): Promise<{ settings: SchoolSettings }> {
  return api<{ settings: SchoolSettings }>(`/schools/${schoolId}/settings`, {
    method: "PATCH",
    body: JSON.stringify({ concern_words: { words } }),
  })
}

export async function updateAlertRouting(
  schoolId: string,
  routes: AlertRoutingEntry[],
): Promise<{ settings: SchoolSettings }> {
  return api<{ settings: SchoolSettings }>(`/schools/${schoolId}/settings`, {
    method: "PATCH",
    body: JSON.stringify({ alert_routing: { routes } }),
  })
}

export async function updateAccessWindow(
  schoolId: string,
  window: AccessWindowSettings,
): Promise<{ settings: SchoolSettings }> {
  return api<{ settings: SchoolSettings }>(`/schools/${schoolId}/settings`, {
    method: "PATCH",
    body: JSON.stringify({ access_window: window }),
  })
}
