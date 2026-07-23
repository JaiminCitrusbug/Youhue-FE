/** SC-069 — School approvals · FR-02-02. Presentational. */
import {
  AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Table, PersonCell, Button, Icon,
} from '../components'

export function SchoolApprovals() {
  return (
    <AppShell {...chrome('district', 'Approvals', <span>Riverdene Trust · Approvals</span>)}>
      <PageHeader
        crumb="Schools requesting to join this trust"
        title="School approvals"
        sub="2 pending your review"
      />

      <Card>
        <CardHeader icon={<Icon.School />} title="Pending schools" hint="oldest first" />
        <CardBody flush>
          <Table
            head={['School', 'Registrant', 'When', '']}
            rows={[
              [
                <PersonCell initials="SA" name="St. Aidan’s" sub="Primary" />,
                <span className="text-[12.5px]">h.begum@staidans.sch</span>,
                <span className="text-[12.5px]">today</span>,
                <div className="text-right"><Button variant="ghost" icon={<Icon.Eye />}>Review</Button></div>,
              ],
              [
                <PersonCell initials="GL" name="Green Lane" sub="Primary" />,
                <span className="text-[12.5px]">m.cole@greenlane.sch</span>,
                <span className="text-[12.5px]">yesterday</span>,
                <div className="text-right"><Button variant="ghost" icon={<Icon.Eye />}>Review</Button></div>,
              ],
            ]}
          />
        </CardBody>
      </Card>
    </AppShell>
  )
}
