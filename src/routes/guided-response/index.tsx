import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { Button, Card, CardBody, CardHeader, EmptyState, Icon, PageHeader } from "@design/components"

import { getGuidance, type Guidance } from "./api"

// FR-13-04 · SC-040 — Guided response: advisory wording + next steps + useful links for the
// teacher opening the response to a flagged check-in (`GET /flags/{id}/guidance`). The teacher may
// use, adapt or ignore every suggestion — nothing here forces, requires or auto-applies an action
// (ticket §Must-nots).
//
// LOOK SOURCE — REUSE, NEVER RE-IMPLEMENT (CLAUDE.md step 7). `design/approved/screens/
// GuidedResponse.tsx` is a STATIC PREVIEW with hardcoded fixtures; divergences from it, LOGGED:
//  (a) No `<AppShell {...chrome(...)}>` wrapper — same reasoning already logged on
//      `student-detail/index.tsx` / `leadership/TriageQueue.tsx`: the real routed `/app` layout
//      already supplies shell/nav, so only the approved CONTENT is composed here.
//  (b) `studentName` / `meta` (student name, flag band, raised time) are DROPPED from the header —
//      this ticket's endpoint returns ONLY `{ suggested_wording, next_steps[], links[] }` (its own
//      explicit DoD); there is no student/flag identity field to render, so nothing is invented.
//  (c) "Useful links" render as plain rows, not `<a href="#">` anchors — the API returns a label
//      only (no destination URL exists yet in this codebase), and a `href="#"` dead link is the
//      exact anti-pattern CLAUDE.md step 7 calls out from an earlier session.
//  (d) "Use & send a private note" is now WIRED FOR REAL (FR-13-05, SC-041 — no longer disabled):
//      navigates to `/app/flags/:flagId/note`, carrying the CURRENT suggested/adapted wording via
//      router `state` so the compose screen starts from what the teacher was already looking at.
//      `flagId` -> `student_id` is resolved there (`GET /flags/{id}/student`, FR-13-05's own
//      addition) since this screen's own endpoint carries no student identity (see (b)).
//  (e) "Log this response" stays disabled — its backing feature is the shared per-student
//      intervention log, M-13 Phase 2 (FR-13-01/02/03), still out of scope (this ticket owns only
//      the note action, not the log — ticket §Out-of-scope).
//  (f) "Adapt wording" IS wired for real (not disabled, not a stub): it toggles the suggested
//      wording into a local, editable textarea — a genuine use/adapt/ignore action needing no
//      backend at all, so it is a real convenience rather than a dead control.

export function GuidedResponseApp() {
  const { flagId } = useParams<{ flagId: string }>()
  const navigate = useNavigate()
  const [guidance, setGuidance] = useState<Guidance | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [adapting, setAdapting] = useState(false)
  const [wording, setWording] = useState("")

  useEffect(() => {
    if (!flagId) return
    let cancelled = false
    getGuidance(flagId)
      .then((g) => {
        if (cancelled) return
        setGuidance(g)
        setWording(g.suggested_wording)
      })
      .catch(() => {
        if (cancelled) return
        setError("Could not load guidance for this response. Please try again.")
      })
    return () => {
      cancelled = true
    }
  }, [flagId])

  if (error) {
    return (
      <EmptyState icon={<Icon.Alert />} title="Guidance could not be loaded">
        {error}
      </EmptyState>
    )
  }
  if (guidance === null) {
    return <EmptyState title="Loading guidance…" />
  }

  return (
    <>
      <PageHeader
        crumb={'Guided response · turns "I don’t know what to say" into an action'}
        title="Responding to this check-in"
      />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-4">
          {/* suggested wording — a coral 'suggest' block, verbatim from screens/GuidedResponse.tsx */}
          <Card>
            <CardHeader icon={<Icon.Message />} title="Suggested wording" hint="use or adapt" />
            <CardBody>
              {adapting ? (
                <textarea
                  value={wording}
                  onChange={(e) => setWording(e.target.value)}
                  rows={4}
                  aria-label="Adapt the suggested wording"
                  className="w-full rounded-md border border-coral-100 bg-coral-50 px-3.5 py-3 text-sm leading-relaxed text-neutral-800" // token-ok: approved value, verbatim from screens/GuidedResponse.tsx:57 (do-not-restyle)
                />
              ) : (
                <div className="rounded-md border border-coral-100 bg-coral-50 px-3.5 py-3 text-sm leading-relaxed text-neutral-800"> {/* token-ok: approved value, verbatim from screens/GuidedResponse.tsx:57 (do-not-restyle) */}
                  {wording}
                </div>
              )}
              <div className="mt-3.5 flex flex-wrap gap-2.5">
                <Button
                  variant="ink"
                  icon={<Icon.Pencil />}
                  onClick={() => {
                    if (flagId) navigate(`/app/flags/${flagId}/note`, { state: { wording } })
                  }}
                >
                  Use &amp; send a private note
                </Button>
                <Button variant="ghost" onClick={() => setAdapting((a) => !a)}>
                  {adapting ? "Done adapting" : "Adapt wording"}
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* next steps */}
          <Card>
            <CardHeader icon={<Icon.CheckCircle />} title="Next steps" />
            <CardBody>
              <ol className="flex flex-col gap-2.5">
                {guidance.next_steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] text-neutral-700"> {/* token-ok: approved value, verbatim from screens/GuidedResponse.tsx:73 (do-not-restyle) */}
                    <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-sm bg-coral-50 text-[11px] font-bold text-coral-600"> {/* token-ok: approved value, verbatim from screens/GuidedResponse.tsx:74 (do-not-restyle) */}
                      {i + 1}
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </div>

        {/* useful links — plain rows (no href="#" dead links; the API returns a label only) */}
        <Card className="self-start">
          <CardHeader icon={<Icon.Link />} title="Useful links" />
          <CardBody>
            <div className="flex flex-col gap-0.5">
              {guidance.links.map((l, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] font-semibold text-coral-text [&_svg]:h-[15px] [&_svg]:w-[15px] [&_svg]:text-neutral-400" // token-ok: approved value, verbatim from screens/GuidedResponse.tsx:89 (do-not-restyle)
                >
                  <Icon.Link />
                  {l.label}
                </div>
              ))}
            </div>
            <div className="mt-2.5 border-t border-neutral-200 pt-3">
              <Button
                variant="ghost"
                block
                icon={<Icon.Book />}
                disabled
                title="Coming soon — the intervention log is M-13 Phase 2"
                className="disabled:cursor-not-allowed disabled:opacity-50"
              >
                Log this response
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
