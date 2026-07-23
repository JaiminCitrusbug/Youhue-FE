/** SC-086 — Trial status banner · FR-17-03. Presentational (props in, markup out). */
import * as React from 'react'
import {
  AppShell, chrome, PageHeader, Banner, Card, CardHeader, CardBody, Icon,
} from '../components'

const crumb = <span><a href="#" className="hover:underline">Leadership</a>{'  /  '}Subscription</span>

const ITEMS: { icon: React.ReactNode; text: React.ReactNode }[] = [
  { icon: <Icon.Check />, text: <>All existing classes, students, check-ins and intervention logs remain <b>viewable</b>.</> },
  { icon: <Icon.Clock />, text: <>New check-ins, activity assignments and AI suggestions are <b>paused</b> until you upgrade.</> },
  { icon: <Icon.ArrowUp />, text: <>Upgrade anytime to restore full write access instantly — no data migration needed.</> },
]

export function TrialBanner() {
  return (
    <AppShell {...chrome('leadership', 'Subscription', crumb)}>
      <PageHeader
        crumb="Non-destructive downgrade · your data is never deleted at trial end"
        title="Trial status"
      />

      <Banner tone="info" icon={<Icon.Clock />}>
        Premium trial — 24 days left. At trial end you drop to Free; your data stays read-only.
      </Banner>

      <div className="max-w-[640px]">
        <Card>
          <CardHeader icon={<Icon.Alert />} title="What happens at trial end" />
          <CardBody>
            <p className="mb-3 text-[13px] text-neutral-700">
              The downgrade is <b>non-destructive</b>. Nothing is deleted — you simply lose the ability
              to create new records while on Free:
            </p>
            <div className="space-y-2.5">
              {ITEMS.map((it, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[13px] text-neutral-700">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-500 [&_svg]:h-3 [&_svg]:w-3">{it.icon}</span>
                  <div>{it.text}</div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
