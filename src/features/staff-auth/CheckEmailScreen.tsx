/**
 * SC-016 — Forgot password · check email (FR-01-06). Step 2 of 3. Never discloses whether the
 * account exists — the copy is deliberately conditional ("If the account exists…").
 */
import { useNavigate } from "react-router-dom"

import { AuthCard, Banner, Button, Icon } from "../../components/ui"

export function CheckEmailScreen() {
  const navigate = useNavigate()
  return (
    <AuthCard title="Check your email" sub="Step 2 of 3">
      <Banner tone="info" icon={<Icon.Mail />}>
        If the account exists, a reset link has been sent. Check your inbox and spam folder.
      </Banner>
      <Button variant="ghost" block onClick={() => navigate("/sign-in")}>
        Back to sign in
      </Button>
    </AuthCard>
  )
}
