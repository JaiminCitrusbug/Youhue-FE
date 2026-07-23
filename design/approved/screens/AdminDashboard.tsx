/** SC-074 — Admin dashboard · FR-19-07. Presentational. Dark admin shell (automatic via chrome). */
import {
  AppShell, chrome, PageHeader, StatTile, Card, CardHeader, CardBody, Table, Icon,
} from '../components'

export function AdminDashboard() {
  return (
    <AppShell {...chrome('admin', 'Dashboard', <span>Console · Dashboard</span>)}>
      <PageHeader crumb="Platform-wide · internal admin" title="Admin dashboard" sub="All schools · today" />

      <div className="mb-4 grid grid-cols-4 gap-3">
        <StatTile label="Schools" icon={<Icon.School />} value="142" delta="connected" />
        <StatTile label="Active trials" icon={<Icon.Clock />} value="37" delta="Premium trials running" />
        <StatTile label="Check-ins today" icon={<Icon.Check />} value="41,208" delta="across all schools" />
        <StatTile label="Alerts today" icon={<Icon.Alert />} value="96" delta="raised platform-wide" />
      </div>

      <Card>
        <CardHeader icon={<Icon.Report />} title="Recent activity" hint="newest first" />
        <CardBody flush>
          <Table
            head={['When', 'Actor', 'Action']}
            rows={[
              [<span className="text-[12.5px] font-semibold">09:03</span>, <span className="text-[12.5px]">admin:T.Ng</span>, <span className="text-[12.5px]">Support access — Riverside (reason logged)</span>],
              [<span className="text-[12.5px] font-semibold">08:52</span>, <span className="text-[12.5px]">system</span>, <span className="text-[12.5px]">Extension granted — Green Lane (14 days)</span>],
              [<span className="text-[12.5px] font-semibold">08:30</span>, <span className="text-[12.5px]">admin:T.Ng</span>, <span className="text-[12.5px]">Approved new school — Fenwick Junior</span>],
            ]}
          />
        </CardBody>
      </Card>
    </AppShell>
  )
}
