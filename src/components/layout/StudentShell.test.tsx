import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { StudentShell } from "./StudentShell"

const mocks = vi.hoisted(() => ({ signOut: vi.fn(), navigate: vi.fn() }))
vi.mock("../../app/AuthContext", () => ({
  useAuth: () => ({
    user: { subject_id: "1", kind: "student", role: null, school_id: "s" },
    loading: false,
    refresh: vi.fn(),
    signOut: mocks.signOut,
  }),
}))
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()
  return { ...actual, useNavigate: () => mocks.navigate }
})

describe("StudentShell (student frame)", () => {
  beforeEach(() => {
    mocks.signOut.mockClear()
    mocks.navigate.mockClear()
  })

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

  it("logging out invokes signOut AND returns to the student sign-in screen", async () => {
    render(
      <MemoryRouter>
        <StudentShell />
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole("button", { name: /log out/i }))
    expect(mocks.signOut).toHaveBeenCalled()
    expect(mocks.navigate).toHaveBeenCalledWith("/student/sign-in")
  })
})
