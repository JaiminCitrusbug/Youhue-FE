import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AppRoutes } from "./routes"
import type { Me } from "./auth/AuthContext"

const state = vi.hoisted(() => ({ user: null as Me | null, loading: false }))
vi.mock("./auth/AuthContext", () => ({
  useAuth: () => ({ user: state.user, loading: state.loading, refresh: vi.fn(), signOut: vi.fn() }),
}))

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

describe("AppRoutes (role-aware router)", () => {
  beforeEach(() => {
    state.user = null
    state.loading = false
  })

  it("redirects an unauthenticated staff route to sign-in", () => {
    renderAt("/app/dashboard")
    expect(screen.getByText(/staff sign-in/i)).toBeInTheDocument()
  })

  it("lands a signed-in teacher on their role home inside the shell", () => {
    state.user = { subject_id: "1", kind: "staff", role: "teacher", school_id: "s" }
    renderAt("/app")
    expect(screen.getByRole("link", { name: /class dashboard/i })).toBeInTheDocument() // shell nav
    expect(screen.getByRole("heading", { name: /class dashboard/i })).toBeInTheDocument() // landing
  })

  it("a student session cannot resolve a staff route", () => {
    state.user = { subject_id: "1", kind: "student", role: null, school_id: "s" }
    renderAt("/app/dashboard")
    expect(screen.getByText(/staff sign-in/i)).toBeInTheDocument()
  })

  it("a staff session cannot resolve the student route", () => {
    state.user = { subject_id: "1", kind: "staff", role: "teacher", school_id: "s" }
    renderAt("/student")
    expect(screen.getByText(/student sign-in/i)).toBeInTheDocument()
  })

  it("shows a maintenance page and 404 for unknown routes", () => {
    renderAt("/maintenance")
    expect(screen.getByText(/down for maintenance/i)).toBeInTheDocument()
  })

  it("renders 404 for an unknown path", () => {
    renderAt("/nope")
    expect(screen.getByText(/page not found/i)).toBeInTheDocument()
  })
})
