/** SC-052 — Profile / account. Presentational. Teacher shell. */
import { AppShell, chrome, PageHeader, Card, CardHeader, CardBody, KV, Button, Icon } from '../components'

export function Profile() {
  return (
    <AppShell {...chrome('teacher', 'Settings', <span>Settings · Profile</span>)}>
      <PageHeader crumb="Your account" title="Profile / account" />

      <div className="max-w-[760px]">
        <Card>
          <CardHeader
            icon={<Icon.Users />}
            title="Account"
            action={<a href="#" className="text-[12px] font-semibold text-coral-600">Manage in Settings</a>}
          />
          <CardBody>
            <div className="mb-3.5 grid grid-cols-3 gap-3">
              <KV label="Name">R. Okafor</KV>
              <KV label="Role">Teacher</KV>
              <KV label="School">Oakfield Primary</KV>
            </div>
            <Button variant="ghost" icon={<Icon.Pencil />}>Edit</Button>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
