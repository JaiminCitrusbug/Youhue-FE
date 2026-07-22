import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setToken } from "../../api/client"
import { staffForgotPassword, staffResetPassword, staffSsoLink } from "./api"
import { CheckEmailScreen } from "./CheckEmailScreen"
import { ForgotPasswordScreen } from "./ForgotPasswordScreen"
import { LinkSSOScreen } from "./LinkSSOScreen"
import { SetNewPasswordScreen } from "./SetNewPasswordScreen"

vi.mock("./api", () => ({
  staffForgotPassword: vi.fn(),
  staffResetPassword: vi.fn(),
  staffSsoLink: vi.fn(),
}))
vi.mock("../../app/AuthContext", () => ({
  useAuth: () => ({ user: null, loading: false, refresh: vi.fn().mockResolvedValue(undefined), signOut: vi.fn() }),
}))

const forgotMock = vi.mocked(staffForgotPassword)
const resetMock = vi.mocked(staffResetPassword)
const linkMock = vi.mocked(staffSsoLink)

beforeEach(() => vi.clearAllMocks())
afterEach(() => setToken(null))

describe("ForgotPasswordScreen", () => {
  function renderIt() {
    render(
      <MemoryRouter initialEntries={["/sign-in/forgot"]}>
        <Routes>
          <Route path="/sign-in/forgot" element={<ForgotPasswordScreen />} />
          <Route path="/sign-in/check-email" element={<div>CHECK EMAIL</div>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it("always routes to the generic check-email result (no disclosure)", async () => {
    const user = userEvent.setup()
    forgotMock.mockResolvedValue({ status: 202, data: { status: "accepted" } })
    renderIt()
    await user.type(screen.getByPlaceholderText(/maple-primary/i), "who@ever.sch")
    await user.click(screen.getByRole("button", { name: /send reset link/i }))
    expect(await screen.findByText("CHECK EMAIL")).toBeInTheDocument()
  })

  it("shows a generic error if the request throws", async () => {
    const user = userEvent.setup()
    forgotMock.mockRejectedValue(new Error("network"))
    renderIt()
    await user.click(screen.getByRole("button", { name: /send reset link/i }))
    expect(await screen.findByRole("alert")).toHaveTextContent(/something went wrong/i)
  })
})

describe("CheckEmailScreen", () => {
  it("uses non-disclosing copy and returns to sign in", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={["/sign-in/check-email"]}>
        <Routes>
          <Route path="/sign-in/check-email" element={<CheckEmailScreen />} />
          <Route path="/sign-in" element={<div>SIGN IN</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText(/if the account exists/i)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /back to sign in/i }))
    expect(await screen.findByText("SIGN IN")).toBeInTheDocument()
  })
})

describe("SetNewPasswordScreen", () => {
  function renderIt(initial = "/sign-in/reset?token=abc") {
    render(
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/sign-in/reset" element={<SetNewPasswordScreen />} />
          <Route path="/sign-in" element={<div>SIGN IN</div>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  async function typeBoth(user: ReturnType<typeof userEvent.setup>, a: string, b: string) {
    const [pw, confirm] = screen.getAllByDisplayValue("") // both password inputs start empty
    await user.type(pw, a)
    await user.type(confirm, b)
    await user.click(screen.getByRole("button", { name: /save & sign in/i }))
  }

  it("rejects mismatched passwords", async () => {
    const user = userEvent.setup()
    renderIt()
    await typeBoth(user, "password1", "password2")
    expect(await screen.findByRole("alert")).toHaveTextContent(/don't match/i)
    expect(resetMock).not.toHaveBeenCalled()
  })

  it("rejects a too-short password", async () => {
    const user = userEvent.setup()
    renderIt()
    await typeBoth(user, "short", "short")
    expect(await screen.findByRole("alert")).toHaveTextContent(/at least 8/i)
  })

  it("rejects a missing token before calling the BE", async () => {
    const user = userEvent.setup()
    renderIt("/sign-in/reset")
    await typeBoth(user, "password1", "password1")
    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid or has expired/i)
    expect(resetMock).not.toHaveBeenCalled()
  })

  it("resets on a 204 and offers the way back to sign in", async () => {
    const user = userEvent.setup()
    resetMock.mockResolvedValue({ status: 204, data: null })
    renderIt()
    await typeBoth(user, "password1", "password1")
    expect(await screen.findByRole("heading", { name: /password updated/i })).toBeInTheDocument()
    expect(resetMock).toHaveBeenCalledWith("abc", "password1")
    await user.click(screen.getByRole("button", { name: /go to sign in/i }))
    expect(await screen.findByText("SIGN IN")).toBeInTheDocument()
  })

  it("treats a non-204 as an invalid/expired token", async () => {
    const user = userEvent.setup()
    resetMock.mockResolvedValue({ status: 400, data: null })
    renderIt()
    await typeBoth(user, "password1", "password1")
    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid or has expired/i)
  })

  it("shows a generic error when the reset request throws", async () => {
    const user = userEvent.setup()
    resetMock.mockRejectedValue(new Error("network"))
    renderIt()
    await typeBoth(user, "password1", "password1")
    expect(await screen.findByRole("alert")).toHaveTextContent(/something went wrong/i)
  })
})

describe("LinkSSOScreen", () => {
  function renderIt(state: unknown) {
    render(
      <MemoryRouter initialEntries={[{ pathname: "/sign-in/link", state }]}>
        <Routes>
          <Route path="/sign-in/link" element={<LinkSSOScreen />} />
          <Route path="/sign-in" element={<div>SIGN IN</div>} />
          <Route path="/app" element={<div>APP HOME</div>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it("bounces to sign in when there is no pending link", async () => {
    const user = userEvent.setup()
    renderIt(null)
    expect(screen.getByRole("heading", { name: /nothing to link/i })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /back to sign in/i }))
    expect(await screen.findByText("SIGN IN")).toBeInTheDocument()
  })

  it("confirms the link and completes the session as ONE identity", async () => {
    const user = userEvent.setup()
    linkMock.mockResolvedValue({ status: 200, data: { access_token: "linked", token_type: "bearer" } })
    renderIt({ kind: "link_required", linkToken: "lt", provider: "google", email: "e@x" })
    expect(screen.getByText(/google identity matches/i)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /link accounts & continue/i }))
    expect(await screen.findByText("APP HOME")).toBeInTheDocument()
    expect(linkMock).toHaveBeenCalledWith("lt")
  })

  it("cancels back to sign in without linking", async () => {
    const user = userEvent.setup()
    renderIt({ kind: "link_required", linkToken: "lt", provider: "microsoft", email: "" })
    await user.click(screen.getByRole("button", { name: /cancel/i }))
    expect(await screen.findByText("SIGN IN")).toBeInTheDocument()
    expect(linkMock).not.toHaveBeenCalled()
  })

  it("shows a generic error if linking fails", async () => {
    const user = userEvent.setup()
    linkMock.mockResolvedValue({ status: 400, data: null })
    renderIt({ kind: "link_required", linkToken: "lt", provider: "google", email: "e@x" })
    await user.click(screen.getByRole("button", { name: /link accounts & continue/i }))
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't link/i)
  })
})
