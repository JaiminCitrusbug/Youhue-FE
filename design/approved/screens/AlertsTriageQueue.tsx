/**
 * SC-038 — Alerts / triage queue  ·  FR-12-06  ·  US-12-06
 * Presentational only (props in, markup out; no data fetching, no business logic).
 * Priority band + student + "open" first; biased toward triage over silence.
 * Every displayed figure is RENDERED from props — never recomputed here.
 */
import {
  AppShell, chrome, PageHeader, Card, CardHeader, CardBody, StatTile, Table, PersonCell,
  Tag, SegmentedControl, Icon, theme,
} from '../components'

export interface FlagRow {
  priority: 'immediate' | 'triage'
  initials: string; name: string; band: string
  signal: string
  raised: string
  status: 'Open' | 'Escalated'
}

export interface AlertsTriageQueueProps {
  filter?: string
  onFilter?: (v: string) => void
  immediate?: number
  triage?: number
  acknowledged?: number
  medianAck?: string
  flags?: FlagRow[]
  onOpenFlag?: (name: string) => void
}

const DEFAULT_FLAGS: FlagRow[] = [
  { priority: 'immediate', initials: 'LO', name: 'Liam O.', band: 'Year 5 — Maple', signal: 'Concern-word “hurt” + AI 0.86', raised: '08:47', status: 'Open' },
  { priority: 'immediate', initials: 'BT', name: 'Ben T.', band: 'Year 5 — Oak', signal: 'AI risk 0.81', raised: '08:44', status: 'Escalated' },
  { priority: 'triage', initials: 'ZM', name: 'Zara M.', band: 'Year 5 — Maple', signal: 'Slow-burn low mood · 15 days', raised: 'overnight', status: 'Open' },
  { priority: 'triage', initials: 'ML', name: 'Mia L.', band: 'Year 5 — Maple', signal: 'AI risk 0.62', raised: '08:50', status: 'Open' },
]

export function AlertsTriageQueue({
  filter = 'All',
  onFilter,
  immediate = 2, triage = 2, acknowledged = 5, medianAck = '4',
  flags = DEFAULT_FLAGS,
  onOpenFlag,
}: AlertsTriageQueueProps) {
  return (
    <AppShell {...chrome('teacher', 'Alerts & triage',
      <span><span className="font-semibold text-coral-text">Teacher</span> &nbsp;/&nbsp; Alerts &amp; triage</span>)}>
      <PageHeader
        crumb="Safeguarding · biased toward triage over silence"
        title="Needs attention now"
        sub="Year 5 — Maple · live · as of 09:12 school time"
        right={<SegmentedControl options={['All', 'Immediate', 'Triage']} value={filter} onChange={onFilter} />}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Immediate" icon={<Icon.Alert />}
          value={<span style={{ color: theme.colors.status.danger }}>{immediate}</span>} delta="alert configured adults" />
        <StatTile label="Triage queue" icon={<Icon.Clock />}
          value={<span style={{ color: theme.colors.status.warn }}>{triage}</span>} delta="review today" />
        <StatTile label="Acknowledged" icon={<Icon.CheckCircle />} value={acknowledged} delta="in last 24h" />
        <StatTile label="Median ack time" icon={<Icon.Eye />} value={medianAck} unit="min" delta="well under target" />
      </div>

      <Card>
        <CardHeader icon={<Icon.Flag />} title="Open flags" hint="most urgent first" />
        <CardBody flush>
          <Table
            head={['Priority', 'Student', 'Signal', 'Raised', 'Status', '']}
            rows={flags.map((f) => [
              f.priority === 'immediate'
                ? <Tag tone="danger" icon={<Icon.Alert />}>Immediate</Tag>
                : <Tag tone="warn" icon={<Icon.Clock />}>Triage</Tag>,
              <PersonCell initials={f.initials} name={f.name} sub={f.band} />,
              <span className="text-neutral-700">{f.signal}</span>,
              <span className="text-neutral-500">{f.raised}</span>,
              f.status === 'Escalated' ? <Tag tone="warn">Escalated</Tag> : <Tag tone="ink">Open</Tag>,
              <button className="text-neutral-400" onClick={() => onOpenFlag?.(f.name)}><Icon.ChevronRight className="h-[15px] w-[15px]" /></button>,
            ])}
          />
        </CardBody>
      </Card>
    </AppShell>
  )
}
