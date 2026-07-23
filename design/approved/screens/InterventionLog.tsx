/**
 * SC-042 — Intervention log  ·  FR-13-01  ·  US-13-01
 * Presentational only (props in, markup out; no data fetching, no business logic).
 * Involved-staff-only, append-only status record: every entry is timestamped and immutable.
 */
import {
  AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Timeline, TimelineEntry,
  Field, Textarea, Select, Button, Banner, Icon,
} from '../components'

const STATUSES = ['Open', 'In progress', 'Monitoring', 'Closed'] as const
type Status = typeof STATUSES[number]

export interface InterventionLogProps {
  studentName?: string
  meta?: string
  status?: Status
  entries?: TimelineEntry[]
  onSave?: () => void
}

const DEFAULT_ENTRIES: TimelineEntry[] = [
  { time: 'Thu 14:20', who: 'J. Mensah · Pastoral lead', tone: 'acted', event: 'Called home; parent aware and supportive. Agreed to monitor and check in Friday.' },
  { time: 'Wed 11:05', who: 'R. Okafor · Teacher', tone: 'acted', event: 'Spoke with Liam at break — feeling isolated after a fallout. Next: pair with a buddy at lunch.' },
  { time: 'Wed 08:52', who: 'System', event: 'Intervention opened from an Immediate flag.' },
]

export function InterventionLog({
  studentName = 'Liam O.',
  meta = 'Started Wed · 2 staff involved',
  status = 'In progress',
  entries = DEFAULT_ENTRIES,
  onSave,
}: InterventionLogProps) {
  return (
    <AppShell {...chrome('teacher', 'Roster',
      <span><span className="font-semibold text-coral-text">{studentName}</span> &nbsp;/&nbsp; Intervention log</span>)}>
      <PageHeader
        crumb="Involved staff only · append-only record"
        title={<>Intervention — {studentName}</>}
        sub={meta}
        right={
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[12px] font-medium text-neutral-500">Status</span>
            {STATUSES.map((s) => (
              <span key={s}
                className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-[12px] font-semibold [&_svg]:h-3 [&_svg]:w-3 ${
                  s === status ? 'bg-status-warnBg text-status-warn' : 'border border-neutral-200 bg-surface text-neutral-500'
                }`}>
                {s === status && <Icon.Clock />}{s}
              </span>
            ))}
          </div>
        }
      />

      <Banner tone="info" icon={<Icon.Lock />}>
        Only staff working with this student can view or add to this log. Every entry is timestamped and cannot be edited or deleted.
      </Banner>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader icon={<Icon.Book />} title="Entries" hint="newest first" />
          <Timeline entries={entries} />
        </Card>

        <Card className="self-start">
          <CardHeader icon={<Icon.Plus />} title="Add an entry" />
          <CardBody>
            <Field label="What happened / next step">
              <Textarea placeholder="Describe the action taken and the next step…" />
            </Field>
            <Field label="Update status">
              <Select defaultValue={status}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </Field>
            <Button variant="ink" block icon={<Icon.CheckCircle />} onClick={onSave}>Save entry</Button>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
