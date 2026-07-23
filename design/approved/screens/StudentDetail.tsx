/**
 * SC-028 — Student detail  ·  FR-10-02  ·  US-10-02
 * Presentational only (props in, markup out; no data fetching, no business logic).
 * History, reflections, participation — the AI panel only SUGGESTS; a human assigns.
 * Every displayed figure is RENDERED from props — never recomputed here.
 */
import {
  AppShell, chrome, PageHeader, Card, CardHeader, CardBody, KV, Table,
  Tag, Button, Banner, MoodDot, Mood, Icon, theme,
} from '../components'

interface MoodPoint { x: number; y: number; mood: Mood }
interface Reflection { day: string; mood: Mood; label: string; note: string }

export interface StudentDetailProps {
  studentName?: string
  band?: string
  sub?: string
  participation?: string
  moodTrend?: string
  lastCheckIn?: string
  moodDays?: string[]
  moodPoints?: MoodPoint[]
  reflections?: Reflection[]
  activityTitle?: string
  activityBand?: string
  onAssignActivity?: () => void
  onRespond?: () => void
  onAssign?: () => void
  onGuidedResponse?: () => void
  onPrivateNote?: () => void
  onInterventionLog?: () => void
}

const DEFAULT_POINTS: MoodPoint[] = [
  { x: 20, y: 34, mood: 'good' },
  { x: 90, y: 30, mood: 'good' },
  { x: 160, y: 58, mood: 'ok' },
  { x: 230, y: 74, mood: 'sad' },
  { x: 300, y: 72, mood: 'sad' },
]

const DEFAULT_REFLECTIONS: Reflection[] = [
  { day: 'Wed', mood: 'sad', label: 'Sad', note: 'Argument at lunch, no one to sit with' },
  { day: 'Thu', mood: 'sad', label: 'Sad', note: 'Didn’t want to come in' },
  { day: 'Tue', mood: 'ok', label: 'OK', note: 'Tired after football' },
]

export function StudentDetail({
  studentName = 'Liam O.',
  band = 'Year 5 — Maple',
  sub = 'Age band 8–11 · your student',
  participation = '3 / 5 this week · 60%',
  moodTrend = 'Falling · 3 weeks',
  lastCheckIn = 'Wed 08:47 · Sad',
  moodDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  moodPoints = DEFAULT_POINTS,
  reflections = DEFAULT_REFLECTIONS,
  activityTitle = 'Friendship & belonging',
  activityBand = 'age 8–11',
  onAssignActivity, onRespond, onAssign, onGuidedResponse, onPrivateNote, onInterventionLog,
}: StudentDetailProps) {
  const line = moodPoints.map((p) => `${p.x},${p.y}`).join(' ')
  return (
    <AppShell {...chrome('teacher', 'Roster',
      <span><span className="font-semibold text-coral-text">Roster</span> &nbsp;/&nbsp; {studentName}</span>)}>
      <PageHeader
        crumb={band}
        title={<>{studentName} <Tag tone="danger" icon={<Icon.Alert />}>Immediate flag</Tag></>}
        sub={sub}
        right={<>
          <Button variant="ghost" icon={<Icon.Book />} onClick={onAssignActivity}>Assign activity</Button>
          <Button variant="ink" icon={<Icon.Message />} onClick={onRespond}>Respond</Button>
        </>}
      />

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <KV label="Participation">{participation}</KV>
        <KV label="Mood trend"><span style={{ color: theme.colors.status.danger }}>{moodTrend}</span></KV>
        <KV label="Last check-in">{lastCheckIn}</KV>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-4">
          {/* mood over time — mood-coloured dots on an ink line */}
          <Card>
            <CardHeader icon={<Icon.Eye />} title="Mood over time" hint="Mon–Fri" />
            <CardBody>
              <svg viewBox="0 0 320 96" preserveAspectRatio="none" className="block h-24 w-full">
                <polyline points={line} fill="none" stroke={theme.colors.ink.DEFAULT} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                {moodPoints.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={6} fill={theme.colors.mood[p.mood]} />
                ))}
              </svg>
              <div className="flex justify-between px-3.5 text-[11px] font-medium text-neutral-500">
                {moodDays.map((d) => <span key={d}>{d}</span>)}
              </div>
            </CardBody>
          </Card>

          {/* reflections */}
          <Card>
            <CardHeader icon={<Icon.Message />} title="Reflections" />
            <CardBody flush>
              <Table
                head={['Day', 'Mood', 'Note']}
                rows={reflections.map((r) => [
                  <span className="text-neutral-700">{r.day}</span>,
                  <MoodDot mood={r.mood} label={r.label} />,
                  <span className="text-neutral-700">{r.note}</span>,
                ])}
              />
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          {/* suggested activity — premium; the AI only surfaces */}
          <Card>
            <CardHeader icon={<Icon.Sparkles />} title="Suggested activity" action={<Tag tone="ink">Premium</Tag>} />
            <CardBody>
              <div className="mb-3 rounded-md border border-coral-100 bg-coral-50 px-3.5 py-3 text-sm leading-relaxed text-neutral-800">
                “<b>{activityTitle}</b>” ({activityBand}) — suggested from recent reflections.
              </div>
              <Button variant="ink" block icon={<Icon.Book />} onClick={onAssign}>Assign to {studentName.split(' ')[0]}</Button>
              <Banner tone="info" icon={<Icon.Sparkles />}>The AI only surfaces — a human assigns.</Banner>
            </CardBody>
          </Card>

          {/* respond linklist */}
          <Card>
            <CardHeader icon={<Icon.Message />} title="Respond" />
            <CardBody>
              <div className="flex flex-col gap-2.5">
                <button onClick={onGuidedResponse} className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] font-semibold text-coral-text hover:bg-neutral-50 [&_svg]:h-[15px] [&_svg]:w-[15px] [&_svg]:text-neutral-400">
                  <Icon.Message />Guided response
                </button>
                <button onClick={onPrivateNote} className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] font-semibold text-coral-text hover:bg-neutral-50 [&_svg]:h-[15px] [&_svg]:w-[15px] [&_svg]:text-neutral-400">
                  <Icon.Pencil />Send a private note
                </button>
                <button onClick={onInterventionLog} className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] font-semibold text-coral-text hover:bg-neutral-50 [&_svg]:h-[15px] [&_svg]:w-[15px] [&_svg]:text-neutral-400">
                  <Icon.Book />Open intervention log
                </button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
