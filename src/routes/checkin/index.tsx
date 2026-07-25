import { useEffect, useState } from "react"
import { Navigate, Route, Routes, useNavigate } from "react-router-dom"

import { Banner, Icon, MoodFace } from "@design/components"

import { CheckInApiError, getCheckInConfig, submitCheckIn } from "./api"
import { MoodScreen } from "./MoodScreen"
import { moodEntryForValue } from "./moods"
import { ReflectionScreen } from "./ReflectionScreen"

// FR-04-01 · SC-023 — the real daily check-in container, mounted at `/student/*` (replaces the
// bare stand-in heading `routes/index.tsx` used before this ticket built the real screen). Owns
// the flow's shared state
// (the age-appropriate mood set, the chosen mood, the reflection draft) across its two STEPS —
// mood-select (index) then reflection (`/student/reflection`) — the same "one container, nested
// Routes" pattern `student-signin/index.tsx` already uses for its own multi-step flow.
//
//   /student             -> SC-023 step 1  mood select
//   /student/reflection  -> SC-023 step 2  reflection (own page, per the ticket's interaction
//                            contract — reached only after a mood is chosen)

const MOOD_PATH = "/student"
const REFLECTION_PATH = "/student/reflection"

export function CheckInApp() {
  const navigate = useNavigate()

  const [moodValues, setMoodValues] = useState<number[]>([])
  const [readAloud, setReadAloud] = useState(false)
  const [loadingMoodSet, setLoadingMoodSet] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [reflection, setReflection] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [reflectionRequired, setReflectionRequired] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    getCheckInConfig()
      .then((res) => {
        if (cancelled) return
        setMoodValues(res.mood_set)
        setReadAloud(res.read_aloud)
        setLoadingMoodSet(false)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setLoadError(
          e instanceof CheckInApiError ? e.message : "Couldn't load your check-in. Please try again.",
        )
        setLoadingMoodSet(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function submit(reflectionText: string) {
    if (selectedMood === null) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await submitCheckIn(selectedMood, reflectionText || undefined)
      setSubmitting(false)
      setDone(true)
    } catch (e) {
      setSubmitting(false)
      if (e instanceof CheckInApiError) {
        setSubmitError(e.message)
        if (e.status === 422) setReflectionRequired(true) // the school does require one — reveal it
      } else {
        setSubmitError("Something went wrong. Please try again.")
      }
    }
  }

  // Not from an approved screen — neither `StudentCheckIn.tsx` nor `StudentReflection.tsx` defines
  // a post-submit confirmation state, and the ticket's scope stops at "the reflection is saved
  // with the check-in". Rather than invent new bespoke markup for one, this reuses ONLY the
  // existing `Banner`/`MoodFace` primitives — no new typography/layout is authored — so the
  // student still gets real closure on a sub-one-minute flow instead of silently landing nowhere.
  if (done) {
    const chosen = selectedMood === null ? null : moodEntryForValue(selectedMood)
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 text-center">
        {chosen ? <MoodFace mood={chosen.mood} size={64} /> : null}
        <Banner tone="info" icon={<Icon.Check />}>
          Your check-in for today is saved. See you tomorrow.
        </Banner>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        index
        element={
          <MoodScreen
            loading={loadingMoodSet}
            error={loadError}
            allowedValues={moodValues}
            readAloud={readAloud}
            selected={selectedMood}
            onSelect={setSelectedMood}
            onContinue={() => navigate(REFLECTION_PATH)}
          />
        }
      />
      <Route
        path="reflection"
        element={
          selectedMood === null ? (
            <Navigate to={MOOD_PATH} replace />
          ) : (
            <ReflectionScreen
              chosenMood={moodEntryForValue(selectedMood)?.mood ?? "ok"}
              chosenLabel={moodEntryForValue(selectedMood)?.label ?? "OK"}
              reflection={reflection}
              onReflectionChange={setReflection}
              onBack={() => navigate(MOOD_PATH)}
              onSkip={() => void submit("")}
              onDone={() => void submit(reflection)}
              submitting={submitting}
              error={submitError}
              reflectionRequired={reflectionRequired}
            />
          )
        }
      />
    </Routes>
  )
}
