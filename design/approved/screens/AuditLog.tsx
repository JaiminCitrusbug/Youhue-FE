/** SC-080 — Audit-log viewer · FR-20-05. Presentational. Dark admin shell (automatic via chrome). */
import {
  AppShell, chrome, PageHeader, Banner, Card, CardHeader, CardBody, Table, Select, Button, Icon,
} from '../components'

export function AuditLog() {
  return (
    <AppShell {...chrome('admin', 'Audit log', <span>Console · Audit log</span>)}>
      <PageHeader
        crumb="Append-only · tamper-evident"
        title="Audit-log viewer"
        sub="Platform-wide · today"
        right={
          <>
            <div className="w-[150px]"><Select defaultValue="all"><option value="all">All actors</option></Select></div>
            <Button variant="ghost" icon={<Icon.Download />}>Export</Button>
          </>
        }
      />

      <Banner tone="info" icon={<Icon.Lock />}>
        View only — the audit log cannot be edited or deleted.
      </Banner>

      <Card>
        <CardHeader icon={<Icon.Report />} title="Entries" hint="newest first" />
        <CardBody flush>
          <Table
            head={['When', 'Actor', 'Action']}
            rows={[
              [<span className="text-[12.5px] font-semibold">09:03</span>, <span className="text-[12.5px]">admin:T.Ng</span>, <span className="text-[12.5px]">Support access — Riverside (reason logged)</span>],
              [<span className="text-[12.5px] font-semibold">08:52</span>, <span className="text-[12.5px]">system</span>, <span className="text-[12.5px]">Escalated alert (Liam O.)</span>],
            ]}
          />
        </CardBody>
      </Card>
    </AppShell>
  )
}
