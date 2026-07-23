/** SC-050 — Report view (AI-written) · FR-15-01. Narrative summary; figures rendered, never recomputed. Presentational only. */
import { AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Tag, Banner, Button, Icon } from '../components'

export function ReportView() {
  return (
    <AppShell {...chrome('teacher', 'Reports', <>Reports / Weekly wellbeing</>)}>
      <PageHeader
        crumb="Reports / Weekly wellbeing"
        title={<>Report view <Tag tone="ink" icon={<Icon.Sparkles />}>AI-written</Tag></>}
        sub="Year 5 — Maple · week of 20 Oct"
        right={<Button variant="ink" icon={<Icon.Download />}>Export / print</Button>}
      />

      <div className="max-w-[760px]">
        <Card>
          <CardHeader icon={<Icon.Report />} title="Weekly wellbeing — Year 5 Maple" />
          <CardBody>
            <p className="text-[13.5px] leading-[1.7] text-neutral-700">
              <b className="font-semibold">What's happening.</b> 24 of 28 pupils checked in this week (86%). The class
              mood held steady around “OK”, with a small cluster of low-mood days mid-week. Friendship problems were the
              most common theme in reflections (31 mentions), followed by exam stress ahead of next week's assessments.
            </p>
            <p className="mt-3 text-[13.5px] leading-[1.7] text-neutral-700">
              <b className="font-semibold">What changed.</b> Participation rose 6 points on last week. Two pupils moved
              from repeated low-mood check-ins into open interventions, both now being supported. No new immediate flags
              since Wednesday.
            </p>
            <p className="mt-3 text-[13.5px] leading-[1.7] text-neutral-700">
              <b className="font-semibold">What to look at next.</b> Liam O. and Zara M. remain on the watchlist — worth
              a quiet check-in. Consider running “Friendship &amp; belonging” with the whole class given the theme
              concentration, and a short breathing activity before assessments.
            </p>
            <div className="mt-4">
              <Banner icon={<Icon.Check />}>Figures come from single-owner formulas — rendered, never recomputed.</Banner>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
