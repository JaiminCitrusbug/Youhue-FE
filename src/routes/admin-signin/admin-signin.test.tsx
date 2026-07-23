import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AdminSignInApp } from "./index"
import type { AdminSignInResponse } from "./api"

const api = vi.hoisted(() => ({ adminSignIn: vi.fn() }))
vi.mock("./api", () => ({ adminSignIn: api.adminSignIn }))

const auth = vi.hoisted(() => ({ refresh: vi.fn() }))
vi.mock("../../app/AuthContext", () => ({ useAuth: () => ({ refresh: auth.refresh }) }))

const PHASE1: AdminSignInResponse = { admin_session: null, role: null, mfa_required: true }
const PHASE2: AdminSignInResponse = { admin_session: "adm", role: "support", mfa_required: false }

function renderApp(entry: string) {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/admin/sign-in/*" element={<AdminSignInApp />} />
        <Route path="/app" element={<h1>Admin console</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function enterCredentials(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/email/i), "t.ng@studentwellbeing.school")
  await user.type(screen.getByLabelText(/password/i), "correct horse")
  await user.click(screen.getByRole("button", { name: /continue/i }))
}

describe("AdminSignInApp (FR-19-01)", () => {
  beforeEach(() => {
    api.adminSignIn.mockReset()
    auth.refresh.mockReset()
  })
  afterEach(() => vi.restoreAllMocks())

  it("Continue is disabled until both email and password are entered", async () => {
    const user = userEvent.setup()
    renderApp("/admin/sign-in")
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled()
    await user.type(screen.getByLabelText(/email/i), "a@x.io")
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled()
    await user.type(screen.getByLabelText(/password/i), "pw")
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled()
  })

  it("completes the two-phase flow: credentials → MFA challenge → admin console", async () => {
    const user = userEvent.setup()
    api.adminSignIn.mockResolvedValueOnce(PHASE1).mockResolvedValueOnce(PHASE2)
    renderApp("/admin/sign-in")

    await enterCredentials(user)
    // phase 1: email+password only, no code
    await waitFor(() =>
      expect(api.adminSignIn).toHaveBeenCalledWith({
        email: "t.ng@studentwellbeing.school",
        password: "correct horse",
      }),
    )

    // MFA challenge appears
    expect(await screen.findByRole("heading", { name: /mfa challenge/i })).toBeInTheDocument()
    await user.type(screen.getByLabelText(/6-digit code/i), "481902")
    await user.click(screen.getByRole("button", { name: /verify/i }))

    // phase 2: SAME email+password RESUBMITTED with the code
    await waitFor(() =>
      expect(api.adminSignIn).toHaveBeenCalledWith({
        email: "t.ng@studentwellbeing.school",
        password: "correct horse",
        mfa_code: "481902",
      }),
    )
    expect(auth.refresh).toHaveBeenCalled()
    expect(await screen.findByRole("heading", { name: /admin console/i })).toBeInTheDocument()
  })

  it("surfaces a generic phase-1 error and stays on the credentials screen (no MFA step)", async () => {
    const user = userEvent.setup()
    api.adminSignIn.mockRejectedValue(new Error("Sign-in failed. Check your details and try again."))
    renderApp("/admin/sign-in")

    await enterCredentials(user)

    expect(await screen.findByRole("alert")).toHaveTextContent(/sign-in failed/i)
    expect(screen.queryByRole("heading", { name: /mfa challenge/i })).not.toBeInTheDocument()
  })

  it("surfaces a wrong-code error on the MFA step and does not reach the console", async () => {
    const user = userEvent.setup()
    api.adminSignIn.mockResolvedValueOnce(PHASE1).mockRejectedValueOnce(new Error("Sign-in failed. Check your details and try again."))
    renderApp("/admin/sign-in")

    await enterCredentials(user)
    await screen.findByRole("heading", { name: /mfa challenge/i })
    await user.type(screen.getByLabelText(/6-digit code/i), "000000")
    await user.click(screen.getByRole("button", { name: /verify/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/sign-in failed/i)
    expect(screen.queryByRole("heading", { name: /admin console/i })).not.toBeInTheDocument()
  })

  it("Verify is disabled until a full 6-digit code is entered", async () => {
    const user = userEvent.setup()
    api.adminSignIn.mockResolvedValueOnce(PHASE1)
    renderApp("/admin/sign-in")
    await enterCredentials(user)
    await screen.findByRole("heading", { name: /mfa challenge/i })

    expect(screen.getByRole("button", { name: /verify/i })).toBeDisabled()
    await user.type(screen.getByLabelText(/6-digit code/i), "1234")
    expect(screen.getByRole("button", { name: /verify/i })).toBeDisabled()
    await user.type(screen.getByLabelText(/6-digit code/i), "56")
    expect(screen.getByRole("button", { name: /verify/i })).toBeEnabled()
  })

  it("can go back from the MFA challenge to the credentials screen", async () => {
    const user = userEvent.setup()
    api.adminSignIn.mockResolvedValueOnce(PHASE1)
    renderApp("/admin/sign-in")
    await enterCredentials(user)
    await screen.findByRole("heading", { name: /mfa challenge/i })

    await user.click(screen.getByRole("button", { name: /back to sign-in/i }))
    expect(await screen.findByRole("heading", { name: /internal admin/i })).toBeInTheDocument()
  })

  it("renders the MFA challenge directly at /admin/sign-in/verify (deep-link / visual state)", () => {
    renderApp("/admin/sign-in/verify")
    expect(screen.getByRole("heading", { name: /mfa challenge/i })).toBeInTheDocument()
  })

  // ── look source: the screens must come from the APPROVED design library (@design) ───────────
  it("renders the approved AuthCard chrome (wordmark + copy) on the credentials screen", () => {
    renderApp("/admin/sign-in")
    // AuthCard/Logo come from @design — the wrapper contributes no chrome of its own.
    expect(screen.getByText("Student Wellbeing")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /internal admin/i })).toBeInTheDocument()
    expect(screen.getByText(/mfa required/i)).toBeInTheDocument()
    // approved Divider + info Banner, in the approved order
    expect(screen.getByText("then")).toBeInTheDocument()
    expect(screen.getByText(/asked for a 6-digit mfa code/i)).toBeInTheDocument()
  })

  it("renders the approved AuthCard chrome + footer on the MFA challenge", () => {
    renderApp("/admin/sign-in/verify")
    expect(screen.getByText("Student Wellbeing")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /contact platform security/i })).toBeInTheDocument()
  })

  it("keeps the code numeric and capped at 6 digits", async () => {
    const user = userEvent.setup()
    renderApp("/admin/sign-in/verify")
    const code = screen.getByLabelText(/6-digit code/i)
    await user.type(code, "12ab34-5678")
    expect(code).toHaveValue("123456")
  })

  it("disables the actions and shows progress copy while a phase is in flight", async () => {
    const user = userEvent.setup()
    let release: (v: AdminSignInResponse) => void = () => {}
    api.adminSignIn.mockReturnValueOnce(new Promise<AdminSignInResponse>((r) => (release = r)))
    renderApp("/admin/sign-in")

    await enterCredentials(user)
    const button = await screen.findByRole("button", { name: /checking/i })
    expect(button).toBeDisabled()

    release(PHASE1)
    expect(await screen.findByRole("heading", { name: /mfa challenge/i })).toBeInTheDocument()
  })
})
