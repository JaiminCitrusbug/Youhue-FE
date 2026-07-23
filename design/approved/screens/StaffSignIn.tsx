/**
 * SC-014 — Staff sign-in  ·  FR-01-03  ·  US-01-03
 * Presentational only (props in, markup out). Staff accounts only — students sign in
 * passwordless in their own app. Content mirrors the approved batch-3 preview 1:1.
 */
import { AuthCard, AuthField, Divider, Input, Button } from '../components'

/* Small vendor SSO logos — not in the kit; inline SVG with brand colours. */
function GoogleLogo() {
  return (
    <svg viewBox="0 0 18 18" className="h-[15px] w-[15px]" aria-hidden>
      {/* token-ok: vendor logo */}
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}
function MicrosoftLogo() {
  return (
    <svg viewBox="0 0 21 21" className="h-[14px] w-[14px]" aria-hidden>
      {/* token-ok: vendor logo */}
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  )
}

export function StaffSignIn() {
  return (
    <AuthCard
      title="Sign in to Student Wellbeing"
      sub="Staff accounts — students use the student app"
      footer={
        <>
          <div>
            <a href="#">Forgot password?</a> &nbsp;·&nbsp; <a href="#">Register a new school</a>
          </div>
          <div className="mt-3 flex justify-center gap-3 text-[11px] text-neutral-400">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
            <a href="#">COPPA/FERPA</a>
          </div>
        </>
      }
    >
      <AuthField label="School email">
        <Input type="email" defaultValue="r.okafor@maple-primary.sch.uk" />
      </AuthField>
      <AuthField label="Password">
        <Input type="password" defaultValue="passw0rdxx" />
      </AuthField>
      <Button variant="ink" block className="mt-1">Sign in</Button>

      <Divider>or</Divider>

      <div className="flex flex-col gap-2.5">
        <Button variant="ghost" block icon={<GoogleLogo />}>Continue with Google</Button>
        <Button variant="ghost" block icon={<MicrosoftLogo />}>Continue with Microsoft</Button>
      </div>
    </AuthCard>
  )
}
