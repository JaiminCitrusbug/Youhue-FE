/**
 * SC-059 — Invite a colleague (FR-02-03 · US-02-03). Class-owner (teacher)-only; the BE
 * re-checks ownership + school scope on every write (403 otherwise).
 *
 * COMPOSED from the approved primitives (`@design/components`) on the structure, copy and classes
 * of `design/approved/screens/InviteColleague.tsx`. That approved file is a static PREVIEW (a
 * hardcoded `defaultValue` email, a single fixture "Year 5 — Maple" option, one hardcoded pending
 * row with `href`-less buttons) — it is NOT imported.
 *
 * DELTAS vs the approved screen (raised, never silently reconciled):
 *  1. The "Shared class" select is populated from a real `GET /classes/mine` (owned classes only)
 *     — no prior ticket exposed a class-list read; added here (logged) so the picker isn't a
 *     fixture. A caller who owns no class sees a real empty state, not a hardcoded option.
 *  2. The pending-invitations table is backed by a real `GET /classes/{id}/invitations` — also not
 *     in the ticket's literal "What to build", added for the same no-fixture reason (mirrors the
 *     FR-03-05 roster-list precedent).
 *  3. Resend/Revoke are real buttons wired to the action endpoint, with a per-row disabled/
 *     in-flight state while a request is outstanding (no dead controls).
 *
 * SHELL — same logged deviation as every other in-app screen this codebase has built: the approved
 * screen wraps itself in `AppShell {...chrome('teacher', ...)}`; this route mounts UNDER the real
 * routed app shell (`/app` layout route), so only the approved CONTENT is composed here.
 */
import { useCallback, useEffect, useState } from "react"

import {
  Button, Card, CardBody, CardHeader, EmptyState, Field, Icon, Input, Select, Table, Tag,
} from "@design/components"

import {
  actionOnInvitation,
  invitationsErrorMessage,
  listClassInvitations,
  listMyClasses,
  sendInvitation,
  type ClassOption,
  type InvitationRow,
} from "./api"

function statusTag(status: InvitationRow["status"]) {
  if (status === "accepted") return <Tag tone="ok" icon={<Icon.Check />}>Accepted</Tag>
  if (status === "revoked") return <Tag tone="mut" icon={<Icon.Minus />}>Revoked</Tag>
  if (status === "expired") return <Tag tone="mut" icon={<Icon.Minus />}>Expired</Tag>
  return <Tag tone="warn" icon={<Icon.Clock />}>Invited</Tag>
}

