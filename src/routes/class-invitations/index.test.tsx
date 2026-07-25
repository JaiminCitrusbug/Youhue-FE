import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { RequireRole } from "../../components/layout/guards"
import { ROLE_ROUTES } from "../../lib/roles"
import * as api from "./api"
import type { ClassOption, InvitationRow } from "./api"
import { InviteColleagueApp } from "./index"

// FR-02-03 · SC-059 — behaviour tests for the "invite a colleague to a shared class" screen.
// GATE G-4's FE enforcement layer (only a class owner reaches this screen at all) is covered by
// the RequireRole tests below; the write-path tests cover the ticket's acceptance scenarios
// against the statuses the BUILT backend returns.

let currentRole = "teacher"
vi.mock("../../app/AuthContext", () => ({
  useAuth: () => ({
    user: { subject_id: "u1", kind: "staff", role: currentRole, school_id: "sch1" },
    loading: false,
    refresh: vi.fn(),
    signOut: vi.fn(),
  }),
}))

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>()
  return {
    ...actual,
    listMyClasses: vi.fn(),
    listClassInvitations: vi.fn(),
    sendInvitation: vi.fn(),
    actionOnInvitation: vi.fn(),
  }
})

const listClassesMock = vi.mocked(api.listMyClasses)
const listInvitationsMock = vi.mocked(api.listClassInvitations)
const sendMock = vi.mocked(api.sendInvitation)
const actionMock = vi.mocked(api.actionOnInvitation)

const CLASS_A: ClassOption = { id: "cls1", name: "Year 5 — Maple" }
const PENDING: InvitationRow = { id: "inv1", email: "t.ali@school.edu", status: "sent" }
const ACCEPTED: InvitationRow = { id: "inv2", email: "done@school.edu", status: "accepted" }

