/** SC-063 — Access-window configuration · FR-07-02. Leadership-owned. Presentational only. */
import { AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Field, Input, Select, Banner, Button, Icon } from '../components'

export function AccessWindow() {
  return (
    <AppShell {...chrome('leadership', 'Calendar & window', <>Calendar &amp; window / Access window</>)}>
      <PageHeader
        crumb="Calendar & window"
        title="Access-window configuration"
        sub="When students can check in each school day"
      />

      <div className="max-w-[580px]">
        <Card>
          <CardHeader icon={<Icon.Clock />} title="Check-in window" />
          <CardBody>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Opens"><Input defaultValue="08:30" /></Field>
              <Field label="Closes"><Input defaultValue="09:30" /></Field>
            </div>
            <Field label="Timezone">
              <Select defaultValue="Europe/London (GMT+1)">
                <option>Europe/London (GMT+1)</option>
              </Select>
            </Field>
            <Banner icon={<Icon.Check />}>Enforced server-side — check-ins outside the window are blocked.</Banner>
            <div className="flex gap-2.5">
              <Button variant="ink" icon={<Icon.Check />}>Save</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
