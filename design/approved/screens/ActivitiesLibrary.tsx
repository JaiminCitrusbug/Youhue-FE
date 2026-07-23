/** SC-045 — Activities library · FR-14-01. Curated + school-authored, filterable. Presentational only. */
import * as React from 'react'
import { AppShell, chrome, PageHeader, Card, CardBody, Table, Select, Button, Icon } from '../components'

function ActivityCell({ name }: { name: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600 [&_svg]:h-[15px] [&_svg]:w-[15px]">
        <Icon.Book />
      </span>
      <b className="text-[12.5px] font-semibold">{name}</b>
    </div>
  )
}

export function ActivitiesLibrary() {
  return (
    <AppShell {...chrome('teacher', 'Activities', <>Teacher / Activities</>)}>
      <PageHeader
        crumb="Activities"
        title="Activities library"
        sub="Curated + school-authored wellbeing activities"
        right={
          <>
            <div className="w-[120px]"><Select defaultValue="Search"><option>Search</option></Select></div>
            <div className="w-[120px]"><Select defaultValue="Topic"><option>Topic</option></Select></div>
            <div className="w-[120px]"><Select defaultValue="Age band"><option>Age band</option></Select></div>
            <Button variant="ink" icon={<Icon.Plus />}>Author (school)</Button>
          </>
        }
      />

      <Card>
        <CardBody flush>
          <Table
            head={['Activity', 'Topic', 'Age']}
            rows={[
              [<ActivityCell name="Friendship & belonging" />, <>Friendships</>, <>8–11</>],
              [<ActivityCell name="Box breathing" />, <>Healthy habits</>, <>all</>],
              [<ActivityCell name="Worry jar" />, <>Home worries</>, <>5–7</>],
            ]}
          />
        </CardBody>
      </Card>
    </AppShell>
  )
}
