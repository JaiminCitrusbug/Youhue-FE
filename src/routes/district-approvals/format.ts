// Small, real (non-fabricated) presentational derivations from actual API data — no fixtures.

// Up to two initials from a real school name (e.g. "St. Aidan's" -> "SA"), for the PersonCell
// avatar the approved SchoolApprovals.tsx renders per row.
export function initialsOf(name: string): string {
  const letters = name
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, "").charAt(0))
    .filter(Boolean)
  const initials = (letters[0] ?? "") + (letters[1] ?? "")
  return initials.toUpperCase() || "?"
}

// The approved screen's "When" column reads "today" / "yesterday" for a real ISO timestamp;
// anything older falls back to a short absolute date so the queue stays legible.
export function relativeDay(iso: string): string {
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return iso
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(then)) / 86_400_000)
  if (diffDays === 0) return "today"
  if (diffDays === 1) return "yesterday"
  if (diffDays > 1) return `${diffDays} days ago`
  return then.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}
