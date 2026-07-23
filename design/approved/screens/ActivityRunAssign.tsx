/** SC-046 — Run / assign activity · FR-14-02. Run with the class, or assign to one student. Presentational only. */
import { AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Button, Icon } from '../components'

export function ActivityRunAssign() {
  return (
    <AppShell {...chrome('teacher', 'Activities', <>Activities / Friendship &amp; belonging</>)}>
      <PageHeader
        crumb="Activities / Friendship & belonging"
        title="Run or assign"
        sub="Friendships · age 8–11 · ~15 min"
      />

      <div className="max-w-[660px]">
        <Card>
          <CardHeader icon={<Icon.Book />} title="Friendship & belonging" hint="15 min" />
          <CardBody>
            <p className="text-[13.5px] leading-relaxed text-neutral-700">
              A short, gentle session on what makes a good friend and how it feels to be left out. Pupils map who is in
              their circle, practise one kind action, and finish with a class agreement on including others at break.
              Works as a whole-class circle or as a quiet one-to-one when a child is struggling with a fallout.
            </p>
            <div className="mt-4 flex gap-2.5">
              <Button variant="ink" icon={<Icon.Users />}>Run with class</Button>
              <Button variant="ghost" icon={<Icon.Send />}>Assign to a student</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
