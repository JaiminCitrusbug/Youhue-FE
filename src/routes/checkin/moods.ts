import type { Mood } from "@design/components"

// FR-04-01 — the fixed label/order ladder the approved `StudentCheckIn.tsx` / `StudentReflection.tsx`
// screens hardcode (great/good/ok/worried/sad/angry, most-positive-first). The SET shown to a given
// student is config-driven (BE `GET /check-ins/mood-set`, ticket Q-3) — this file only carries the
// fixed value<->label<->Mood encoding, matching `CheckIn.mood_value` (BE `config/env_config.py`
// comment: 0=angry .. 5=great). Never invented copy — every label is verbatim from the design.
export const MOOD_ORDER: { mood: Mood; label: string; value: number }[] = [
  { mood: "great", label: "Great", value: 5 },
  { mood: "good", label: "Good", value: 4 },
  { mood: "ok", label: "OK", value: 3 },
  { mood: "worried", label: "Worried", value: 2 },
  { mood: "sad", label: "Sad", value: 1 },
  { mood: "angry", label: "Angry", value: 0 },
]

export function moodEntryForValue(value: number) {
  return MOOD_ORDER.find((m) => m.value === value) ?? null
}
