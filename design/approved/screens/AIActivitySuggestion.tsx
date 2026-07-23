/** SC-048 — AI activity suggestion · FR-14-03. Premium · the AI surfaces, a human assigns. Presentational only. */
import { AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Tag, Banner, Button, Icon } from '../components'

export function AIActivitySuggestion() {
  return (
    <AppShell {...chrome('teacher', 'Activities', <>Activities / Suggested</>)}>
      <PageHeader crumb="Activities / Suggested" title="AI activity suggestion" />

      <div className="max-w-[460px]">
        <Card>
          <CardHeader
            icon={<Icon.Sparkles />}
            title="Suggested for Liam O."
            action={<Tag tone="ink" icon={<Icon.Sparkles />}>Premium</Tag>}
          />
          <CardBody>
            <div className="rounded-xl border border-coral-100 bg-coral-50 px-4 py-3 text-[13px] leading-relaxed text-coral-700">
              “<b className="font-semibold">Friendship &amp; belonging</b>” (age 8–11) — based on recent check-ins.
            </div>
            <div className="mt-4 flex gap-2.5">
              <Button variant="ink" icon={<Icon.Send />}>Assign</Button>
              <Button variant="ghost" icon={<Icon.Book />}>Browse library</Button>
            </div>
          </CardBody>
        </Card>

        <div className="mt-4">
          <Banner icon={<Icon.Check />}>The AI only surfaces — a human assigns.</Banner>
        </div>
      </div>
    </AppShell>
  )
}
