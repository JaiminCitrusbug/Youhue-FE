/**
 * SC-019 — Accept colleague invitation (FR-02-03 · US-02-03). PUBLIC (pre-login), owns its own
 * top-level route (`/accept-invite?token=…`, same pattern as `/sign-in/reset?token=…`).
 *
 * COMPOSED from the approved primitives (`@design/components`) on the structure, copy and classes
 * of `design/approved/screens/AcceptInvite.tsx`. That approved file is a static PREVIEW (hardcoded
 * "Year 5 — Maple" / "R. Okafor") — it is NOT imported.
 *
 * DELTAS vs the approved screen (raised, never silently reconciled):
 *  1. "Invited by" shows the inviter's real EMAIL, not a name — `StaffAccount` has no display-name
 *     field anywhere in the data model (the same real gap FR-04-01's review already found and
 *     resolved by dropping fabricated copy rather than inventing a field).
 *  2. A password field is ADDED, shown only after the first "Accept & set up" attempt reports the
 *     invitee has no existing account here yet (BE 422) — the approved mock's single button has no
 *     slot for it, but an account cannot be created without one. An existing colleague accepts
 *     with the single button and no password, exactly as the approved screen shows.
 */
import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { AuthCard, AuthField, Banner, Button, Icon, Input, KV } from "@design/components"

import { acceptInvitation, previewInvitation, type InvitationPreview } from "./api"

const SIGN_IN_PATH = "/sign-in"
const INVALID_MESSAGE =
  "This invitation link is invalid, expired, or has already been used. Ask the class owner to send a new one."
const DEACTIVATED_MESSAGE = "This account has been deactivated and can't accept invitations."
const GENERIC_ERROR = "Something went wrong. Please try again."

type LoadState =
  | { kind: "loading" }
  | { kind: "found"; preview: InvitationPreview }
  | { kind: "invalid" }

export function AcceptInviteScreen() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get("token") ?? ""

  const [load, setLoad] = useState<LoadState>({ kind: "loading" })
  const [needsPassword, setNeedsPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    if (!token) {
      setLoad({ kind: "invalid" })
      return
    }
    previewInvitation(token).then((outcome) => {
      setLoad(outcome.kind === "found" ? { kind: "found", preview: outcome.preview } : { kind: "invalid" })
    })
  }, [token])

  async function onAccept() {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const outcome = await acceptInvitation(token, needsPassword ? password : null)
      switch (outcome.kind) {
        case "accepted":
          setAccepted(true)
          break
        case "password_required":
          setNeedsPassword(true)
          break
        case "invalid":
          setError(INVALID_MESSAGE)
          break
        case "deactivated":
          setError(DEACTIVATED_MESSAGE)
          break
        case "error":
          setError(outcome.message)
          break
      }
    } catch {
      setError(GENERIC_ERROR)
    } finally {
      setSubmitting(false)
    }
  }

  if (accepted) {
    return (
      <AuthCard
        title="You're all set"
        sub="Your invitation has been accepted"
        footer={<Link to={SIGN_IN_PATH}>Back to sign in</Link>}
      >
        <div role="status">
          <Banner icon={<Icon.Check />}>You now have access to the shared class.</Banner>
        </div>
        <Button variant="ink" block className="mt-2.5" onClick={() => navigate(SIGN_IN_PATH)}>
          Go to sign in
        </Button>
      </AuthCard>
    )
  }

  if (load.kind === "loading") {
    return <AuthCard title="You&rsquo;ve been invited">Loading your invitation…</AuthCard>
  }

  if (load.kind === "invalid") {
    return (
      <AuthCard title="You&rsquo;ve been invited" footer={<Link to={SIGN_IN_PATH}>Back to sign in</Link>}>
        <div role="alert">
          <Banner tone="danger" icon={<Icon.Alert />}>{INVALID_MESSAGE}</Banner>
        </div>
      </AuthCard>
    )
  }

  const { preview } = load
  const complete = !needsPassword || password.length >= 8

  return (
    <AuthCard title="You&rsquo;ve been invited" footer={<Link to={SIGN_IN_PATH}>Back to sign in</Link>}>
      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <KV label="Class">{preview.class_name}</KV>
        <KV label="Invited by">{preview.inviter_email}</KV>
      </div>

      {error && (
        <div role="alert">
          <Banner tone="danger" icon={<Icon.Alert />}>{error}</Banner>
        </div>
      )}

      {needsPassword && (
        <AuthField label="Set a password">
          <Input
            type="password"
            aria-label="Set a password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </AuthField>
      )}

      <Button
        variant="ink"
        block
        disabled={submitting || !complete}
        onClick={() => void onAccept()}
      >
        {submitting ? "Accepting…" : "Accept & set up"}
      </Button>
    </AuthCard>
  )
}
