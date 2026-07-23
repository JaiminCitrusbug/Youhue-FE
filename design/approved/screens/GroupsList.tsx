/** SC-030 — Groups · FR-09-02. Watchlists & custom groups a teacher manages. Presentational only. */
import { AppShell, chrome, PageHeader, Card, CardBody, Table, Tag, Button, Icon } from '../components'

export function GroupsList() {
  return (
    <AppShell {...chrome('teacher', 'Groups', <>Teacher / Groups</>)}>
      <PageHeader
        crumb="Groups"
        title="My groups"
        sub="Watchlists & custom groups you manage"
        right={<Button variant="ink" icon={<Icon.Plus />}>New group</Button>}
      />

      <Card>
        <CardBody flush>
          <Table
            head={['Group', 'Type', 'Members']}
            rows={[
              [<b className="font-semibold">Year 5 watchlist</b>, <Tag tone="warn" icon={<Icon.Eye />}>Watchlist</Tag>, <>6</>],
              [<b className="font-semibold">Football club</b>, <Tag tone="mut" icon={<Icon.Users />}>Custom</Tag>, <>14</>],
            ]}
          />
        </CardBody>
      </Card>
    </AppShell>
  )
}
