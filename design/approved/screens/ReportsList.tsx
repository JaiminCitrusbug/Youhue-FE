/** SC-049 — Reports · FR-15-01. AI-written summaries by scope & period. Presentational only. */
import * as React from 'react'
import { AppShell, chrome, PageHeader, Card, CardBody, Table, Button, Icon } from '../components'

function ReportCell({ name }: { name: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600 [&_svg]:h-[15px] [&_svg]:w-[15px]">
        <Icon.Report />
      </span>
      <b className="text-[12.5px] font-semibold">{name}</b>
    </div>
  )
}

export function ReportsList() {
  return (
    <AppShell {...chrome('teacher', 'Reports', <>Teacher / Reports</>)}>
      <PageHeader
        crumb="Reports"
        title="Reports"
        sub="AI-written summaries · figures rendered, never recomputed"
        right={<Button variant="ink" icon={<Icon.Sparkles />}>Generate</Button>}
      />

      <Card>
        <CardBody flush>
          <Table
            head={['Report', 'Scope', 'Period']}
            rows={[
              [<ReportCell name="Weekly wellbeing" />, <>Year 5 — Maple</>, <>this week</>],
              [<ReportCell name="Termly summary" />, <>Whole school</>, <>Autumn</>],
            ]}
          />
        </CardBody>
      </Card>
    </AppShell>
  )
}
