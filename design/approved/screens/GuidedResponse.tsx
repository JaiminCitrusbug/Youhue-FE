/**
 * SC-040 — Guided response  ·  FR-13-04  ·  US-13-04
 * Presentational only (props in, markup out; no data fetching, no business logic).
 * Turns "I don't know what to say" into a supported action: wording + next steps + links.
 */
import * as React from 'react'
import {
  AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Button, Icon,
} from '../components'

export interface GuidedResponseProps {
  studentName?: string
  meta?: string
  suggestedWording?: string
  nextSteps?: string[]
  links?: { icon: React.ReactNode; label: string }[]
  onUseNote?: () => void
  onAdapt?: () => void
  onLogResponse?: () => void
}

const DEFAULT_STEPS = [
  'Check in with Liam quietly at break — not in front of peers.',
  'Log the conversation in the intervention log.',
  'Loop in the pastoral lead if it continues.',
]

const DEFAULT_LINKS = [
  { icon: <Icon.Shield />, label: 'School safeguarding steps' },
  { icon: <Icon.Heart />, label: 'Friendship & belonging resources' },
  { icon: <Icon.Book />, label: 'When to escalate' },
]

export function GuidedResponse({
  studentName = 'Liam O.',
  meta = 'Immediate flag · Wed 08:47',
  suggestedWording = '“Hi Liam, I noticed today felt hard. I’m here — want to talk at break?”',
  nextSteps = DEFAULT_STEPS,
  links = DEFAULT_LINKS,
  onUseNote, onAdapt, onLogResponse,
}: GuidedResponseProps) {
  return (
    <AppShell {...chrome('teacher', 'Alerts & triage',
      <span><span className="font-semibold text-coral-text">Alerts</span> &nbsp;/&nbsp; {studentName} &nbsp;/&nbsp; Respond</span>)}>
      <PageHeader
        crumb="Guided response · turns “I don’t know what to say” into an action"
        title={<>Responding to {studentName}</>}
        sub={meta}
      />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-4">
          {/* suggested wording — a coral 'suggest' block */}
          <Card>
            <CardHeader icon={<Icon.Message />} title="Suggested wording" hint="use or adapt" />
            <CardBody>
              <div className="rounded-md border border-coral-100 bg-coral-50 px-3.5 py-3 text-sm leading-relaxed text-neutral-800">
                {suggestedWording}
              </div>
              <div className="mt-3.5 flex flex-wrap gap-2.5">
                <Button variant="ink" icon={<Icon.Pencil />} onClick={onUseNote}>Use &amp; send a private note</Button>
                <Button variant="ghost" onClick={onAdapt}>Adapt wording</Button>
              </div>
            </CardBody>
          </Card>

          {/* next steps */}
          <Card>
            <CardHeader icon={<Icon.CheckCircle />} title="Next steps" />
            <CardBody>
              <ol className="flex flex-col gap-2.5">
                {nextSteps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] text-neutral-700">
                    <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-sm bg-coral-50 text-[11px] font-bold text-coral-600">{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </div>

        {/* useful links */}
        <Card className="self-start">
          <CardHeader icon={<Icon.Link />} title="Useful links" />
          <CardBody>
            <div className="flex flex-col gap-0.5">
              {links.map((l, i) => (
                <a key={i} href="#" className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] font-semibold text-coral-text hover:bg-neutral-50 [&_svg]:h-[15px] [&_svg]:w-[15px] [&_svg]:text-neutral-400">
                  {l.icon}{l.label}
                </a>
              ))}
            </div>
            <div className="mt-2.5 border-t border-neutral-200 pt-3">
              <Button variant="ghost" block icon={<Icon.Book />} onClick={onLogResponse}>Log this response</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
