import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { AppShell } from "./AppShell"

const mocks = vi.hoisted(() => ({ signOut: vi.fn() }))
vi.mock("../../app/AuthContext", () => ({
  useAuth: () => ({
    user: { subject_id: "1", kind: "staff", role: "teacher", school_id: "s" },
    loading: false,
    refresh: vi.fn(),
    signOut: mocks.signOut,
  }),
}))

describe("AppShell (staff frame)", () => {
  it("renders a logout control and the role nav on an authenticated screen", () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>,
    )
    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /class dashboard/i })).toBeInTheDocument()
  })

  it("logging out invokes signOut", async () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole("button", { name: /log out/i }))
    expect(mocks.signOut).toHaveBeenCalled()
  })
})
