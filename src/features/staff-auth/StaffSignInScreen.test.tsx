import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setToken } from "../../api/client"
import { staffMfaVerify, staffSignIn } from "./api"
import { startSso } from "./sso"
import { StaffSignInScreen } from "./StaffSignInScreen"

vi.mock("./api", () => ({ staffSignIn: vi.fn(), staffMfaVerify: vi.fn() }))
vi.mock("./sso", () => ({ startSso: vi.fn() }))
vi.mock("../../app/AuthContext", () => ({
  useAuth: () => ({ user: null, loading: false, refresh: vi.fn().mockResolvedValue(undefined), signOut: vi.fn() }),
}))

const signInMock = vi.mocked(staffSignIn)
const mfaMock = vi.mocked(staffMfaVerify)
const ssoMock = vi.mocked(startSso)

function renderScreen(initial = "/sign-in") {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/sign-in" element={<StaffSignInScreen />} />
        <Route path="/sign-in/forgot" element={<div>FORGOT PAGE</div>} />
        <Route path="/sign-in/link" element={<div>LINK PAGE</div>} />
        <Route path="/app" element={<div>APP HOME</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText(/maple-primary/i), "r.okafor@maple.sch")
  await user.type(screen.getByPlaceholderText("••••••••"), "passw0rdxx")
  await user.click(screen.getByRole("button", { name: /^sign in$/i }))
}

describe("StaffSignInScreen", () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => setToken(null))

  it("signs in with email/password and lands on the role home", async () => {
    const user = userEvent.setup()
    signInMock.mockResolvedValue({ status: 200, data: { access_token: "t", token_type: "bearer", mfa_required: false } })
    renderScreen()
    await fillAndSubmit(user)
    expect(await screen.findByText("APP HOME")).toBeInTheDocument()
  })

  it("shows a GENERIC error on 401 (no account-existence disclosure)", async () => {
    const user = userEvent.setup()
    signInMock.mockResolvedValue({ status: 401, data: null })
    renderScreen()
    await fillAndSubmit(user)
    const msg = await screen.findByRole("alert")
    expect(msg).toHaveTextContent(/not correct/i)
    // must not hint at whether the email exists
    expect(msg.textContent).not.toMatch(/exist|registered|found|unknown/i)
  })

  it("maps 423 to a lockout message and 429 to a rate-limit message", async () => {
    const user = userEvent.setup()
    signInMock.mockResolvedValue({ status: 423, data: null })
    const { unmount } = renderScreen()
    await fillAndSubmit(user)
    expect(await screen.findByRole("alert")).toHaveTextContent(/locked/i)
    unmount()

    signInMock.mockResolvedValue({ status: 429, data: null })
    renderScreen()
    await fillAndSubmit(user)
    expect(await screen.findByRole("alert")).toHaveTextContent(/too many attempts/i)
  })

  it("shows a generic error when the request throws", async () => {
    const user = userEvent.setup()
    signInMock.mockRejectedValue(new Error("network"))
    renderScreen()
    await fillAndSubmit(user)
    expect(await screen.findByRole("alert")).toHaveTextContent(/something went wrong/i)
  })

  it("runs the MFA step when the BE requires it, then completes", async () => {
    const user = userEvent.setup()
    signInMock.mockResolvedValue({ status: 200, data: { access_token: "sess", token_type: "bearer", mfa_required: true } })
    mfaMock.mockResolvedValue({ status: 200, data: { access_token: "final", token_type: "bearer" } })
    renderScreen()
    await fillAndSubmit(user)
    expect(await screen.findByRole("heading", { name: /verification code/i })).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText("123456"), "123456")
    await user.click(screen.getByRole("button", { name: /verify & sign in/i }))
    expect(await screen.findByText("APP HOME")).toBeInTheDocument()
    expect(mfaMock).toHaveBeenCalledWith("sess", "123456")
  })

  it("rejects a wrong MFA code and can go back to sign in", async () => {
    const user = userEvent.setup()
    signInMock.mockResolvedValue({ status: 200, data: { access_token: "sess", token_type: "bearer", mfa_required: true } })
    mfaMock.mockResolvedValue({ status: 401, data: null })
    renderScreen()
    await fillAndSubmit(user)
    await user.type(await screen.findByPlaceholderText("123456"), "000000")
    await user.click(screen.getByRole("button", { name: /verify & sign in/i }))
    expect(await screen.findByRole("alert")).toHaveTextContent(/not correct or has expired/i)
    await user.click(screen.getByRole("button", { name: /back to sign in/i }))
    expect(screen.getByRole("heading", { name: /sign in to student wellbeing/i })).toBeInTheDocument()
  })

  it("signs in through SSO (popup delivers the token)", async () => {
    const user = userEvent.setup()
    ssoMock.mockResolvedValue({ kind: "ok", accessToken: "sso-tok" })
    renderScreen()
    await user.click(screen.getByRole("button", { name: /continue with google/i }))
    expect(await screen.findByText("APP HOME")).toBeInTheDocument()
    expect(ssoMock).toHaveBeenCalledWith("google", expect.any(String))
  })

  it("routes a first-time SSO to the account-link confirmation", async () => {
    const user = userEvent.setup()
    ssoMock.mockResolvedValue({ kind: "link_required", linkToken: "lt", provider: "microsoft", email: "e@x" })
    renderScreen()
    await user.click(screen.getByRole("button", { name: /continue with microsoft/i }))
    expect(await screen.findByText("LINK PAGE")).toBeInTheDocument()
  })

  it("shows a generic error when SSO fails", async () => {
    const user = userEvent.setup()
    ssoMock.mockRejectedValue(new Error("popup_closed"))
    renderScreen()
    await user.click(screen.getByRole("button", { name: /continue with google/i }))
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't complete single sign-on/i)
  })

  it("links to the forgot-password flow", async () => {
    const user = userEvent.setup()
    renderScreen()
    await user.click(screen.getByRole("link", { name: /forgot password/i }))
    expect(await screen.findByText("FORGOT PAGE")).toBeInTheDocument()
  })
})
