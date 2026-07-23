/**
 * SC-026 — Register a new school  ·  FR-02-01  ·  US-02-01
 * Presentational only. A trust admin approves the registration before go-live.
 */
import { AuthCard, AuthField, Input, Select, Button } from '../components'

export function RegisterSchool() {
  return (
    <AuthCard
      title="Register your school"
      sub="A trust admin approves it before you go live"
      footer={<a href="#">Back to sign in</a>}
    >
      <AuthField label="School name">
        <Input defaultValue="Maple Primary School" />
      </AuthField>
      <AuthField label="Your work email">
        <Input type="email" defaultValue="head@maple-primary.sch.uk" />
      </AuthField>
      <AuthField label="District / trust">
        <Select defaultValue="northwood">
          <option value="northwood">Northwood Learning Trust</option>
        </Select>
      </AuthField>
      <Button variant="ink" block className="mt-1">Submit for approval</Button>
    </AuthCard>
  )
}
