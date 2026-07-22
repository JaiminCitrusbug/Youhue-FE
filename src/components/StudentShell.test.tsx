import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { StudentShell } from "./StudentShell"

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({
    user: { subject_id: "1", kind: "student", role: null, school_id: "s" },
    loading: false,
    refresh: vi.fn(),
    signOut: vi.fn(),
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
})
