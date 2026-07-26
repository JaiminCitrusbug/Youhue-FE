import { getToken } from "../../api/client"

// FR-17-01 · GET /api/v1/schools/{id}/entitlements — the caller's own school's tier + the
// feature set it unlocks. Read-only; the entitlement engine is the single owner of this
// decision, this screen only renders it.

const BASE = "/api/v1"

export type Tier = "free" | "premium"

export interface EntitlementsResponse {
  tier: Tier
  features: string[]
}

export class EntitlementsApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function getEntitlements(schoolId: string): Promise<EntitlementsResponse> {
  const token = getToken()
  const res = await fetch(`${BASE}/schools/${schoolId}/entitlements`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    let detail = "Couldn't load your plan. Please try again."
    try {
      const body = (await res.json()) as { detail?: string }
      if (body.detail) detail = body.detail
    } catch {
      // no/invalid JSON body — keep the generic message, still surfaced via the thrown error
    }
    throw new EntitlementsApiError(res.status, detail)
  }
  return (await res.json()) as EntitlementsResponse
}

// FR-17-01 DoD text (verbatim feature keys the BE returns) — the human-readable label mapping
// this screen renders. Kept alongside the API layer since it's a 1:1 presentation concern, not
// business logic (the entitlement DECISION is entirely server-side).
export const FEATURE_LABELS: Record<string, string> = {
  daily_checkins: "Daily check-ins",
  basic_mood_trends: "Basic mood trends",
  unlimited_students_and_classes: "Unlimited students and classes",
  colleague_invites: "Colleague invites",
  young_child_simple_mode: "Young-child simple mode",
  basic_activity_set: "Basic activity set",
  custom_checkins: "Custom check-ins",
  alerts_and_intervention_tracking: "Alerts and intervention tracking",
  ai_analysis: "AI analysis",
  richer_dashboards: "Richer dashboards",
  reports: "Reports",
  school_district_views: "School / district views",
  roster_sync: "Roster sync",
  calendar: "Calendar",
  access_windows: "Access windows",
  onboarding: "Onboarding",
}
