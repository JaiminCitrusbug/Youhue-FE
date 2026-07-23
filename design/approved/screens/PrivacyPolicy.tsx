/** SC-009 — Privacy Policy · FR-20-06. Presentational. */
import { LegalPage } from '../components'

export function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" updated="Last updated July 2026">
      <h4>Data we collect</h4>
      <p>We collect the minimum needed to run wellbeing check-ins: a mood check-in (one of six moods), an optional short reflection the student may choose to write, and the roster fields your school provides — typically first name, last initial, class, and year group. We do not ask students for home addresses, phone numbers, or any data we don&rsquo;t need.</p>

      <h4>How we use it</h4>
      <p>Check-in data is used for one purpose: helping staff notice and support student wellbeing. It powers class dashboards, trends over time, and alerts when a student may need attention. We never use it for any other purpose.</p>

      <h4>No advertising, no sale of data</h4>
      <p>We do not show advertising, we do not build advertising profiles, and we never sell, rent, or share student data with data brokers or advertisers. There is no third-party ad tracking anywhere in the product.</p>

      <h4>Your school controls the data</h4>
      <p>Your school is the data controller; we are the processor acting on its instructions. The school decides who can see what, can export its data at any time, and can request deletion. When your agreement ends, school data is deleted on the agreed schedule.</p>
    </LegalPage>
  )
}
