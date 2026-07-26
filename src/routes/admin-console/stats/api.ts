import { api } from "../../../api/client"

// FR-19-07 · GET /api/v1/admin/stats — platform-wide read-only aggregates (SC-074): schools,
// active trials, check-in volume, alert volume. `view_statistics`-gated; an empty platform
// returns all-zero counts, not an error.

export interface PlatformStats {
  schools: number
  active_trials: number
  checkin_volume: number
  alert_volume: number
}

export function adminStatsErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : ""
  const status = Number(/(\d{3})/.exec(msg)?.[1])
  if (status === 403) return "You don't have permission to view platform statistics."
  return "Something went wrong. Please try again."
}

export async function getPlatformStats(): Promise<PlatformStats> {
  return api<PlatformStats>("/admin/stats")
}
