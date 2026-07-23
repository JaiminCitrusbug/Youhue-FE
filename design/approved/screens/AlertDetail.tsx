/**
 * SC-039 — Alert detail + immutable timeline  ·  FR-12-09  ·  US-12-09
 * Presentational only (props in, markup out; no data fetching, no business logic).
 * The trust-carrying surface: the timeline must read as authoritative & append-only.
 * Every displayed figure is RENDERED from props — never recomputed here.
 */
import {
  AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Timeline, TimelineEntry,
  Tag, Button, MoodFace, Mood, Icon, theme,
} from '../components'

export interface AlertDetailProps {
  studentName?: string
  crumbFlag?: string
  meta?: string
  band?: string
  signal?: string
  checkIn?: string
  mood?: Mood
  moodLabel?: string
  quote?: string
  timeline?: TimelineEntry[]
  nextSteps?: string[]
  onAcknowledge?: () => void
  onGuidedResponse?: () => void
  onPrivateNote?: () => void
  onInterventionLog?: () => void
  onSendNote?: () => void
}

const DEFAULT_TIMELINE: TimelineEntry[] = [
  { time: '08:47', who: 'System', tone: 'system', event: <>Alerted R. Okafor <span className="text-neutral-500">· email + in-app</span></> },
  { time: '08:49', who: '', tone: 'gap', event: <>No acknowledgement within 2 min</> },
  { time: '08:52', who: 'System', tone: 'system', event: <>Escalated to pastoral lead <span className="text-neutral-500">· J. Mensah</span></> },
  { time: '08:55', who: 'J. Mensah', tone: 'acted', event: <>Viewed &amp; acknowledged</> },
]

const DEFAULT_STEPS = [
  'Check in with Liam quietly at break — not in front of peers.',
  'Send a private supportive note now, then log the conversation.',
  'Loop in the pastoral lead; open the intervention log.',
]

export function AlertDetail({
  studentName = 'Liam O.',
  crumbFlag = 'Flag · concern-word + slow-burn',
  meta = 'Year 5 — Maple · raised Wed 08:47 · school time',
  band = 'Immediate — alert configured adults',
  signal = 'Concern-word “hurt” + AI risk 0.86',
  checkIn = 'Wed 08:47 · Mood: Sad',
  mood = 'sad',
  moodLabel = 'Sad',
  quote = '“argument at lunch, no one to sit with, don’t want to be here”',
  timeline = DEFAULT_TIMELINE,
  nextSteps = DEFAULT_STEPS,
  onAcknowledge, onGuidedResponse, onPrivateNote, onInterventionLog, onSendNote,
}: AlertDetailProps) {
  return (
    <AppShell {...chrome('teacher', 'Alerts & triage',
      <span><span className="font-semibold text-coral-text">Alerts &amp; triage</span> &nbsp;/&nbsp; {studentName}</span>)}>
      <PageHeader
        crumb={crumbFlag}
        title={<>{studentName} <Tag tone="danger" icon={<Icon.Alert />}>Immediate</Tag></>}
        sub={meta}
      />

      {/* actions — a human acts; acknowledge is primary */}
      <div className="mb-4 flex flex-wrap gap-2.5">
        <Button variant="ink" icon={<Icon.CheckCircle />} onClick={onAcknowledge}>Acknowledge</Button>
        <Button variant="ghost" icon={<Icon.Message />} onClick={onGuidedResponse}>Guided response</Button>
        <Button variant="ghost" icon={<Icon.Pencil />} onClick={onPrivateNote}>Private note</Button>
        <Button variant="ghost" icon={<Icon.Book />} onClick={onInterventionLog}>Intervention log</Button>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-md border border-neutral-200 bg-surface p-3 shadow-card">
          <span className="mb-1.5 block text-[11px] font-medium text-neutral-500">Band</span>
          <b className="text-sm font-semibold leading-snug">{band}</b>
        </div>
        <div className="rounded-md border border-neutral-200 bg-surface p-3 shadow-card">
          <span className="mb-1.5 block text-[11px] font-medium text-neutral-500">Signal</span>
          <b className="text-sm font-semibold leading-snug">{signal}</b>
        </div>
        <div className="rounded-md border border-neutral-200 bg-surface p-3 shadow-card">
          <span className="mb-1.5 block text-[11px] font-medium text-neutral-500">Check-in</span>
          <b className="text-sm font-semibold leading-snug">{checkIn}</b>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.65fr_1fr]">
        <div className="flex flex-col gap-4">
          {/* the check-in */}
          <Card>
            <CardHeader icon={<Icon.Message />} title="The check-in" />
            <CardBody>
              <div className="mb-3 flex items-center gap-2.5">
                <MoodFace mood={mood} size={34} />
                <b className="text-sm font-semibold">{moodLabel}</b>
                <Tag tone="mut">flagged</Tag>
              </div>
              <blockquote
                className="rounded-md border border-l-[3px] border-neutral-200 bg-neutral-50 px-3.5 py-3 text-[13.5px] italic text-neutral-700"
                style={{ borderLeftColor: theme.colors.mood.sad }}>
                {quote}
              </blockquote>
            </CardBody>
          </Card>

          {/* the immutable timeline — the thesis surface */}
          <Card>
            <CardHeader icon={<Icon.Clock />} title="Timeline"
              action={<Tag tone="mut" icon={<Icon.Lock />}>Immutable · append-only</Tag>} />
            <Timeline entries={timeline} />
          </Card>
        </div>

        {/* suggested next steps — a human acts */}
        <Card className="self-start">
          <CardHeader icon={<Icon.Message />} title="Suggested next steps" hint="a human acts" />
          <CardBody>
            <ol className="flex flex-col gap-2.5">
              {nextSteps.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] text-neutral-700">
                  <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-sm bg-coral-50 text-[11px] font-bold text-coral-600">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <div className="mt-3 border-t border-neutral-200 pt-3">
              <Button variant="ink" block icon={<Icon.Pencil />} onClick={onSendNote}>Send a private note</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
