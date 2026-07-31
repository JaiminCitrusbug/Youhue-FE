import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"

import {
  Banner, Button, Card, CardBody, CardHeader, EmptyState, Field, Icon, PageHeader, Tag, Textarea,
} from "@design/components"

import { getFlagStudent, sendNote, type FlagStudent } from "./api"

// FR-13-05 · SC-041 — Private supportive note: a teacher's quiet, private message to a student,
// visible to no one but the intended student and the sender (NEG gate — the whole point of this
// ticket). Reached from FR-13-04's guided-response screen ("Use & send a private note"), which
// carries only `flagId` — `GET /flags/{id}/student` (this ticket's own addition) resolves the real
// student to POST to and show, since `GuidanceOut` is frozen to `{suggested_wording, next_steps,
// links}` by FR-13-04's own exact-keys test and cannot carry identity.
//
// LOOK SOURCE — REUSE, NEVER RE-IMPLEMENT (CLAUDE.md step 7). `design/approved/screens/
// PrivateNote.tsx` is a STATIC PREVIEW with hardcoded fixtures; divergences from it, LOGGED:
//  (a) No `<AppShell {...chrome(...)}>` wrapper — same reasoning already logged on
//      `guided-response/index.tsx` / `student-detail/index.tsx`: the real routed `/app` layout
//      already supplies shell/nav, so only the approved CONTENT is composed here.
//  (b) The approved screen's `note` prop default ("Hi Liam — I noticed today was tough...") is an
//      illustrative FIXTURE, not real copy — never hardcoded here. The textarea starts from the
//      REAL suggested wording the teacher was already looking at on the guided-response screen
//      (passed via router `state`, possibly already adapted there), or empty if this screen is
//      reached with no such state (e.g. a direct navigation) — never a fabricated sample message.
//  (c) `studentName` is real data (`GET /flags/{id}/student`), not the approved screen's
//      `'Liam O.'` default prop.

export function PrivateNoteApp() {
  const { flagId } = useParams<{ flagId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const initialWording = (location.state as { wording?: string } | null)?.wording ?? ""

  const [target, setTarget] = useState<FlagStudent | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [body, setBody] = useState(initialWording)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  useEffect(() => {
    if (!flagId) return
    let cancelled = false
    getFlagStudent(flagId)
      .then((t) => {
        if (cancelled) return
        setTarget(t)
      })
      .catch(() => {
        if (cancelled) return
        setLoadError("Could not open this student's note. Please try again.")
      })
    return () => {
      cancelled = true
    }
  }, [flagId])

  if (loadError) {
    return (
      <EmptyState icon={<Icon.Alert />} title="Note could not be opened">
        {loadError}
      </EmptyState>
    )
  }
  if (target === null) {
    return <EmptyState title="Loading…" />
  }

  const first = target.student_name.split(" ")[0]

  function handleCancel() {
    if (flagId) navigate(`/app/flags/${flagId}/guidance`)
  }

  function handleSend() {
    if (!target || sending) return
    setSending(true)
    setSendError(null)
    sendNote(target.student_id, body)
      .then(() => {
        if (flagId) navigate(`/app/flags/${flagId}/guidance`)
      })
      .catch(() => {
        setSending(false)
        setSendError("Could not send this note. Please try again.")
      })
  }

  return (
    <>
      <PageHeader
        crumb="A quiet, private message — never shown publicly"
        title={<>Send a private note to {target.student_name}</>}
      />

      <div className="max-w-[620px]"> {/* token-ok: approved Design-final-v3 value, verbatim from screens/PrivateNote.tsx:32 (do-not-restyle) */}
        <Card>
          <CardHeader
            icon={<Icon.Pencil />}
            title="Your note"
            action={<Tag tone="ok" icon={<Icon.Lock />}>Private — only {first} sees this</Tag>}
          />
          <CardBody>
            <Field label="Message">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your note…"
                aria-label="Message"
              />
            </Field>
            <Banner tone="info" icon={<Icon.Shield />}>
              This note is private to the student — it is never posted to a class feed and no
              other staff member can see it.
            </Banner>
            {sendError && (
              <Banner tone="danger" icon={<Icon.Alert />}>
                {sendError}
              </Banner>
            )}
            <div className="flex flex-wrap gap-2.5">
              <Button
                variant="ink"
                icon={<Icon.Send />}
                onClick={handleSend}
                disabled={sending || body.trim().length === 0}
                className="disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send privately"}
              </Button>
              <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
