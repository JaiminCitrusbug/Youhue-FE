/** SC-044 — AI theme analysis · FR-11-01. Premium · themes grouped, never attributed to a child. Presentational only. */
import { AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Table, Tag, Banner, Icon } from '../components'

export function AIThemeAnalysis() {
  return (
    <AppShell {...chrome('teacher', 'Reports', <>Reports / Themes</>)}>
      <PageHeader
        crumb="Reports / Themes"
        title={<>AI theme analysis <Tag tone="ink" icon={<Icon.Sparkles />}>Premium</Tag></>}
        sub="Year 5 — Maple · this week · 68 reflections"
      />

      <Card>
        <CardHeader icon={<Icon.Eye />} title="What the class is writing about" hint="grouped, not attributed" />
        <CardBody flush>
          <Table
            head={['Theme', 'Reflections']}
            rows={[
              [<b className="font-semibold">Friendship problems</b>, <>31</>],
              [<b className="font-semibold">Exam stress</b>, <>18</>],
              [<b className="font-semibold">Tiredness / sleep</b>, <>12</>],
              [<b className="font-semibold">Home worries</b>, <>7</>],
            ]}
          />
        </CardBody>
      </Card>

      <div className="mt-4">
        <Banner icon={<Icon.Check />}>Themes are surfaced for you — the AI never acts; a human decides.</Banner>
      </div>
    </AppShell>
  )
}
