/** SC-081 — Admin profile. Presentational. Dark admin shell (automatic via chrome). */
import { AppShell, chrome, PageHeader, Card, CardHeader, CardBody, KV, Icon } from '../components'

export function AdminProfile() {
  return (
    <AppShell {...chrome('admin', 'Profile', <span>Console · Profile</span>)}>
      <PageHeader crumb="Your internal admin account" title="Admin profile" />

      <div className="max-w-[640px]">
        <Card>
          <CardHeader icon={<Icon.Cog />} title="Account" />
          <CardBody>
            <div className="grid grid-cols-2 gap-3">
              <KV label="Name">T. Ng</KV>
              <KV label="Role">Internal admin (MFA)</KV>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
