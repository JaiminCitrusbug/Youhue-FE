/** SC-065 — School data deletion · FR-20-02. Presentational (props in, markup out). */
import {
  AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Banner, Button, Icon,
} from '../components'

const crumb = <span><a href="#" className="hover:underline">Leadership</a>{'  /  '}Export &amp; delete</span>

export function DataDeletion() {
  return (
    <AppShell {...chrome('leadership', 'Export & delete', crumb)}>
      <PageHeader
        crumb="Right to erasure · irreversible"
        title="School data deletion"
        sub="We offer an export before anything is removed"
      />

      <div className="max-w-[640px]">
        <Card>
          <CardHeader icon={<Icon.Trash />} title="Delete school data" />
          <CardBody>
            <Banner tone="danger" icon={<Icon.Alert />}>
              This permanently deletes all school data. We export first.
            </Banner>
            <div className="flex justify-end gap-2.5">
              <Button variant="ghost" icon={<Icon.Download />}>Export first</Button>
              <Button variant="danger" icon={<Icon.Trash />}>Delete permanently</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
