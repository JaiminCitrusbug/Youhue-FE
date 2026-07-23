/** SC-056 — Whole-school overview · FR-16-01. Presentational (props in, markup out). */
import {
  AppShell, chrome, PageHeader, SegmentedControl, StatTile, Card, CardHeader, CardBody,
  Table, Tag, MoodDot, Icon,
} from '../components'

const crumb = <span><a href="#" className="hover:underline">Leadership</a>{'  /  '}Overview</span>

export function WholeSchoolOverview() {
  return (
    <AppShell {...chrome('leadership', 'Overview', crumb)}>
      <PageHeader
        crumb="Aggregates across every year group · as of Mon 09:10 school time"
        title="Whole-school overview"
        sub="Oakfield Primary · 3,420 students · 14 classes"
        right={<SegmentedControl options={['This week', 'Last week', 'Term']} value="This week" />}
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatTile label="School mood index" icon={<Icon.Chart />} value="6.9" unit="/10"
          delta="+0.2 vs last week" deltaTone="up" deltaIcon={<Icon.ArrowUp />} />
        <StatTile label="Participation" icon={<Icon.Users />} value="91%"
          delta="3,120 of 3,420 students" deltaIcon={<Icon.Minus />} />
        <StatTile label="Open flags" icon={<Icon.Flag />} value="7"
          delta={<span className="flex gap-1.5"><Tag tone="danger" icon={<Icon.Alert />}>2 Immediate</Tag><Tag tone="warn" icon={<Icon.Clock />}>5 Triage</Tag></span>} />
      </div>

      <Card>
        <CardHeader icon={<Icon.School />} title="Classes" hint="drill into a class to see students" />
        <CardBody flush>
          <Table
            head={['Class', 'Mood', 'Participation', 'Flags']}
            rows={[
              [<b>Y5 Maple</b>, <MoodDot mood="worried" label="6.8" />, <>86%</>, <Tag tone="danger" icon={<Icon.Alert />}>Immediate</Tag>],
              [<b>Y5 Oak</b>, <MoodDot mood="good" label="7.1" />, <>94%</>, <Tag tone="mut">—</Tag>],
              [<b>Y6 Elm</b>, <MoodDot mood="worried" label="6.4" />, <>89%</>, <Tag tone="warn" icon={<Icon.Clock />}>Triage</Tag>],
            ]}
          />
        </CardBody>
      </Card>
    </AppShell>
  )
}
