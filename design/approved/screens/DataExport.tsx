/** SC-064 — School data export · FR-20-01. Presentational (props in, markup out). */
import {
  AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Button, Tag, Icon,
} from '../components'

const crumb = <span><a href="#" className="hover:underline">Leadership</a>{'  /  '}Export &amp; delete</span>

export function DataExport() {
  return (
    <AppShell {...chrome('leadership', 'Export & delete', crumb)}>
      <PageHeader
        crumb="Data portability · GDPR / data-protection request"
        title="School data export"
        sub="A full machine-readable copy of your school’s data"
      />

      <div className="grid grid-cols-2 items-start gap-4">
        <Card>
          <CardHeader icon={<Icon.ArrowUp />} title="Export school data" />
          <CardBody>
            <p className="mb-3.5 text-[13px] text-neutral-700">
              Requesting an export packages every class, student record, check-in and intervention log
              into a single <b>.zip</b> archive. Large schools may take a few minutes — we’ll email you
              when it’s ready.
            </p>
            <Button variant="ink" icon={<Icon.Report />}>Request export</Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader icon={<Icon.Download />} title="Your export is ready"
            action={<Tag tone="ok" icon={<Icon.Check />}>Ready</Tag>} />
          <CardBody>
            <p className="mb-3.5 text-[13px] text-neutral-700">
              Prepared Mon 09:04 · <b>oakfield-export-2026-07-20.zip</b> · 48.2 MB. The link expires in 7 days.
            </p>
            <Button variant="ghost" icon={<Icon.Download />}>Download (.zip)</Button>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
