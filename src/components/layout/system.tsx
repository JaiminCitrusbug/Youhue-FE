// Baseline system + static surfaces (folded from SYS-01): 404 / 500 / maintenance / Terms.
// FR-20-06 adds two more static legal pages here, following this exact pattern (a plain component,
// no state/API): PrivacyPolicy (SC-009) and CoppaFerpa (SC-010) — reused from
// design/approved/screens/{PrivacyPolicy,CoppaFerpa}.tsx (REUSE, never re-implement, CLAUDE.md
// step 7): composed from the SAME approved `LegalPage` frame + real copy, verbatim.
import { Icon, LegalPage } from "@design/components"

function SystemPage({ code, title, message }: { code?: string; title: string; message: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas p-6 text-center font-sans">
      <div>
        {code ? <p className="text-3xl font-black text-ink">{code}</p> : null}
        <h1 className="mt-2 text-xl font-bold text-neutral-900">{title}</h1>
        <p className="mt-1 text-neutral-600">{message}</p>
      </div>
    </div>
  )
}

export function NotFound404() {
  return <SystemPage code="404" title="Page not found" message="That page doesn’t exist." />
}

export function ServerError500() {
  return <SystemPage code="500" title="Something went wrong" message="Please try again shortly." />
}

export function Maintenance() {
  return <SystemPage title="Down for maintenance" message="Youhue is briefly unavailable." />
}

export function Terms() {
  return (
    <div className="mx-auto max-w-2xl p-8 font-sans">
      <h1 className="text-2xl font-black text-ink">Terms of Service</h1>
      <p className="mt-4 text-neutral-700">
        Placeholder terms — the final legal copy is provided at go-live.
      </p>
    </div>
  )
}

// SC-009 — Privacy Policy · FR-20-06. Verbatim from design/approved/screens/PrivacyPolicy.tsx.
export function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" updated="Last updated July 2026">
      <h4>Data we collect</h4>
      <p>
        We collect the minimum needed to run wellbeing check-ins: a mood check-in (one of six
        moods), an optional short reflection the student may choose to write, and the roster
        fields your school provides — typically first name, last initial, class, and year group.
        We do not ask students for home addresses, phone numbers, or any data we don&rsquo;t need.
      </p>

      <h4>How we use it</h4>
      <p>
        Check-in data is used for one purpose: helping staff notice and support student wellbeing.
        It powers class dashboards, trends over time, and alerts when a student may need
        attention. We never use it for any other purpose.
      </p>

      <h4>No advertising, no sale of data</h4>
      <p>
        We do not show advertising, we do not build advertising profiles, and we never sell,
        rent, or share student data with data brokers or advertisers. There is no third-party ad
        tracking anywhere in the product.
      </p>

      <h4>Your school controls the data</h4>
      <p>
        Your school is the data controller; we are the processor acting on its instructions. The
        school decides who can see what, can export its data at any time, and can request
        deletion. When your agreement ends, school data is deleted on the agreed schedule.
      </p>
    </LegalPage>
  )
}

// SC-010 — COPPA / FERPA & Data Protection · FR-20-06. Verbatim from
// design/approved/screens/CoppaFerpa.tsx, with one wired delta: the approved `Button` has no
// `href`, so a dead "Request compliance docs" control would ship (CLAUDE.md step 7 bans dead
// controls) — it is a real `mailto:` action here instead, styled to the SAME `ink` Button classes
// (theme utility classes only, no raw hex) since the shared Button primitive renders a <button>,
// not a link.
export function CoppaFerpa() {
  return (
    <LegalPage title="COPPA / FERPA & Data Protection" updated="Last updated July 2026">
      <h4>Built for US K&ndash;12</h4>
      <p>
        Student Wellbeing is designed to meet US student-privacy expectations, including COPPA
        and FERPA. Check-in records are treated as education records under FERPA and are handled
        accordingly.
      </p>

      <h4>Verifiable parental consent (school-mediated)</h4>
      <p>
        Consent is obtained through the school under the FERPA school-official exception, with
        school-mediated verifiable parental consent where COPPA applies. Schools manage consent
        status in-product and can withdraw a student at any time.
      </p>

      <h4>School-scoped data isolation</h4>
      <p>
        Every record is scoped to a single school. Staff can only ever reach their own
        school&rsquo;s data — there is no cross-school access, and isolation is enforced on every
        request, not just in the interface.
      </p>

      <h4>Audit trail &amp; no model training on children&rsquo;s data</h4>
      <p>
        Sensitive actions — exports, deletions, consent changes, and access to a student record —
        are written to an append-only audit log. We never use children&rsquo;s data to train AI
        models, and we never share it for that purpose.
      </p>

      <p className="font-semibold text-neutral-900">Paperwork ready for your school&rsquo;s lawyers.</p>

      <div className="mt-4">
        <a
          href="mailto:legal@youhue.app?subject=Compliance%20documentation%20request"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-ink-600 [&_svg]:h-[15px] [&_svg]:w-[15px]" // token-ok: copied verbatim from Button's `ink` variant (primitives.tsx) — Button renders <button>, not a link
        >
          <Icon.ArrowDown />
          Request compliance docs
        </a>
      </div>
    </LegalPage>
  )
}
