/** SC-062 — Calendar management · FR-07-01. Leadership-owned. Presentational only. */
import { AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Field, Input, Button, Icon } from '../components'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
// Illustrative October 2026 grid — holidays/INSET are coral, no check-ins those days.
const HOLIDAY: Record<number, string> = { 26: 'INSET', 27: 'Half-term', 28: 'Half-term' }

export function CalendarManagement() {
  return (
    <AppShell {...chrome('leadership', 'Calendar & window', <>Leadership / Calendar &amp; window</>)}>
      <PageHeader
        crumb="Calendar & window"
        title="Calendar management"
        sub="Autumn term · check-ins pause on holidays & INSET days"
      />

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader icon={<Icon.Calendar />} title="School calendar" hint="October 2026" />
          <CardBody>
            <div className="mb-2 grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-0.5 text-center text-[10px] font-bold uppercase tracking-wide text-neutral-400">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 35 }, (_, i) => i + 1).map((n) => {
                const label = n <= 31 ? n : ''
                const hol = HOLIDAY[n]
                return (
                  <div
                    key={n}
                    className={`min-h-[54px] rounded-md border px-1.5 py-1.5 text-[12px] font-semibold ${
                      hol ? 'border-coral-100 bg-coral-50 text-coral-600' : 'border-neutral-200 text-neutral-700'
                    }`}
                  >
                    {label}
                    {hol && <div className="mt-1 text-[9px] font-bold leading-tight">{hol}</div>}
                  </div>
                )
              })}
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11.5px] text-neutral-500">
              <span className="inline-block h-3 w-3 rounded-sm border border-coral-100 bg-coral-50" />
              Holiday / INSET — no check-ins
            </div>
          </CardBody>
        </Card>

        <Card className="self-start">
          <CardHeader icon={<Icon.Calendar />} title="Term dates" />
          <CardBody>
            <Field label="Term start"><Input defaultValue="1 Sep 2026" /></Field>
            <Field label="Term end"><Input defaultValue="18 Dec 2026" /></Field>
            <div className="mt-4 flex gap-2.5">
              <Button variant="ink" icon={<Icon.Plus />}>Add holiday</Button>
              <Button variant="ghost">Save</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
