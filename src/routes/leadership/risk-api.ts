import { api } from "../../api/client"

// FR-12-06 · GET /api/v1/risk/triage — the caller's own school's open triage-band flags, for
// human review (SC-038). Render-only: the BE is the single owner of the band decision; this
// screen never recomputes it.

export interface TriageFlag {
  flag_id: string
  student_id: string
  student_name: string
  type: "concern_word" | "slow_burn"
  risk_score: number
  created_at: string
}

export async function getTriageQueue(): Promise<{ flags: TriageFlag[] }> {
  return api<{ flags: TriageFlag[] }>("/risk/triage")
}

// FR-12-09 · GET /api/v1/flags/{id}/events — the immutable, append-only timeline around a flag
// (who was alerted, viewed, acted, escalated-to, and when). Read restricted to the flag's own
// school's staff (403 otherwise), same posture as `getTriageQueue` above. Render-only — no
// write path exists on this resource.
export interface FlagTimelineEvent {
  type: "alerted" | "viewed" | "acted" | "escalated"
  actor: string | null
  at: string
}

export async function getFlagEvents(flagId: string): Promise<{ events: FlagTimelineEvent[] }> {
  return api<{ events: FlagTimelineEvent[] }>(`/flags/${flagId}/events`)
}
