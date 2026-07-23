/** SC-008 — Terms of Service. Presentational. */
import { LegalPage } from '../components'

export function TermsOfService() {
  return (
    <LegalPage title="Terms of Service" updated="Last updated July 2026">
      <h4>Using the service</h4>
      <p>Student Wellbeing is a check-in tool provided to your school under an agreement with your district or trust. By using it you agree to these terms. The service is intended for classroom wellbeing check-ins only — it is not a diagnostic, medical, or emergency service, and it does not replace a trained counsellor or a call to emergency services.</p>

      <h4>School accounts &amp; rosters</h4>
      <p>Accounts are created and managed by your school. Staff sign in with a school-issued email; students sign in without an email using a class code, name pick, or QR — no student passwords are stored. Your school is responsible for keeping rosters accurate and for removing staff and students who leave.</p>

      <h4>Acceptable use</h4>
      <p>You agree not to misuse the service: no attempting to access data outside your own school, no scraping or bulk export beyond the tools we provide, and no using check-in data to discipline or single out a student. Concerning responses are for support, not sanction.</p>

      <h4>Liability</h4>
      <p>We provide the service &quot;as is&quot; and work hard to keep it available and accurate, but we are not liable for indirect or consequential losses. Nothing in these terms limits liability that cannot be limited by law. Your school&rsquo;s signed agreement governs where these terms and it differ.</p>
    </LegalPage>
  )
}
