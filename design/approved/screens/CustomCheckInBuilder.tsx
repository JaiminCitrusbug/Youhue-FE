/** SC-033 — Custom check-in builder · FR-06-01. Mood scale + free-text questions. Presentational only. */
import { AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Field, Input, Select, Textarea, Button, Icon } from '../components'

export function CustomCheckInBuilder() {
  return (
    <AppShell {...chrome('teacher', 'Check-ins', <>Check-ins / New</>)}>
      <PageHeader crumb="Check-ins / New" title="Custom check-in" sub="A one-off check-in for your class or a group" />

      <div className="max-w-[640px]">
        <Card>
          <CardHeader icon={<Icon.Report />} title="New custom check-in" />
          <CardBody>
            <Field label="Title"><Input defaultValue="After-incident pulse" /></Field>
            <Field label="Question 1 (mood scale)">
              <Select defaultValue="How are you feeling today?">
                <option>How are you feeling today?</option>
              </Select>
            </Field>
            <Field label="Question 2 (free text)">
              <Textarea defaultValue="Is there anything you'd like your teacher to know?" />
            </Field>
            <div className="mt-4 flex gap-2.5">
              <Button variant="ghost" icon={<Icon.Plus />}>Add question</Button>
              <Button variant="ink" icon={<Icon.ChevronRight />}>Next: target &amp; schedule</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
