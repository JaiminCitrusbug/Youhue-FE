/**
 * SC-041 — Private supportive note  ·  FR-13-05  ·  US-13-05
 * Presentational only (props in, markup out; no data fetching, no business logic).
 * A quiet, private message — recorded in the intervention log, never posted publicly.
 */
import {
  AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Field, Textarea,
  Tag, Button, Banner, Icon,
} from '../components'

export interface PrivateNoteProps {
  studentName?: string
  note?: string
  onSend?: () => void
  onCancel?: () => void
}

export function PrivateNote({
  studentName = 'Liam O.',
  note = 'Hi Liam — I noticed today was tough. I’m glad you checked in. I’m here if you want to talk at break. — Mr Okafor',
  onSend, onCancel,
}: PrivateNoteProps) {
  const first = studentName.split(' ')[0]
  return (
    <AppShell {...chrome('teacher', 'Alerts & triage',
      <span><span className="font-semibold text-coral-text">Alerts</span> &nbsp;/&nbsp; {studentName} &nbsp;/&nbsp; Private note</span>)}>
      <PageHeader
        crumb="A quiet, private message — never shown publicly"
        title={<>Send a private note to {studentName}</>}
      />

      <div className="max-w-[620px]">
        <Card>
          <CardHeader icon={<Icon.Pencil />} title="Your note"
            action={<Tag tone="ok" icon={<Icon.Lock />}>Private — only {first} sees this</Tag>} />
          <CardBody>
            <Field label="Message">
              <Textarea defaultValue={note} />
            </Field>
            <Banner tone="info" icon={<Icon.Shield />}>
              This note is private to the student and is recorded in the intervention log — it is never posted to a class feed.
            </Banner>
            <div className="flex flex-wrap gap-2.5">
              <Button variant="ink" icon={<Icon.Send />} onClick={onSend}>Send privately</Button>
              <Button variant="ghost" onClick={onCancel}>Cancel</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
