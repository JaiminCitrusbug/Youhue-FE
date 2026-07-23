/** SC-076 — Trials / extension · FR-19-03. Presentational. Dark admin shell (automatic via chrome). */
import {
  AppShell, chrome, PageHeader, Card, CardHeader, CardBody, KV, Button, Banner, Icon,
} from '../components'

export function TrialManagement() {
  return (
    <AppShell {...chrome('admin', 'Trials', <span>Console · Trials</span>)}>
      <PageHeader crumb="Premium trial management" title="Trials / extension" sub="Oakfield Primary" />

      <div className="max-w-[640px]">
        <Card>
          <CardHeader icon={<Icon.Clock />} title="Oakfield — trial" />
          <CardBody>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <KV label="Trial ends">in 24 days</KV>
              <KV label="Extensions used">0 / 1</KV>
            </div>
            <div className="mb-3.5">
              <Button variant="ink" icon={<Icon.Check />}>Grant 14-day extension</Button>
            </div>
            <Banner tone="warn" icon={<Icon.Alert />}>
              Only one extension per school — a second attempt is refused.
            </Banner>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
