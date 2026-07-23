/** SC-078 — Seed activities · FR-19-04. Presentational. Dark admin shell (automatic via chrome). */
import {
  AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Table, Button, Icon,
} from '../components'

export function SeedActivities() {
  return (
    <AppShell {...chrome('admin', 'Seed content', <span>Console · Seed content</span>)}>
      <PageHeader
        crumb="Platform default activity library"
        title="Seed activities"
        sub="Shipped to every new school"
        right={<Button variant="ink" icon={<Icon.Pencil />}>Author / edit</Button>}
      />

      <Card>
        <CardHeader icon={<Icon.Book />} title="Seed activities" hint="age band = suitable years" />
        <CardBody flush>
          <Table
            head={['Activity', 'Topic', 'Age']}
            rows={[
              [<b className="text-[12.5px] font-semibold">Box breathing</b>, <span className="text-[12.5px]">Healthy habits</span>, <span className="text-[12.5px]">all</span>],
              [<b className="text-[12.5px] font-semibold">Worry jar</b>, <span className="text-[12.5px]">Home worries</span>, <span className="text-[12.5px]">5–7</span>],
            ]}
          />
        </CardBody>
      </Card>
    </AppShell>
  )
}
