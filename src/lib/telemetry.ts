// Structured client telemetry for the FR-01-05 auth/session flow (ticket DoD §33).
// Payloads carry NO PII/PHI (frontend.md / Baseline BR-04). Console sink for now — swap for a
// real transport later without touching call sites.
export type AuthFlowEvent =
  | "fr_01_05_success"
  | "fr_01_05_rejected"
  | "fr_01_05_forbidden"
  | "fr_01_05_error"

export function logAuthEvent(event: AuthFlowEvent): void {
  console.info(JSON.stringify({ event, at: new Date().toISOString() }))
}
