/**
 * SC-027 — Class dashboard  ·  FR-10-01  ·  US-10-01
 * Presentational only (props in, markup out; no data fetching, no business logic).
 * Every displayed figure is RENDERED from props — never recomputed here (SRS §13.5 single-owner formulas).
 * Priority: the "students needing a look" list + flags outrank the mood-index number.
 */
import {
  AppShell, PageHeader, NavItem, Person, Card, CardHeader, CardBody, StatTile, Table, PersonCell,
  Tag, Trend, Button, Icon, MoodDot,
} from '../components'
import { theme } from '../../theme/tailwind.theme'

const TEACHER_NAV: NavItem[] = [
  { key: 'dash', label: 'Dashboard', icon: <Icon.Grid /> },
  { key: 'alerts', label: 'Alerts & triage', icon: <Icon.Alert />, badge: 3 },
  { key: 'roster', label: 'Roster', icon: <Icon.Users /> },
  { key: 'groups', label: 'Groups', icon: <Icon.Layers /> },
  { key: 'activities', label: 'Activities', icon: <Icon.Book /> },
  { key: 'reports', label: 'Reports', icon: <Icon.Report /> },
  { key: 'school', label: 'School', icon: null, section: true },
  { key: 'settings', label: 'Settings', icon: <Icon.Cog /> },
]

export interface StudentRow {
  initials: string; name: string; band: string
  trendDir: 'up' | 'down' | 'flat'; trendMood: keyof typeof theme.colors.mood; trendLabel: string
  participation: string
  flag?: { tone: 'danger' | 'warn'; label: string }
}

export interface ClassDashboardProps {
  person?: Person
  className?: string
  asOf?: string
  moodIndex?: string
  moodDelta?: string
  participation?: string
  participationSub?: string
  openFlags?: { immediate: number; triage: number }
  students?: StudentRow[]
  onOpenStudent?: (name: string) => void
}

const DEFAULT_STUDENTS: StudentRow[] = [
  { initials: 'LO', name: 'Liam O.', band: '8–11 · Maple', trendDir: 'down', trendMood: 'sad', trendLabel: 'Falling 3 wks', participation: '3/5', flag: { tone: 'danger', label: 'Immediate' } },
  { initials: 'ZM', name: 'Zara M.', band: '8–11 · Maple', trendDir: 'flat', trendMood: 'ok', trendLabel: 'Low, flat', participation: '5/5', flag: { tone: 'warn', label: 'Triage' } },
  { initials: 'ML', name: 'Mia L.', band: '8–11 · Maple', trendDir: 'down', trendMood: 'worried', trendLabel: 'Slipping', participation: '4/5', flag: { tone: 'warn', label: 'Triage' } },
  { initials: 'NP', name: 'Noah P.', band: '8–11 · Maple', trendDir: 'up', trendMood: 'good', trendLabel: 'Improving', participation: '4/5' },
  { initials: 'AK', name: 'Aisha K.', band: '8–11 · Maple', trendDir: 'up', trendMood: 'great', trendLabel: 'Steady, good', participation: '5/5' },
]

export function ClassDashboard({
  person = { initials: 'RO', name: 'R. Okafor', role: 'Teacher' },
  className = 'Year 5 — Maple',
  asOf = 'This week · as of today 09:10 · school time',
  moodIndex = '6.8', moodDelta = '+0.4 vs last week',
  participation = '24', participationSub = '86% checked in · 4 not yet in',
  openFlags = { immediate: 1, triage: 2 },
  students = DEFAULT_STUDENTS,
  onOpenStudent,
}: ClassDashboardProps) {
  const brand = (
    <>
      <span className="grid h-[30px] w-[30px] place-items-center rounded-md bg-ink">
        <Icon.Heart className="h-4 w-4 text-coral" />
      </span>
      <span className="text-sm font-extrabold tracking-tight">Wellbeing<span className="block text-[9.5px] font-semibold uppercase tracking-wider text-neutral-400">Staff</span></span>
    </>
  )
  const flagColor = (m: keyof typeof theme.colors.mood) => theme.colors.mood[m]

  return (
    <AppShell brand={brand} nav={TEACHER_NAV} active="Dashboard" person={person} bellIcon={<Icon.Bell className="h-4 w-4" />}
      crumb={<span>My classes · Year 5</span>}>
      <PageHeader crumb="My classes · Year 5" title={className} sub={asOf} />

      {/* stat tiles — mood-index delta is a REAL change; participation sub is neutral */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatTile label="Class mood index" icon={<Icon.Heart />} value={moodIndex} unit="/ 10"
          delta={moodDelta} deltaTone="up" deltaIcon={<Icon.ArrowUp />} />
        <StatTile label="Participation" icon={<Icon.Check />} value={participation} unit="/ 28" delta={participationSub} />
        <StatTile label="Open flags" icon={<Icon.Flag />} value={openFlags.immediate + openFlags.triage}
          delta={<span className="flex gap-1.5"><Tag tone="danger" icon={<Icon.Alert />}>{openFlags.immediate} Immediate</Tag><Tag tone="warn" icon={<Icon.Clock />}>{openFlags.triage} Triage</Tag></span>} />
      </div>

      {/* the triage list is the anchor */}
      <Card>
        <CardHeader icon={<Icon.Eye />} title="Students needing a look" hint="ranked by concern" />
        <CardBody flush>
          <Table
            head={['Student', 'Mood trend', 'Participation', 'Flag', '']}
            rows={students.map((s) => [
              <PersonCell initials={s.initials} name={s.name} sub={s.band} />,
              <Trend dir={s.trendDir} dotColor={flagColor(s.trendMood)}>
                {s.trendDir === 'down' ? <Icon.ArrowDown /> : s.trendDir === 'up' ? <Icon.ArrowUp /> : <Icon.Minus />}
                {s.trendLabel}
              </Trend>,
              <span className="text-[12.5px] font-semibold">{s.participation}</span>,
              s.flag ? <Tag tone={s.flag.tone} icon={s.flag.tone === 'danger' ? <Icon.Alert /> : <Icon.Clock />}>{s.flag.label}</Tag> : <Tag tone="mut">No flag</Tag>,
              <button className="text-neutral-400" onClick={() => onOpenStudent?.(s.name)}><Icon.ChevronRight className="h-[15px] w-[15px]" /></button>,
            ])}
          />
        </CardBody>
      </Card>
    </AppShell>
  )
}
