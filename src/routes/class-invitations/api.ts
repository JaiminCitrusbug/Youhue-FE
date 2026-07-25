import { api } from "../../api/client"

// FR-02-03 · SC-059 — invite a colleague to co-teach a shared class. Class-owner-only,
// same-school (BE re-checks ownership + school_id match; 403 otherwise).
//
//   GET  /classes/mine                          -> { classes: ClassOption[] }  (owned only)
//   GET  /classes/{id}/invitations              -> { invitations: InvitationRow[] }
//   POST /classes/{id}/invitations { email }     -> 201 { invitation_id, status: "sent" }
//   POST /invitations/{id}/action { action }     -> 200 { status } | 403 | 404 | 409
//
// Errors are surfaced as GENERIC copy (never a raw server message), matching the FR-16-02 convention.

export interface ClassOption {
  id: string
  name: string
}

export interface InvitationRow {
  id: string
  email: string
  status: "invited" | "sent" | "accepted" | "revoked" | "expired"
}

export function invitationsErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : ""
  const status = Number(/(\d{3})/.exec(msg)?.[1])
  if (status === 403) return "You don't own this class."
  if (status === 404) return "That class or invitation no longer exists."
  if (status === 409) return "This email already has a pending invitation to this class."
  if (status === 422) return "That value isn't valid — check it and try again."
  return "Something went wrong. Please try again."
}

export async function listMyClasses(): Promise<ClassOption[]> {
  const res = await api<{ classes: ClassOption[] }>("/classes/mine")
  return res.classes
}

export async function listClassInvitations(classId: string): Promise<InvitationRow[]> {
  const res = await api<{ invitations: InvitationRow[] }>(`/classes/${classId}/invitations`)
  return res.invitations
}

export async function sendInvitation(
  classId: string,
  email: string,
): Promise<{ invitation_id: string; status: "sent" }> {
  return api<{ invitation_id: string; status: "sent" }>(`/classes/${classId}/invitations`, {
    method: "POST",
    body: JSON.stringify({ email }),
  })
}

export async function actionOnInvitation(
  invitationId: string,
  action: "resend" | "revoke",
): Promise<{ status: string }> {
  return api<{ status: string }>(`/invitations/${invitationId}/action`, {
    method: "POST",
    body: JSON.stringify({ action }),
  })
}
