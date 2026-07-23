/** SC-035 — Custom check-ins · FR-06-02. One-off & scheduled check-ins with response counts. Presentational only. */
import { AppShell, chrome, PageHeader, Card, CardBody, Table, Button, Icon } from '../components'

export function CustomCheckInsList() {
  return (
    <AppShell {...chrome('teacher', 'Check-ins', <>Teacher / Check-ins</>)}>
      <PageHeader
        crumb="Check-ins"
        title="Custom check-ins"
        sub="One-off & scheduled check-ins you've created"
        right={<Button variant="ink" icon={<Icon.Plus />}>New</Button>}
      />

      <Card>
        <CardBody flush>
          <Table
            head={['Title', 'Audience', 'Window', 'Responses']}
            rows={[
              [<b className="font-semibold">After-incident pulse</b>, <>Year 5 — Maple</>, <>Wed–Fri</>, <>22</>],
              [<b className="font-semibold">Pre-exam check</b>, <>Year 6</>, <>next week</>, <>—</>],
            ]}
          />
        </CardBody>
      </Card>
    </AppShell>
  )
}