export function InviteColleagueApp() {
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [classesLoading, setClassesLoading] = useState(true)
  const [classesError, setClassesError] = useState<string | null>(null)
  const [selectedClassId, setSelectedClassId] = useState("")

  const [invitations, setInvitations] = useState<InvitationRow[]>([])
  const [rowsLoading, setRowsLoading] = useState(false)

  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formNotice, setFormNotice] = useState<string | null>(null)
  const [pendingActionId, setPendingActionId] = useState<string | null>(null)

  useEffect(() => {
    listMyClasses()
      .then((rows) => {
        setClasses(rows)
        setSelectedClassId((current) => current || rows[0]?.id || "")
        setClassesLoading(false)
      })
      .catch((e: unknown) => {
        setClassesError(invitationsErrorMessage(e))
        setClassesLoading(false)
      })
  }, [])

  const loadInvitations = useCallback((classId: string) => {
    if (!classId) return
    setRowsLoading(true)
    listClassInvitations(classId)
      .then((rows) => {
        setInvitations(rows)
        setRowsLoading(false)
      })
      .catch(() => {
        setRowsLoading(false)
      })
  }, [])

  useEffect(() => {
    if (selectedClassId) loadInvitations(selectedClassId)
  }, [selectedClassId, loadInvitations])

  async function onSend() {
    const trimmed = email.trim()
    if (!trimmed || !selectedClassId || sending) return
    setSending(true)
    setFormError(null)
    setFormNotice(null)
    try {
      await sendInvitation(selectedClassId, trimmed)
      setEmail("")
      setFormNotice(`Invitation sent to ${trimmed}.`)
      loadInvitations(selectedClassId)
    } catch (e) {
      setFormError(invitationsErrorMessage(e))
    } finally {
      setSending(false)
    }
  }

  async function onAction(invitationId: string, action: "resend" | "revoke") {
    setPendingActionId(invitationId)
    setFormError(null)
    try {
      await actionOnInvitation(invitationId, action)
      loadInvitations(selectedClassId)
    } catch (e) {
      setFormError(invitationsErrorMessage(e))
    } finally {
      setPendingActionId(null)
    }
  }

  if (classesLoading) {
    return <EmptyState title="Loading your classes…" />
  }
  if (classesError) {
    return <EmptyState icon={<Icon.Alert />} title="Classes could not be loaded">{classesError}</EmptyState>
  }
  if (classes.length === 0) {
    return (
      <EmptyState icon={<Icon.Users />} title="No classes yet">
        You need to own a class before you can invite a colleague to share it.
      </EmptyState>
    )
  }

  return (
    <>
      <Card className="mb-4 max-w-[600px]"> {/* token-ok: approved value (do-not-restyle, screens/InviteColleague.tsx:19) */}
        <CardHeader icon={<Icon.Send />} title="Send an invitation" />
        <CardBody>
          {formError && (
            <p role="alert" className="mb-3 text-xs font-semibold text-status-danger">
              {formError}
            </p>
          )}
          {formNotice && !formError && (
            <p role="status" className="mb-3 text-xs font-semibold text-status-ok">
              {formNotice}
            </p>
          )}
          <Field label="Email">
            <Input
              type="email"
              aria-label="Colleague's email"
              placeholder="colleague@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Shared class">
            <Select
              aria-label="Shared class"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Button
            variant="ink"
            icon={<Icon.Send />}
            disabled={sending || !email.trim()}
            onClick={() => void onSend()}
          >
            {sending ? "Sending…" : "Send invite"}
          </Button>
        </CardBody>
      </Card>

      <Card className="max-w-[760px]"> {/* token-ok: approved value (do-not-restyle, screens/InviteColleague.tsx:34) */}
        <CardHeader icon={<Icon.Clock />} title="Pending invitations" hint="single-use, expiring links" />
        <CardBody flush>
          {rowsLoading ? (
            <EmptyState title="Loading invitations…" />
          ) : invitations.length === 0 ? (
            <EmptyState icon={<Icon.Clock />} title="No invitations yet">
              Invitations you send for this class will appear here.
            </EmptyState>
          ) : (
            <Table
              head={["Email", "Status", "Action"]}
              rows={invitations.map((inv) => [
                <>{inv.email}</>,
                statusTag(inv.status),
                inv.status === "invited" || inv.status === "sent" ? (
                  <span key="actions" className="flex items-center gap-2.5 text-[12px] font-semibold text-coral-600"> {/* token-ok: approved value (do-not-restyle, screens/InviteColleague.tsx:44) */}
                    <button
                      type="button"
                      disabled={pendingActionId === inv.id}
                      onClick={() => void onAction(inv.id, "resend")}
                    >
                      {pendingActionId === inv.id ? "Working…" : "Resend"}
                    </button>
                    <span className="text-neutral-300">·</span>
                    <button
                      type="button"
                      disabled={pendingActionId === inv.id}
                      onClick={() => void onAction(inv.id, "revoke")}
                    >
                      Revoke
                    </button>
                  </span>
                ) : (
                  <span className="text-[12.5px] text-neutral-400">—</span> // token-ok: text-[12.5px]/text-neutral-400 muted-meta scale already used platform-wide (e.g. StaffManagement.tsx)
                ),
              ])}
            />
          )}
        </CardBody>
      </Card>
    </>
  )
}
