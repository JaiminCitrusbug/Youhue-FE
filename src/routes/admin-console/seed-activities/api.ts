import { api } from "../../../api/client"

// FR-19-04 · Admin seed-activity maintenance client. These four calls sit on the FR-19-01 admin
// router (`/api/v1/admin/...`) and go through the shared `api()` helper so the in-memory admin
// bearer is attached and a 401 routes through the one auth-failure choke (session expiry ends the
// session in one place). The seed set is GLOBAL — every row is scope=seed, available to all schools;
// this surface maintains the `seed` scope only. Errors are SURFACED (mapped to human copy), never
// silently dropped — including the 403 an under-permissioned admin (RBAC) receives on every verb.

export const ACTIVITY_TYPES = ["breathing", "grounding", "stretch", "brain_break"] as const
export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export const AGE_BANDS = ["b5_7", "b8_11", "b12_18", "all"] as const
export type AgeBand = (typeof AGE_BANDS)[number]

// Display labels — the wire enums are not user copy.
export const TYPE_LABEL: Record<ActivityType, string> = {
  breathing: "Breathing",
  grounding: "Grounding",
  stretch: "Stretch",
  brain_break: "Brain break",
}
export const AGE_LABEL: Record<AgeBand, string> = {
  b5_7: "5–7",
  b8_11: "8–11",
  b12_18: "12–18",
  all: "All ages",
}

export interface SeedActivity {
  id: string
  title: string
  type: ActivityType
  age_band: AgeBand
  topic: string | null
  active: boolean
}

export interface SeedActivityInput {
  title: string
  type: ActivityType
  age_band: AgeBand
  topic: string
}

// A partial edit — any subset of fields, plus the retire/re-instate flag.
export type SeedActivityPatch = Partial<SeedActivityInput> & { active?: boolean }

// Map a failed request to human, non-technical copy so the error is surfaced, never dropped.
// The RBAC 403 (an admin whose role does not permit seed maintenance) gets its own clear message.
export function seedErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : ""
  const status = Number(/(\d{3})/.exec(msg)?.[1])
  if (status === 403) return "You do not have permission to change the seed set."
  if (status === 404) return "That activity no longer exists — refresh and try again."
  if (status === 422) return "Check the activity details and try again."
  return "Something went wrong. Please try again."
}

export async function listSeedActivities(includeRetired = false): Promise<SeedActivity[]> {
  const res = await api<{ activities: SeedActivity[] }>(
    `/admin/seed-activities?include_retired=${includeRetired}`,
  )
  return res.activities
}

export async function createSeedActivity(input: SeedActivityInput): Promise<SeedActivity> {
  const res = await api<{ activity: SeedActivity }>("/admin/seed-activities", {
    method: "POST",
    body: JSON.stringify(input),
  })
  return res.activity
}

export async function updateSeedActivity(id: string, patch: SeedActivityPatch): Promise<SeedActivity> {
  const res = await api<{ activity: SeedActivity }>(`/admin/seed-activities/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  })
  return res.activity
}

// Retire = soft deactivate (active=false); the row leaves the set schools consume but is not deleted.
export async function retireSeedActivity(id: string): Promise<SeedActivity> {
  const res = await api<{ activity: SeedActivity }>(`/admin/seed-activities/${id}`, {
    method: "DELETE",
  })
  return res.activity
}

// Re-instate a retired activity via PATCH active=true (per the BE contract).
export function reinstateSeedActivity(id: string): Promise<SeedActivity> {
  return updateSeedActivity(id, { active: true })
}
