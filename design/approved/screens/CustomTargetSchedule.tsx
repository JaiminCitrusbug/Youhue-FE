/** SC-034 — Target & schedule · FR-06-02. Who (class/group/students) and when. Presentational only. */
import { AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Field, Input, Select, Button, Icon } from '../components'

export function CustomTargetSchedule() {
  return (
    <AppShell {...chrome('teacher', 'Check-ins', <>Check-ins / Target &amp; schedule</>)}>
      <PageHeader crumb="Check-ins / New / Target" title="Target & schedule" sub="After-incident pulse" />

      <div className="max-w-[580px]">
        <Card>
          <CardHeader icon={<Icon.Users />} title="Who & when" />
          <CardBody>
            <Field label="Audience">
              <Select defaultValue="Class · Year 5 — Maple">
                <option>Class · Year 5 — Maple</option>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Opens"><Input defaultValue="Wed 23 Oct" /></Field>
              <Field label="Closes"><Input defaultValue="Fri 25 Oct" /></Field>
            </div>
            <div className="mt-4 flex gap-2.5">
              <Button variant="ink" icon={<Icon.Send />}>Assign</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
