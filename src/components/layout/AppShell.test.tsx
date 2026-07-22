import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AppShell } from "./AppShell"

const mocks = vi.hoisted(() => ({ signOut: vi.fn(), navigate: vi.fn() }))
vi.mock("../../app/AuthContext", () => ({
  useAuth: () => ({
    user: { subject_id: "1", kind: "staff", role: "teacher", school_id: "s" },
    loading: false,
    refresh: vi.fn(),
    signOut: mocks.signOut,
  }),
}))
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()
  return { ...actual, useNavigate: () => mocks.navigate }
})

describe("AppShell (staff frame)", () => {
  beforeEach(() => {
    mocks.signOut.mockClear()
    mocks.navigate.mockClear()
  })

  it("renders a logout control and the role nav on an authenticated screen", () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>,
    )
    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /class dashboard/i })).toBeInTheDocument()
  })

  it("logging out invokes signOut AND returns to the staff sign-in screen", async () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole("button", { name: /log out/i }))
    expect(mocks.signOut).toHaveBeenCalled()
    expect(mocks.navigate).toHaveBeenCalledWith("/sign-in")
  })
})
