/** SC-053 — Personal settings. Presentational. Teacher shell. */
import {
  AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Field, Toggle, Select, Button, Icon,
} from '../components'

function ToggleRow({ label, on, last = false }: { label: string; on?: boolean; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${last ? '' : 'border-b border-neutral-100'}`}>
      <span className="text-[13px] font-medium text-neutral-700">{label}</span>
      <Toggle on={on} />
    </div>
  )
}

export function PersonalSettings() {
  return (
    <AppShell {...chrome('teacher', 'Settings', <span>Settings · Personal</span>)}>
      <PageHeader crumb="Just for you — not school-wide policy" title="Personal settings" />

      <div className="max-w-[640px]">
        <Card>
          <CardHeader icon={<Icon.Cog />} title="Personal settings" />
          <CardBody>
            <Field label="Notification preferences">
              <ToggleRow label="In-app" on />
              <ToggleRow label="Email" on last />
            </Field>
            <Field label="Language">
              <Select defaultValue="en-gb"><option value="en-gb">English (UK)</option></Select>
            </Field>
            <Button variant="ink" icon={<Icon.Check />}>Save</Button>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
