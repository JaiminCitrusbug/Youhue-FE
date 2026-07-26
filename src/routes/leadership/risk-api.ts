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
