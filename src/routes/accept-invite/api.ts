import { authFetch } from "../../api/client"

// FR-02-03 · SC-019 — accepting a shared-class colleague invitation. PUBLIC (pre-login): the
// invitee has no account yet, or is only proving control of the invite link — never a session.
//
//   GET  /invitations/{token}                        -> 200 { class_name, inviter_email } | 400
//   POST /invitations/accept { token, password? }     -> 200 { school_id, class_id } | 400 | 403 | 422
//
// `password` is required only when the invitee has no existing account at this school yet — the
// client cannot know this in advance without an email-existence oracle, so accept is attempted
// WITHOUT a password first; a 422 means "create an account" and the screen asks for one.

export interface InvitationPreview {
  class_name: string
  inviter_email: string
}

export type PreviewOutcome =
  | { kind: "found"; preview: InvitationPreview }
  | { kind: "invalid" }

export type AcceptOutcome =
  | { kind: "accepted"; school_id: string; class_id: string }
  | { kind: "password_required" }
  | { kind: "invalid" }
  | { kind: "deactivated" }
  | { kind: "error"; message: string }

const GENERIC_ERROR = "Something went wrong. Please try again."

export async function previewInvitation(token: string): Promise<PreviewOutcome> {
  const { status, data } = await authFetch<InvitationPreview>(
    `/invitations/${encodeURIComponent(token)}`,
    undefined,
    "GET",
  )
  if (status === 200 && data) return { kind: "found", preview: data }
  return { kind: "invalid" }
}

export async function acceptInvitation(
  token: string,
  password: string | null,
): Promise<AcceptOutcome> {
  const body: { token: string; password?: string } = { token }
  if (password) body.password = password
  const { status, data } = await authFetch<{ school_id: string; class_id: string }>(
    "/invitations/accept",
    body,
  )
  if (status === 200 && data) {
    return { kind: "accepted", school_id: data.school_id, class_id: data.class_id }
  }
  switch (status) {
    case 400:
      return { kind: "invalid" }
    case 403:
      return { kind: "deactivated" }
    case 422:
      return { kind: "password_required" }
    default:
      return { kind: "error", message: GENERIC_ERROR }
  }
}
