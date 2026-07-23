/** SC-075 — School accounts · FR-19-02. Presentational. Dark admin shell (automatic via chrome). */
import {
  AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Table, PersonCell, Tag, Input, Select, Icon,
} from '../components'

export function SchoolAccounts() {
  return (
    <AppShell {...chrome('admin', 'Schools', <span>Console · Schools</span>)}>
      <PageHeader
        crumb="Every school on the platform"
        title="School accounts"
        sub="142 total"
        right={
          <>
            <div className="w-[180px]"><Input placeholder="Search schools" /></div>
            <div className="w-[130px]"><Select defaultValue="all"><option value="all">All tiers</option></Select></div>
          </>
        }
      />

      <Card>
        <CardHeader icon={<Icon.School />} title="Schools" hint="showing 2 of 142" />
        <CardBody flush>
          <Table
            head={['School', 'Tier', 'Status']}
            rows={[
              [
                <PersonCell initials="OP" name="Oakfield Primary" sub="Riverdene Trust" />,
                <Tag tone="ink">Premium (trial)</Tag>,
                <Tag tone="ok" icon={<Icon.Check />}>Active</Tag>,
              ],
              [
                <PersonCell initials="RV" name="Riverside" sub="Riverdene Trust" />,
                <Tag tone="mut">Free</Tag>,
                <Tag tone="ok" icon={<Icon.Check />}>Active</Tag>,
              ],
            ]}
          />
        </CardBody>
      </Card>
    </AppShell>
  )
}
