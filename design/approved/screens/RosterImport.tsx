/** SC-036 — Roster import (CSV) · FR-03-01. Presentational only (props in, markup out). */
import { AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Banner, Button, Tag, Icon } from '../components'

export function RosterImport() {
  return (
    <AppShell {...chrome('teacher', 'Roster', <>Roster / Import</>)}>
      <PageHeader crumb="Roster / Import" title="Import your roster" sub="CSV only · you decide who is active" />

      <div className="max-w-[660px]">
        <Card>
          <CardHeader icon={<Icon.Upload />} title="Upload a CSV" hint="first name · last initial · age band · status" />
          <CardBody>
            <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 px-5 py-9 text-center text-neutral-500">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-lg border border-neutral-200 bg-surface text-neutral-400 [&_svg]:h-4 [&_svg]:w-4">
                <Icon.Upload />
              </div>
              <div className="text-sm font-semibold text-neutral-700">Drop a .csv roster here or choose a file</div>
              <div className="mt-1 text-xs">Up to 500 students · UTF-8 · one row per student</div>
            </div>

            <div className="mt-3.5">
              <Banner icon={<Icon.Check />}>CSV import only — no automated roster sync (Clever/ClassLink are later).</Banner>
            </div>

            <div className="flex gap-2.5">
              <Button variant="ink" icon={<Icon.Upload />}>Upload</Button>
              <Button variant="ghost" icon={<Icon.File />}>Download template</Button>
            </div>
          </CardBody>
        </Card>

        <div className="mt-4">
          <Card>
            <CardHeader icon={<Icon.Clock />} title="Last import" hint="Mon · 08:03" />
            <CardBody>
              <Tag tone="ok" icon={<Icon.Check />}>Imported 28 · reactivated 2 · deactivated 1</Tag>
            </CardBody>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
