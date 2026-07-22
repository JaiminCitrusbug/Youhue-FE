import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { StudentShell } from "./StudentShell"

const mocks = vi.hoisted(() => ({ signOut: vi.fn() }))
vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({
    user: { subject_id: "1", kind: "student", role: null, school_id: "s" },
    loading: false,
    refresh: vi.fn(),
    signOut: mocks.signOut,
  }),
}))

describe("StudentShell (student frame)", () => {
  it("has a logout control and NO staff nav", () => {
    render(
      <MemoryRouter>
        <StudentShell />
      </MemoryRouter>,
    )
    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument()
    expect(screen.queryByText(/class dashboard/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/leadership overview/i)).not.toBeInTheDocument()
  })

  it("logging out invokes signOut", async () => {
    render(
      <MemoryRouter>
        <StudentShell />
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole("button", { name: /log out/i }))
    expect(mocks.signOut).toHaveBeenCalled()
  })
})
