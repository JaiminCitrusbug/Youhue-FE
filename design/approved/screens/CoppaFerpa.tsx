/** SC-010 — COPPA / FERPA & Data Protection · FR-20-06. Presentational. */
import { LegalPage, Button, Icon } from '../components'

export function CoppaFerpa() {
  return (
    <LegalPage title="COPPA / FERPA & Data Protection" updated="Last updated July 2026">
      <h4>Built for US K&ndash;12</h4>
      <p>Student Wellbeing is designed to meet US student-privacy expectations, including COPPA and FERPA. Check-in records are treated as education records under FERPA and are handled accordingly.</p>

      <h4>Verifiable parental consent (school-mediated)</h4>
      <p>Consent is obtained through the school under the FERPA school-official exception, with school-mediated verifiable parental consent where COPPA applies. Schools manage consent status in-product and can withdraw a student at any time.</p>

      <h4>School-scoped data isolation</h4>
      <p>Every record is scoped to a single school. Staff can only ever reach their own school&rsquo;s data — there is no cross-school access, and isolation is enforced on every request, not just in the interface.</p>

      <h4>Audit trail &amp; no model training on children&rsquo;s data</h4>
      <p>Sensitive actions — exports, deletions, consent changes, and access to a student record — are written to an append-only audit log. We never use children&rsquo;s data to train AI models, and we never share it for that purpose.</p>

      <p className="font-semibold text-neutral-900">Paperwork ready for your school&rsquo;s lawyers.</p>

      <div className="mt-4">
        <Button variant="ink" icon={<Icon.ArrowDown />}>Request compliance docs</Button>
      </div>
    </LegalPage>
  )
}
