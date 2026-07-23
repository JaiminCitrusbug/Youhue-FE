/** SC-047 — Author / edit activity · FR-14-05. Schools own the content they author. Presentational only. */
import { AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Field, Input, Select, Textarea, Button, Icon } from '../components'

export function ActivityAuthor() {
  return (
    <AppShell {...chrome('teacher', 'Activities', <>Activities / Author</>)}>
      <PageHeader crumb="Activities / Author" title="Author an activity" sub="School-authored · stays in your school" />

      <div className="max-w-[640px]">
        <Card>
          <CardHeader icon={<Icon.Pencil />} title="New activity (school-authored)" />
          <CardBody>
            <Field label="Title"><Input defaultValue="Settling back after half-term" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Topic">
                <Select defaultValue="Healthy habits"><option>Healthy habits</option></Select>
              </Field>
              <Field label="Age band">
                <Select defaultValue="8–11"><option>8–11</option></Select>
              </Field>
            </div>
            <Field label="Content">
              <Textarea defaultValue="Open with a two-minute settle: three slow breaths, then name one thing you're looking forward to this half-term. Pairs share, then a short class round-up…" />
            </Field>
            <div className="mt-4 flex gap-2.5">
              <Button variant="ink" icon={<Icon.Check />}>Publish</Button>
            </div>
            <p className="mt-2.5 text-[11px] text-neutral-500">Schools own their content.</p>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
