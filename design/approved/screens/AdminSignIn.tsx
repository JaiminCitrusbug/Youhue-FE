/** SC-073 — Admin sign-in (MFA) + MFA challenge · FR-19-01. Presentational. Pre-login (AuthCard). */
import { AuthCard, AuthField, Divider, Input, Button, Banner, Icon } from '../components'

export function AdminSignIn() {
  return (
    <AuthCard title="Internal admin" sub="MFA required">
      <AuthField label="Email">
        <Input type="email" defaultValue="t.ng@studentwellbeing.school" />
      </AuthField>
      <AuthField label="Password">
        <Input type="password" defaultValue="1234567890" />
      </AuthField>
      <Button variant="ink" block icon={<Icon.Flag />} className="mt-1">Continue</Button>
      <Divider>then</Divider>
      <Banner tone="info" icon={<Icon.Flag />}>
        You’ll be asked for a 6-digit MFA code.
      </Banner>
    </AuthCard>
  )
}

/** A row of 6 single-digit MFA code boxes (theme-bound utilities — no hex). */
function CodeBoxes({ values }: { values: string[] }) {
  return (
    <div className="my-1 mb-4 flex justify-center gap-2.5">
      {values.map((v, i) => (
        <input
          key={i}
          maxLength={1}
          defaultValue={v}
          aria-label={`Digit ${i + 1}`}
          className={`h-[46px] w-[46px] rounded-md border border-neutral-200 bg-neutral-50 text-center text-[19px] font-extrabold focus:border-coral focus:shadow-focus focus:outline-none ${v ? 'text-neutral-900' : 'text-neutral-300'}`}
        />
      ))}
    </div>
  )
}

export function AdminMfaChallenge() {
  return (
    <AuthCard
      title="MFA challenge"
      sub="Enter the 6-digit code from your authenticator"
      footer={<>Lost your device? <a href="#">Contact platform security</a></>}
    >
      <CodeBoxes values={['4', '8', '1', '', '', '']} />
      <Button variant="ink" block icon={<Icon.Check />}>Verify</Button>
    </AuthCard>
  )
}