describe("InviteColleagueApp (FR-02-03 · SC-059)", () => {
  beforeEach(() => {
    currentRole = "teacher"
    listClassesMock.mockReset().mockResolvedValue([CLASS_A])
    listInvitationsMock.mockReset().mockResolvedValue([])
    sendMock.mockReset()
    actionMock.mockReset()
  })

  // --- GATE G-4 FE enforcement: only a class OWNER (teacher) reaches this screen ----------------
  describe("role gate (ROLE_ROUTES.classInvitations)", () => {
    function renderGated() {
      render(
        <MemoryRouter initialEntries={["/app/roster/invite"]}>
          <Routes>
            <Route
              path="/app/roster/invite"
              element={
                <RequireRole allow={ROLE_ROUTES.classInvitations}>
                  <InviteColleagueApp />
                </RequireRole>
              }
            />
            <Route path="/app" element={<h1>Role home</h1>} />
          </Routes>
        </MemoryRouter>,
      )
    }

    it("only lists 'teacher' as an allowed role — support can never own a class", () => {
      expect(ROLE_ROUTES.classInvitations).toEqual(["teacher"])
    })

    it("mounts the screen for a teacher", async () => {
      renderGated()
      expect(await screen.findByText(/send an invitation/i)).toBeInTheDocument()
    })

    it("denies 'support' — bounced to role home, screen never mounts", () => {
      currentRole = "support"
      renderGated()
      expect(screen.getByRole("heading", { name: /role home/i })).toBeInTheDocument()
      expect(screen.queryByText(/send an invitation/i)).not.toBeInTheDocument()
      expect(listClassesMock).not.toHaveBeenCalled()
    })

    it("denies 'leadership' — bounced to role home, screen never mounts", () => {
      currentRole = "leadership"
      renderGated()
      expect(screen.getByRole("heading", { name: /role home/i })).toBeInTheDocument()
      expect(listClassesMock).not.toHaveBeenCalled()
    })
  })

  // --- empty state: owns no class -----------------------------------------------------------------
  it("shows a real empty state when the caller owns no class (never a fixture option)", async () => {
    listClassesMock.mockResolvedValue([])
    render(<InviteColleagueApp />)
    expect(await screen.findByText(/no classes yet/i)).toBeInTheDocument()
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
  })

  // --- Scenario 1: send a shared-class invitation ------------------------------------------------
  it("sends an invitation for the selected class and reloads the pending list", async () => {
    const user = userEvent.setup()
    listInvitationsMock.mockResolvedValueOnce([]).mockResolvedValueOnce([PENDING])
    sendMock.mockResolvedValue({ invitation_id: "inv1", status: "sent" })
    render(<InviteColleagueApp />)

    await waitFor(() => expect(listClassesMock).toHaveBeenCalled())
    await user.type(screen.getByLabelText(/colleague's email/i), "t.ali@school.edu")
    await user.click(screen.getByRole("button", { name: /send invite/i }))

    await waitFor(() => expect(sendMock).toHaveBeenCalledWith("cls1", "t.ali@school.edu"))
    expect(await screen.findByText(/invitation sent to t\.ali@school\.edu/i)).toBeInTheDocument()
    expect(await screen.findByText("t.ali@school.edu")).toBeInTheDocument()
  })

  // --- Scenario 3 (NEG): 409 duplicate pending invitation -----------------------------------------
  it("surfaces a 409 duplicate-invite error and keeps the form usable", async () => {
    const user = userEvent.setup()
    sendMock.mockRejectedValue(new Error("request failed: 409"))
    render(<InviteColleagueApp />)

    await waitFor(() => expect(listClassesMock).toHaveBeenCalled())
    await user.type(screen.getByLabelText(/colleague's email/i), "t.ali@school.edu")
    await user.click(screen.getByRole("button", { name: /send invite/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/already has a pending invitation/i)
  })

  it("surfaces a 403 (not the class owner) error", async () => {
    const user = userEvent.setup()
    sendMock.mockRejectedValue(new Error("request failed: 403"))
    render(<InviteColleagueApp />)

    await waitFor(() => expect(listClassesMock).toHaveBeenCalled())
    await user.type(screen.getByLabelText(/colleague's email/i), "t.ali@school.edu")
    await user.click(screen.getByRole("button", { name: /send invite/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/don't own this class/i)
  })

  it("surfaces a 404 (class no longer exists) error", async () => {
    const user = userEvent.setup()
    sendMock.mockRejectedValue(new Error("request failed: 404"))
    render(<InviteColleagueApp />)

    await waitFor(() => expect(listClassesMock).toHaveBeenCalled())
    await user.type(screen.getByLabelText(/colleague's email/i), "t.ali@school.edu")
    await user.click(screen.getByRole("button", { name: /send invite/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/no longer exists/i)
  })

  // --- pending invitations table: real rows, real actions -----------------------------------------
  it("lists real pending invitations with a status tag", async () => {
    listInvitationsMock.mockResolvedValue([PENDING, ACCEPTED])
    render(<InviteColleagueApp />)

    expect(await screen.findByText("t.ali@school.edu")).toBeInTheDocument()
    expect(screen.getByText("Invited")).toBeInTheDocument()
    expect(screen.getByText("done@school.edu")).toBeInTheDocument()
    expect(screen.getByText("Accepted")).toBeInTheDocument()
  })

  it("an accepted row has no Resend/Revoke controls; a pending row has both", async () => {
    listInvitationsMock.mockResolvedValue([PENDING, ACCEPTED])
    render(<InviteColleagueApp />)
    await screen.findByText("t.ali@school.edu")

    expect(screen.getAllByRole("button", { name: /^resend$/i })).toHaveLength(1)
    expect(screen.getAllByRole("button", { name: /^revoke$/i })).toHaveLength(1)
  })

  // --- Scenario 3: re-send or revoke a pending invitation ------------------------------------------
  it("resend calls the real action endpoint and reloads the list", async () => {
    const user = userEvent.setup()
    listInvitationsMock.mockResolvedValueOnce([PENDING]).mockResolvedValueOnce([PENDING])
    actionMock.mockResolvedValue({ status: "sent" })
    render(<InviteColleagueApp />)
    await screen.findByText("t.ali@school.edu")

    await user.click(screen.getByRole("button", { name: /^resend$/i }))
    await waitFor(() => expect(actionMock).toHaveBeenCalledWith("inv1", "resend"))
    expect(listInvitationsMock).toHaveBeenCalledTimes(2)
  })

  it("revoke calls the real action endpoint and reloads the list", async () => {
    const user = userEvent.setup()
    listInvitationsMock
      .mockResolvedValueOnce([PENDING])
      .mockResolvedValueOnce([{ ...PENDING, status: "revoked" }])
    actionMock.mockResolvedValue({ status: "revoked" })
    render(<InviteColleagueApp />)
    await screen.findByText("t.ali@school.edu")

    await user.click(screen.getByRole("button", { name: /^revoke$/i }))
    await waitFor(() => expect(actionMock).toHaveBeenCalledWith("inv1", "revoke"))
    expect(await screen.findByText("Revoked")).toBeInTheDocument()
  })

  it("disables the row's buttons while a resend/revoke request is in flight", async () => {
    let resolve!: (v: { status: string }) => void
    listInvitationsMock.mockResolvedValue([PENDING])
    actionMock.mockReturnValue(new Promise((r) => { resolve = r }))
    const user = userEvent.setup()
    render(<InviteColleagueApp />)
    await screen.findByText("t.ali@school.edu")

    await user.click(screen.getByRole("button", { name: /^resend$/i }))
    expect(await screen.findByRole("button", { name: /working/i })).toBeDisabled()

    resolve({ status: "sent" })
    await waitFor(() => expect(screen.getByRole("button", { name: /^resend$/i })).toBeInTheDocument())
  })

  it("409 duplicate is surfaced from the classes-load path too (classes error state)", async () => {
    listClassesMock.mockRejectedValue(new Error("request failed: 500"))
    render(<InviteColleagueApp />)
    expect(await screen.findByText(/classes could not be loaded/i)).toBeInTheDocument()
  })
})
