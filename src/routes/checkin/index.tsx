import { useCallback, useEffect, useRef, useState } from "react"
import { Navigate, Route, Routes, useNavigate } from "react-router-dom"

import { Banner, Icon, MoodFace } from "@design/components"

import { ActivityScreen } from "./ActivityScreen"
import {
  type ActivityOffer,
  CheckInApiError,
  getCheckInConfig,
  recordActivityEngagement,
  submitCheckIn,
  syncCheckIn,
} from "./api"
import { MoodScreen } from "./MoodScreen"
import { moodEntryForValue } from "./moods"
import { indexedDbStore, type OfflineStore } from "./offlineStore"
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

export function CheckInApp({
  offlineStore = indexedDbStore,
}: { offlineStore?: OfflineStore } = {}) {
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
  const [retainedOffline, setRetainedOffline] = useState(false)
  const syncingRef = useRef(false)

  // FR-05-01 — the activity offered on THIS submit (foreground path only; a background retained-
  // offline sync, see `trySyncRetained` below, does not surface one — same as today's already
  // established discard of that response's other fields). `activityHandled` gates the fall-through
  // to the plain "done" banner once the student starts or skips.
  const [checkinId, setCheckinId] = useState<string | null>(null)
  const [activityOffer, setActivityOffer] = useState<ActivityOffer | null>(null)
  const [activityHandled, setActivityHandled] = useState(false)
  const [activityStarting, setActivityStarting] = useState(false)

  // FR-04-06 — auto-submit a retained offline check-in once we're back online: run once on mount
  // (covers "the app was reopened after being offline the whole time") and again on every browser
  // `online` event (covers "connectivity returned while the app stayed open").
  const trySyncRetained = useCallback(async () => {
    if (syncingRef.current) return
    syncingRef.current = true
    try {
      const pending = await offlineStore.get()
      if (!pending) return
      await syncCheckIn(pending.clientEntryId, pending.moodValue, pending.reflectionText || undefined)
      await offlineStore.clear()
      setRetainedOffline(false)
      setDone(true)
    } catch (e) {
      if (e instanceof CheckInApiError) {
        // A real server response (403/409/422/500) — this sync is resolved, a bare retry can
        // never turn it into a success, so stop retaining it and surface the same error the
        // student would have seen submitting live rather than leaving them stuck in limbo. This
        // is a BACKGROUND sync (could complete while the student is on the mood-select screen,
        // not the reflection screen where `submitError` renders), so it goes through `loadError`
        // — the mood screen's own error slot — which is always the visible screen when this fires.
        await offlineStore.clear().catch(() => {
          /* best-effort — nothing more to do if even clearing the store fails */
        })
        setRetainedOffline(false)
        setLoadError(e.message)
      }
      // else: a genuine network failure, OR the store itself couldn't be read (e.g. IndexedDB
      // unavailable) — nothing safe to do; leave state as-is, the next mount/`online` event tries
      // again. Never surface an error for a background sync attempt.
    } finally {
      syncingRef.current = false
    }
  }, [offlineStore])

  useEffect(() => {
    void trySyncRetained()
    const onOnline = () => void trySyncRetained()
    window.addEventListener("online", onOnline)
    return () => window.removeEventListener("online", onOnline)
  }, [trySyncRetained])

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
      const res = await submitCheckIn(selectedMood, reflectionText || undefined)
      setCheckinId(res.checkin_id)
      setActivityOffer(res.activity_offer)
      setSubmitting(false)
      setDone(true)
    } catch (e) {
      setSubmitting(false)
      if (e instanceof CheckInApiError) {
        setSubmitError(e.message)
        if (e.status === 422) setReflectionRequired(true) // the school does require one — reveal it
      } else {
        // FR-04-06 — `submitCheckIn` only throws `CheckInApiError` for a real server response; any
        // other error means the request never got one (the connection dropped mid-check-in, per the
        // ticket's own scenario) — retain the completed entry locally rather than losing it, and
        // auto-submit it later (see `trySyncRetained` above) instead of showing a dead-end error.
        await offlineStore.save({
          clientEntryId: crypto.randomUUID(),
          moodValue: selectedMood,
          reflectionText,
        })
        setRetainedOffline(true)
      }
    }
  }

  // FR-05-01 — record that the student started the offered activity. Best-effort (ticket: the
  // activity is optional and never blocks) — a failure here must never trap the student on this
  // screen; either way they proceed to the closure banner.
  async function startActivity(id: string) {
    setActivityStarting(true)
    try {
      await recordActivityEngagement(id, "started")
    } catch {
      // swallow — see comment above
    } finally {
      setActivityStarting(false)
      setActivityHandled(true)
    }
  }

  // FR-04-06 · SC-023 s3 (offline/retained) — the approved `StudentCheckIn.tsx` does not define
  // this state's markup either (same gap as the "done" state below); reuses ONLY the existing
  // `Banner`/`Icon` primitives, no new typography/layout authored.
  if (retainedOffline) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 text-center">
        <Banner tone="warn" icon={<Icon.Refresh />}>
          Your check-in is saved on this device. It will be sent automatically once you&apos;re back
          online.
        </Banner>
      </div>
    )
  }

  // FR-05-01 — offer the short guided activity before the plain closure banner, exactly once
  // (`activityHandled` flips true on Start or Skip, falling through to the banner below).
  if (done && activityOffer && !activityHandled && checkinId) {
    return (
      <ActivityScreen
        activityTitle={activityOffer.title}
        starting={activityStarting}
        onStart={() => void startActivity(checkinId)}
        onSkip={() => setActivityHandled(true)}
      />
    )
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
