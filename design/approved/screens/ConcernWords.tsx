/** SC-060 — Concern-word lists · FR-19-05. Presentational (props in, markup out). */
import {
  AppShell, chrome, PageHeader, Banner, Card, CardHeader, CardBody,
  Chip, Field, Input, Button, Icon,
} from '../components'

const crumb = <span><a href="#" className="hover:underline">Leadership</a>{'  /  '}Concern words</span>

const LOCKED = ['suicide', 'self-harm', 'abuse', 'hurt', 'unsafe', 'run away', 'starve']
const ADDED = ['kms', 'hurt myself', 'hate school']

export function ConcernWords() {
  return (
    <AppShell {...chrome('leadership', 'Concern words', crumb)}>
      <PageHeader
        crumb="Safeguarding config · what text triggers a flag"
        title="Concern-word lists"
        sub="Platform defaults + your school additions"
      />

      <Banner tone="warn" icon={<Icon.Flag />}>
        Editing these changes what triggers a flag — err toward flagging.
      </Banner>

      <Card>
        <CardHeader icon={<Icon.Flag />} title="Concern words (school)" hint="defaults locked · additions removable" />
        <CardBody>
          <p className="mb-3 text-[13px] text-neutral-700">
            Your school’s list = platform defaults + your additions. Default words cannot be removed;
            additions you made show an <b>×</b> and can be taken off.
          </p>

          <div className="mb-3.5 flex flex-wrap gap-2">
            {LOCKED.map((w) => <Chip key={w}>{w}</Chip>)}
            {ADDED.map((w) => <Chip key={w} onRemove={() => {}}>{w}</Chip>)}
          </div>

          <Field label="Add a word or phrase">
            <Input placeholder="Type a word, then press Enter to add…" />
          </Field>

          <div className="mt-3 flex justify-end gap-2.5">
            <Button variant="ghost">Reset to default</Button>
            <Button variant="ink" icon={<Icon.Check />}>Save</Button>
          </div>
        </CardBody>
      </Card>
    </AppShell>
  )
}
