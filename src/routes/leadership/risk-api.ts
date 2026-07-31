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

// FR-12-08 (GATE G-8) · POST /api/v1/alerts/{flagId}/acknowledge — records that a configured
// adult has seen and is handling this alert; the structural minimum this ticket adds so the
// negative gate (an acknowledged alert never escalates) is real and testable — no earlier ticket
// owns an acknowledge write path. Idempotent: acknowledging twice is not an error.
export async function acknowledgeAlert(flagId: string): Promise<{ flag_id: string; status: string }> {
  return api<{ flag_id: string; status: string }>(`/alerts/${flagId}/acknowledge`, { method: "POST" })
}

// FR-12-08 (GATE G-8) · POST /api/v1/alerts/{flagId}/escalate — a scheduled/background system
// process escalates an alerted, unacknowledged flag to the next configured adult (FR-12-05's
// ordered list); 409 if the flag has already been acknowledged. No manual "Escalate" control
// exists on the approved screen (SC-039) — escalation state is rendered from the timeline
// (an `escalated` event), never triggered from this UI.
export async function escalateAlert(flagId: string): Promise<{ flag_id: string; escalated_to: string }> {
  return api<{ flag_id: string; escalated_to: string }>(`/alerts/${flagId}/escalate`, { method: "POST" })
}

export function alertActionErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : ""
  const status = Number(/(\d{3})/.exec(msg)?.[1])
  if (status === 409) return "This alert has already been acknowledged."
  if (status === 403) return "You don't have permission to act on this alert."
  return "Something went wrong. Please try again."
}
