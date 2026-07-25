import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AcceptInviteScreen } from "./AcceptInviteScreen"
import type { AcceptOutcome, InvitationPreview, PreviewOutcome } from "./api"

// FR-02-03 · SC-019 — behaviour tests for accepting a shared-class colleague invitation. PUBLIC
// (pre-login) flow: preview-then-accept, covering the ticket's positive and negative acceptance
// scenarios against the statuses the BUILT backend returns (400 invalid/expired/used token, 403
// deactivated account, 422 password-required for a brand-new colleague).

const api = vi.hoisted(() => ({
  previewInvitation: vi.fn(),
  acceptInvitation: vi.fn(),
}))
vi.mock("./api", () => ({
  previewInvitation: api.previewInvitation,
  acceptInvitation: api.acceptInvitation,
}))

const PREVIEW: InvitationPreview = { class_name: "Year 5 — Maple", inviter_email: "head@oakwood.edu" }
const FOUND: PreviewOutcome = { kind: "found", preview: PREVIEW }

function renderApp(token = "real-token-123") {
  render(
    <MemoryRouter initialEntries={[`/accept-invite?token=${token}`]}>
      <Routes>
        <Route path="/accept-invite" element={<AcceptInviteScreen />} />
        <Route path="/sign-in" element={<h1>Sign in to Student Wellbeing</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

const acceptButton = () => screen.getByRole("button", { name: /accept & set up|accepting/i })

describe("AcceptInviteScreen (FR-02-03 · SC-019)", () => {
  beforeEach(() => {
    api.previewInvitation.mockReset().mockResolvedValue(FOUND)
    api.acceptInvitation.mockReset()
  })

  // --- preview: real class + inviter data, never fabricated --------------------------------------
  it("shows the real class name and inviter email from the server, not fabricated copy", async () => {
    renderApp()
    expect(await screen.findByText("Year 5 — Maple")).toBeInTheDocument()
    expect(screen.getByText("head@oakwood.edu")).toBeInTheDocument()
    // the approved static preview's fixture values must never ship
    expect(screen.queryByText(/r\. okafor/i)).not.toBeInTheDocument()
  })

  it("shows an invalid-link error and no class/inviter data when the token doesn't resolve", async () => {
    api.previewInvitation.mockResolvedValue({ kind: "invalid" } satisfies PreviewOutcome)
    renderApp()
    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid, expired, or has already been used/i)
    expect(screen.queryByText(/invited by/i)).not.toBeInTheDocument()
  })

  it("shows the invalid-link error immediately when the URL carries no token at all", async () => {
    renderApp("")
    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid, expired, or has already been used/i)
    expect(api.previewInvitation).not.toHaveBeenCalled()
  })

  // --- Scenario: an EXISTING colleague accepts with no password needed ---------------------------
  it("accepts an existing colleague's invitation with no password field shown", async () => {
    const user = userEvent.setup()
    api.acceptInvitation.mockResolvedValue(
      { kind: "accepted", school_id: "sch1", class_id: "cls1" } satisfies AcceptOutcome,
    )
    renderApp()
    await screen.findByText("Year 5 — Maple")

    expect(screen.queryByLabelText(/set a password/i)).not.toBeInTheDocument()
    await user.click(acceptButton())

    await waitFor(() => expect(api.acceptInvitation).toHaveBeenCalledWith("real-token-123", null))
    expect(await screen.findByRole("heading", { name: /you're all set/i })).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent(/access to the shared class/i)
  })

  // --- Scenario: a BRAND-NEW colleague is asked for a password on the 422 branch ------------------
  it("reveals a password field after a 422, then accepts with the password on retry", async () => {
    const user = userEvent.setup()
    api.acceptInvitation
      .mockResolvedValueOnce({ kind: "password_required" } satisfies AcceptOutcome)
      .mockResolvedValueOnce(
        { kind: "accepted", school_id: "sch1", class_id: "cls1" } satisfies AcceptOutcome,
      )
    renderApp()
    await screen.findByText("Year 5 — Maple")

    await user.click(acceptButton())
    expect(await screen.findByLabelText(/set a password/i)).toBeInTheDocument()
    expect(api.acceptInvitation).toHaveBeenNthCalledWith(1, "real-token-123", null)

    // too short — the button stays disabled (server minimum is 8, convenience-checked client-side)
    await user.type(screen.getByLabelText(/set a password/i), "short")
    expect(acceptButton()).toBeDisabled()

    await user.clear(screen.getByLabelText(/set a password/i))
    await user.type(screen.getByLabelText(/set a password/i), "ColleaguePass1")
    await user.click(acceptButton())

    await waitFor(() =>
      expect(api.acceptInvitation).toHaveBeenNthCalledWith(2, "real-token-123", "ColleaguePass1"),
    )
    expect(await screen.findByRole("heading", { name: /you're all set/i })).toBeInTheDocument()
  })

  // --- NEG: invalid/expired/already-used token at accept time -------------------------------------
  it("surfaces a 400 (invalid/expired/used token) at accept time", async () => {
    const user = userEvent.setup()
    api.acceptInvitation.mockResolvedValue({ kind: "invalid" } satisfies AcceptOutcome)
    renderApp()
    await screen.findByText("Year 5 — Maple")

    await user.click(acceptButton())
    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid, expired, or has already been used/i)
  })

  // --- NEG: the invitee's existing account at this school is deactivated --------------------------
  it("surfaces a 403 (deactivated account) error", async () => {
    const user = userEvent.setup()
    api.acceptInvitation.mockResolvedValue({ kind: "deactivated" } satisfies AcceptOutcome)
    renderApp()
    await screen.findByText("Year 5 — Maple")

    await user.click(acceptButton())
    expect(await screen.findByRole("alert")).toHaveTextContent(/deactivated/i)
  })

  it("surfaces a network failure as a generic error instead of failing silently", async () => {
    const user = userEvent.setup()
    api.acceptInvitation.mockRejectedValue(new Error("offline"))
    renderApp()
    await screen.findByText("Year 5 — Maple")

    await user.click(acceptButton())
    expect(await screen.findByRole("alert")).toHaveTextContent(/something went wrong/i)
  })

  // --- busy / no double-submit --------------------------------------------------------------------
  it("shows a busy state during accept and cannot be submitted twice", async () => {
    const user = userEvent.setup()
    let settle: (o: AcceptOutcome) => void = () => {}
    api.acceptInvitation.mockReturnValue(
      new Promise<AcceptOutcome>((resolve) => {
        settle = resolve
      }),
    )
    renderApp()
    await screen.findByText("Year 5 — Maple")

    await user.click(acceptButton())
    expect(screen.getByRole("button", { name: /accepting/i })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: /accepting/i }))
    expect(api.acceptInvitation).toHaveBeenCalledTimes(1)

    settle({ kind: "accepted", school_id: "sch1", class_id: "cls1" })
    expect(await screen.findByRole("heading", { name: /you're all set/i })).toBeInTheDocument()
  })

  // --- no dead controls: the footer link is a real route -------------------------------------------
  it("the footer link routes to sign-in (no href='#')", async () => {
    const user = userEvent.setup()
    renderApp()
    await screen.findByText("Year 5 — Maple")

    const link = screen.getByRole("link", { name: /back to sign in/i })
    expect(link).toHaveAttribute("href", "/sign-in")
    await user.click(link)
    expect(screen.getByRole("heading", { name: /sign in to student wellbeing/i })).toBeInTheDocument()
  })
})
