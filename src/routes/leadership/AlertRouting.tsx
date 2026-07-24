/**
 * SC-061 — Alert routing (FR-16-02 · US-16-02, surfacing config the FR-12-05 escalation ENGINE
 * will later consume — this ticket only stores + surfaces the ordered recipient chain, it does
 * not build the engine). REUSES `design/approved/screens/AlertRouting.tsx` in structure, copy and
 * classes, composed from `@design/components`. The approved screen is a read-only mock (a static
 * "Edit recipients" button with no expanded interaction shown); this ticket adds the real edit
 * flow the button opens — pick/reorder-by-append/remove recipients per alert type from THIS
 * school's own staff, then Save (real PATCH), with loading/error/disabled states throughout.
 *
 * Divergences from the approved screen — LOGGED, not silently reconciled:
 *  (a) No `<AppShell {...chrome('leadership', ...)}>` wrapper — same reasoning already logged on
 *      `StaffManagement.tsx` in this folder.
 *  (b) The approved screen shows recipients as generic ROLE labels ("Class teacher", "Pastoral
 *      lead", "Deputy") — illustrative preview copy. The real data model (`AlertRecipientConfig`)
 *      routes to actual STAFF accounts, so recipients are rendered by email (this school's own
 *      staff), not role labels.
 *  (c) Only `immediate` and `triage` alert types exist server-side (`FlagBand`); the approved
 *      screen's two rows match this exactly, so no divergence there.
 */
import { useCallback, useEffect, useState } from "react"

import {
  Banner, Button, Card, CardBody, CardHeader, Chip, EmptyState, Field, Icon, PageHeader, Select,
  Table, Tag,
} from "@design/components"

import { useAuth } from "../../app/AuthContext"
import {
  getSettings, leadershipErrorMessage, listStaff, updateAlertRouting, type AlertType,
  type SchoolSettings, type StaffRow,
} from "./api"

const ALERT_TYPES: { type: AlertType; label: string; tone: "danger" | "warn" }[] = [
  { type: "immediate", label: "Immediate", tone: "danger" },
  { type: "triage", label: "Triage", tone: "warn" },
]

function ChainOf({ ids, byId }: { ids: string[]; byId: Map<string, StaffRow> }) {
  if (ids.length === 0) return <span className="text-[13px] text-neutral-400">No recipients set</span> // token-ok: text-[13px] matches the approved Chain span's own scale (screens/AlertRouting.tsx:10)
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-[13px]"> {/* token-ok: approved value (do-not-restyle, screens/AlertRouting.tsx:10) */}
      {ids.map((id, i) => (
        <span key={id} className="inline-flex items-center gap-1.5">
          {i > 0 && <Icon.ChevronRight className="h-3.5 w-3.5 text-neutral-400" />}
          {byId.get(id)?.email ?? "Unknown"}
        </span>
      ))}
    </span>
  )
}

