/** SC-079 — Default concern-word lists · FR-19-05. Presentational. Dark admin shell (automatic via chrome). */
import {
  AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Chip, Field, Input, Button, Icon,
} from '../components'

const DEFAULT_WORDS = ['hurt', 'scared', 'alone', 'hungry', 'hit', 'hate', 'help', 'can’t cope']

export function DefaultWordLists() {
  return (
    <AppShell {...chrome('admin', 'Word lists', <span>Console · Word lists</span>)}>
      <PageHeader crumb="Concern-word detection defaults" title="Default concern-word lists" sub="Applied to new schools" />

      <div className="max-w-[720px]">
        <Card>
          <CardHeader icon={<Icon.Alert />} title="Platform defaults" />
          <CardBody>
            <p className="mb-3.5 text-[13px] text-neutral-600">Platform defaults — schools may override.</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {DEFAULT_WORDS.map((w) => <Chip key={w}>{w}</Chip>)}
            </div>
            <Field label="Add a default word">
              <Input placeholder="Type a word and press add" />
            </Field>
            <Button variant="ink" icon={<Icon.Check />}>Save</Button>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
