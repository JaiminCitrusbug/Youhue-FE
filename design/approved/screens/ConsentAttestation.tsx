/** SC-088 — Parental-consent attestation · FR-20-06. Presentational (props in, markup out). */
import {
  AppShell, chrome, PageHeader, Button, Banner, Card, CardHeader, CardBody,
  Table, PersonCell, Chip, Tag, Icon,
} from '../components'

const crumb = <span><a href="#" className="hover:underline">Leadership</a>{'  /  '}Consent</span>

const ConfirmChip = () => (
  <Chip>
    <span className="inline-block h-3.5 w-3.5 rounded border-[1.6px] border-neutral-400" />
    Confirm
  </Chip>
)

export function ConsentAttestation() {
  return (
    <AppShell {...chrome('leadership', 'Consent', crumb)}>
      <PageHeader
        crumb="COPPA · school-mediated · there is no parent-facing screen"
        title="Parental-consent attestation"
        sub="The school confirms consent on the parent’s behalf"
        right={<Button variant="ink" icon={<Icon.Check />}>Record consent</Button>}
      />

      <Banner tone="info" icon={<Icon.Shield />}>
        Confirm verifiable parental consent has been obtained (COPPA) — school-mediated; no parent-facing screen.
      </Banner>

      <Card>
        <CardHeader icon={<Icon.Users />} title="Students" hint="tick to attest, then Record consent" />
        <CardBody flush>
          <Table
            head={['Student', 'Consent']}
            rows={[
              [<PersonCell initials="AK" name="Aisha K." />, <ConfirmChip />],
              [<PersonCell initials="LO" name="Liam O." />, <ConfirmChip />],
              [<PersonCell initials="NP" name="Noah P." />, <Tag tone="ok" icon={<Icon.Check />}>Recorded</Tag>],
            ]}
          />
        </CardBody>
      </Card>
    </AppShell>
  )
}
