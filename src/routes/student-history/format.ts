// Real, non-fabricated presentation of a `local_date` (YYYY-MM-DD, as the BE returns it) — no
// fixtures. Weekday+month+day matches the approved `MyHistory.tsx`'s recent-list date style
// ("Friday", "Thursday" ...), extended to remain legible past the current week (unlike the
// approved screen's illustrative "always this week" data).
export function historyDateLabel(localDate: string): string {
  const d = new Date(`${localDate}T00:00:00`)
  if (Number.isNaN(d.getTime())) return localDate
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
}