export function AlertRouting() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ""

  const [settings, setSettings] = useState<SchoolSettings | null>(null)
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<AlertType, string[]>>({ immediate: [], triage: [] })
  const [pickValue, setPickValue] = useState<Record<AlertType, string>>({ immediate: "", triage: "" })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!schoolId) return
    setLoading(true)
    setError(null)
    Promise.all([getSettings(schoolId), listStaff(schoolId)])
      .then(([settingsRes, staffRes]) => {
        setSettings(settingsRes.settings)
        setStaff(staffRes.staff.filter((s) => s.status === "active"))
        setLoading(false)
      })
      .catch((e: unknown) => {
        setError(leadershipErrorMessage(e))
        setLoading(false)
      })
  }, [schoolId])

  useEffect(() => {
    load()
  }, [load])

  const byId = new Map(staff.map((s) => [s.id, s]))

  function startEditing() {
    const current: Record<AlertType, string[]> = { immediate: [], triage: [] }
    for (const row of settings?.alert_routing ?? []) {
      current[row.alert_type] = row.recipient_staff_ids
    }
    setDraft(current)
    setSaveError(null)
    setEditing(true)
  }

  function addRecipient(type: AlertType) {
    const staffId = pickValue[type]
    if (!staffId) return
    setDraft((prev) => (
      prev[type].includes(staffId) ? prev : { ...prev, [type]: [...prev[type], staffId] }
    ))
    setPickValue((prev) => ({ ...prev, [type]: "" }))
  }

  function removeRecipient(type: AlertType, staffId: string) {
    setDraft((prev) => ({ ...prev, [type]: prev[type].filter((id) => id !== staffId) }))
  }

  function save() {
    if (!schoolId) return
    const routes = ALERT_TYPES
      .map(({ type }) => ({ alert_type: type, recipient_staff_ids: draft[type] }))
      .filter((r) => r.recipient_staff_ids.length > 0)
    if (routes.length === 0) {
      setSaveError("Add at least one recipient before saving.")
      return
    }
    setSaving(true)
    setSaveError(null)
    updateAlertRouting(schoolId, routes)
      .then((res) => {
        setSettings(res.settings)
        setSaving(false)
        setEditing(false)
      })
      .catch((e: unknown) => {
        setSaveError(leadershipErrorMessage(e))
        setSaving(false)
      })
  }

  function readOnlyBody() {
    if (loading) return <EmptyState title="Loading alert routing…" />
    if (error || !settings) {
      return (
        <EmptyState icon={<Icon.Alert />} title="Alert routing could not be loaded">{error}</EmptyState>
      )
    }
    const byType = new Map(settings.alert_routing.map((r) => [r.alert_type, r.recipient_staff_ids]))
    return (
      <Table
        head={["Alert", "Recipients (in order → escalation)"]}
        rows={ALERT_TYPES.map(({ type, label, tone }) => [
          <Tag key="tag" tone={tone} icon={<Icon.Alert />}>{label}</Tag>,
          <ChainOf key="chain" ids={byType.get(type) ?? []} byId={byId} />,
        ])}
      />
    )
  }

  function editBody() {
    return (
      <div className="p-4">
        {ALERT_TYPES.map(({ type, label }) => {
          const available = staff.filter((s) => !draft[type].includes(s.id))
          return (
            <Field key={type} label={`${label} recipients (in order)`}>
              <div className="mb-2 flex flex-wrap gap-2">
                {draft[type].length === 0 && (
                  <span className="text-[12.5px] text-neutral-400">No recipients yet</span> // token-ok: text-[12.5px]/text-neutral-400 muted-meta scale already used platform-wide (e.g. district-approvals CELL_TEXT_CLS)
                )}
                {draft[type].map((id) => (
                  <Chip key={id} onRemove={() => removeRecipient(type, id)}>
                    {byId.get(id)?.email ?? "Unknown"}
                  </Chip>
                ))}
              </div>
              <div className="flex gap-2">
                <Select
                  aria-label={`Add a recipient for ${label}`}
                  value={pickValue[type]}
                  onChange={(e) => setPickValue((prev) => ({ ...prev, [type]: e.target.value }))}
                  disabled={available.length === 0}
                >
                  <option value="">
                    {available.length === 0 ? "No more staff to add" : "Choose a colleague…"}
                  </option>
                  {available.map((s) => (
                    <option key={s.id} value={s.id}>{s.email}</option>
                  ))}
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={!pickValue[type]}
                  onClick={() => addRecipient(type)}
                >
                  Add
                </Button>
              </div>
            </Field>
          )
        })}

        {saveError && <Banner tone="danger" icon={<Icon.Alert />}>{saveError}</Banner>}

        <div className="mt-1 flex justify-end gap-2.5">
          <Button type="button" variant="ghost" disabled={saving} onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button type="button" variant="ink" icon={<Icon.Check />} disabled={saving} onClick={save}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        crumb="Who is notified for each priority band · order drives escalation"
        title="Alert routing"
        sub="Applies school-wide · overrides per class not enabled"
        right={
          !editing && !loading && !error ? (
            <Button type="button" variant="ink" icon={<Icon.Pencil />} onClick={startEditing}>
              Edit recipients
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardHeader icon={<Icon.Alert />} title="Who gets which alerts" hint="recipients in order → escalation" />
        <CardBody flush={!editing}>{editing ? editBody() : readOnlyBody()}</CardBody>
      </Card>
    </>
  )
}
