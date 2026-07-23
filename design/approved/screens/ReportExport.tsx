/** SC-051 — Report export / print · FR-15-02. Clean printable sheet — PDF or print. Presentational only. */
import { AppShell, chrome, PageHeader, Card, CardHeader, CardBody, KV, Button, Icon } from '../components'

export function ReportExport() {
  return (
    <AppShell {...chrome('teacher', 'Reports', <>Reports / Export</>)}>
      <PageHeader crumb="Reports / Export" title="Export / print" sub="Weekly wellbeing — Year 5 Maple" />

      <div className="max-w-[640px]">
        <Card>
          <CardHeader icon={<Icon.Report />} title="Export" hint="preview" />
          <CardBody>
            <div className="-m-4 bg-neutral-50 p-5">
              {/* clean printable sheet */}
              <div className="rounded-md border border-neutral-200 bg-surface px-7 py-6 shadow-card">
                <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-neutral-400">Student Wellbeing · Weekly report</div>
                <div className="mt-1.5 text-[19px] font-extrabold tracking-tight">Weekly wellbeing — Year 5 Maple</div>
                <div className="mt-0.5 text-xs text-neutral-500">Week of 20 Oct 2026 · generated Mon 08:05</div>

                <div className="my-4 grid grid-cols-3 gap-2.5">
                  <KV label="Participation">24 / 28 · 86%</KV>
                  <KV label="Top theme">Friendship problems</KV>
                  <KV label="Open interventions">2</KV>
                </div>

                <div className="border-t border-neutral-200 pt-3 text-[13px] leading-relaxed text-neutral-700">
                  Class mood held steady this week; participation rose 6 points. Friendship problems led reflections — a
                  whole-class activity is suggested. No new immediate flags since Wednesday.
                </div>
              </div>

              <div className="mt-4 flex gap-2.5">
                <Button variant="ink" icon={<Icon.Download />}>Download PDF</Button>
                <Button variant="ghost" icon={<Icon.File />}>Print</Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
