/** SC-077 — Support / audited access · FR-19-06. Presentational. Dark admin shell (automatic via chrome). */
import {
  AppShell, chrome, PageHeader, Banner, Card, CardHeader, CardBody, Field, Textarea, Button, Icon,
} from '../components'

export function SupportAccess() {
  return (
    <AppShell {...chrome('admin', 'Support', <span>Console · Support</span>)}>
      <PageHeader crumb="Break-glass, permission-bound access" title="Support / audited access" sub="Riverside" />

      <Banner tone="info" icon={<Icon.Shield />}>
        Opening a school’s data is permission-bound and written to the audit log — not an open backdoor.
      </Banner>

      <div className="max-w-[640px]">
        <Card>
          <CardHeader icon={<Icon.Eye />} title="Open Riverside for support" />
          <CardBody>
            <Field label="Reason for access">
              <Textarea defaultValue="Teacher R. Okafor reported alerts not routing — ticket #4821. Opening to inspect alert-routing config." />
            </Field>
            <Button variant="ink" icon={<Icon.Shield />}>Open with reason (logged)</Button>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
