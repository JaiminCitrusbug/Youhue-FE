/** SC-085 — Subscription & pricing · FR-17-01 / FR-17-06. Presentational (props in, markup out). */
import {
  AppShell, chrome, PageHeader, Button, KV, Card, CardHeader, CardBody, Table, Icon,
} from '../components'

const crumb = <span><a href="#" className="hover:underline">Leadership</a>{'  /  '}Subscription</span>

export function Subscription() {
  return (
    <AppShell {...chrome('leadership', 'Subscription', crumb)}>
      <PageHeader
        crumb="Plan & static pricing · billing is quote-based, not card entry"
        title="Subscription & pricing"
        sub="Oakfield Primary · Premium trial"
        right={<Button variant="ink" icon={<Icon.ArrowUp />}>Upgrade to Premium</Button>}
      />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <KV label="Tier">Premium (trial)</KV>
        <KV label="Trial">24 days left</KV>
      </div>

      <Card>
        <CardHeader icon={<Icon.Card />} title="Pricing (static, env-configurable)" hint="per student · per year" />
        <CardBody flush>
          <Table
            head={['Students', 'Price / student / year']}
            rows={[
              [<>1–500</>, <b>$4.00</b>],
              [<>501–2,000</>, <b>$3.25</b>],
              [<>2,001–5,000</>, <b>$2.50</b>],
              [<>5,001+</>, <b>$2.00</b>],
            ]}
          />
        </CardBody>
      </Card>

      <p className="mt-3 text-[12px] text-neutral-500">No in-platform card entry — billing is quote-based.</p>
    </AppShell>
  )
}
