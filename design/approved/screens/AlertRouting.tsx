/** SC-061 — Alert routing · FR-12-05. Presentational (props in, markup out). */
import * as React from 'react'
import {
  AppShell, chrome, PageHeader, Button, Card, CardHeader, CardBody, Table, Tag, Icon,
} from '../components'

const crumb = <span><a href="#" className="hover:underline">Leadership</a>{'  /  '}Alert routing</span>

const Chain = ({ steps }: { steps: string[] }) => (
  <span className="inline-flex flex-wrap items-center gap-1.5 text-[13px]">
    {steps.map((s, i) => (
      <React.Fragment key={s}>
        {i > 0 && <Icon.ChevronRight className="h-3.5 w-3.5 text-neutral-400" />}
        {s}
      </React.Fragment>
    ))}
  </span>
)

export function AlertRouting() {
  return (
    <AppShell {...chrome('leadership', 'Alert routing', crumb)}>
      <PageHeader
        crumb="Who is notified for each priority band · order drives escalation"
        title="Alert routing"
        sub="Applies school-wide · overrides per class not enabled"
        right={<Button variant="ink" icon={<Icon.Pencil />}>Edit recipients</Button>}
      />

      <Card>
        <CardHeader icon={<Icon.Alert />} title="Who gets which alerts" hint="recipients in order → escalation" />
        <CardBody flush>
          <Table
            head={['Alert', 'Recipients (in order → escalation)']}
            rows={[
              [<Tag tone="danger" icon={<Icon.Alert />}>Immediate</Tag>, <Chain steps={['Class teacher', 'Pastoral lead', 'Deputy']} />],
              [<Tag tone="warn" icon={<Icon.Clock />}>Triage</Tag>, <Chain steps={['Class teacher']} />],
            ]}
          />
        </CardBody>
      </Card>
    </AppShell>
  )
}
