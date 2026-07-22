/**
 * Staff sign-in route module (FR-01-03 · decision #4 — staff auth is its own isolable FE module).
 * Mounted by the app router at `/sign-in/*`; owns the whole pre-auth staff surface:
 *   /sign-in              → StaffSignInScreen   (email/password + Google/Microsoft SSO, + MFA step)
 *   /sign-in/forgot       → ForgotPasswordScreen
 *   /sign-in/check-email  → CheckEmailScreen    (generic, no account-existence disclosure)
 *   /sign-in/reset        → SetNewPasswordScreen (from the emailed reset link ?token=…)
 *   /sign-in/link         → LinkSSOScreen        (first-time SSO → link to one identity)
 */
import { Navigate, Route, Routes } from "react-router-dom"

import { CheckEmailScreen } from "./CheckEmailScreen"
import { ForgotPasswordScreen } from "./ForgotPasswordScreen"
import { LinkSSOScreen } from "./LinkSSOScreen"
import { SetNewPasswordScreen } from "./SetNewPasswordScreen"
import { StaffSignInScreen } from "./StaffSignInScreen"

export function StaffAuthRoutes() {
  return (
    <Routes>
      <Route index element={<StaffSignInScreen />} />
      <Route path="forgot" element={<ForgotPasswordScreen />} />
      <Route path="check-email" element={<CheckEmailScreen />} />
      <Route path="reset" element={<SetNewPasswordScreen />} />
      <Route path="link" element={<LinkSSOScreen />} />
      <Route path="*" element={<Navigate to="/sign-in" replace />} />
    </Routes>
  )
}
