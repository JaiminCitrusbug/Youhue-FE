import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { StaffAuthRoutes } from "./StaffAuthRoutes"

vi.mock("../../app/AuthContext", () => ({
  useAuth: () => ({ user: null, loading: false, refresh: vi.fn(), signOut: vi.fn() }),
}))

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/sign-in/*" element={<StaffAuthRoutes />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("StaffAuthRoutes (isolable staff-auth module)", () => {
  it("mounts the sign-in screen at the index", () => {
    renderAt("/sign-in")
    expect(screen.getByRole("heading", { name: /sign in to student wellbeing/i })).toBeInTheDocument()
  })

  it("maps each staff-auth sub-route to its screen", () => {
    for (const [path, heading] of [
      ["/sign-in/forgot", /reset your password/i],
      ["/sign-in/check-email", /check your email/i],
      ["/sign-in/reset", /set a new password/i],
      ["/sign-in/link", /nothing to link/i], // no pending link state on direct nav
    ] as const) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/sign-in/*" element={<StaffAuthRoutes />} />
          </Routes>
        </MemoryRouter>,
      )
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument()
      unmount()
    }
  })

  it("redirects an unknown staff-auth path back to sign-in", () => {
    renderAt("/sign-in/bogus")
    expect(screen.getByRole("heading", { name: /sign in to student wellbeing/i })).toBeInTheDocument()
  })
})
