/** SC-068 — District comparison · FR-16-03. Presentational. */
import {
  AppShell, chrome, PageHeader, Banner, Card, CardHeader, CardBody, Table, PersonCell, Tag, Icon,
} from '../components'

export function DistrictComparison() {
  return (
    <AppShell {...chrome('district', 'Overview', <span>Riverdene Trust · Overview</span>)}>
      <PageHeader
        crumb="Trust oversight · never individual students"
        title="District comparison"
        sub="4 connected schools · summer term · as of 09:12"
      />

      <Banner tone="info" icon={<Icon.Flag />}>
        Aggregates only — no individual student data ever leaves its school.
      </Banner>

      <Card>
        <CardHeader icon={<Icon.School />} title="Schools in this trust" hint="participation this week · mood index /10" />
        <CardBody flush>
          <Table
            head={['School', 'Participation', 'Mood index']}
            rows={[
              [
                <PersonCell initials="OP" name="Oakfield Primary" sub="Premium (trial)" />,
                <span className="text-[12.5px] font-semibold">91%</span>,
                <span className="text-[12.5px] font-semibold">6.9</span>,
              ],
              [
                <PersonCell initials="RV" name="Riverside" sub="Free" />,
                <span className="text-[12.5px] font-semibold">88%</span>,
                <span className="text-[12.5px] font-semibold">6.5</span>,
              ],
              [
                <PersonCell initials="HC" name="Hillcrest" sub="Premium" />,
                <span className="text-[12.5px] font-semibold">94%</span>,
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
                  7.2 <Tag tone="ok" icon={<Icon.ArrowUp />}>top</Tag>
                </span>,
              ],
            ]}
          />
        </CardBody>
      </Card>
    </AppShell>
  )
}
