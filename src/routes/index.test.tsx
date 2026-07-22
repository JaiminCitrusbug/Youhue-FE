import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AppRoutes } from "./index"
import type { Me } from "../app/AuthContext"

const state = vi.hoisted(() => ({ user: null as Me | null, loading: false }))
vi.mock("../app/AuthContext", () => ({
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
    // guard denial emits a structured event; keep test output quiet
    vi.spyOn(console, "info").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
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
    // bounced to the student sign-in surface (SC-020), never a staff screen
    expect(screen.getByRole("heading", { name: /enter your class code/i })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: /class dashboard/i })).not.toBeInTheDocument()
  })

  // (NEG) INFRA-04.md §29 — a signed-in staff whose role does not permit a route is denied
  // the mount (guard denies). Previously uncovered + unenforced (review B1).
  it("denies a wrong-role staff the admin console route (guard denies, not mounted)", () => {
    state.user = { subject_id: "1", kind: "staff", role: "teacher", school_id: "s" }
    renderAt("/app/admin")
    expect(screen.queryByRole("heading", { name: /admin console/i })).not.toBeInTheDocument()
    // bounced back to their own role home, never the admin screen
    expect(screen.getByRole("heading", { name: /class dashboard/i })).toBeInTheDocument()
  })

  it("denies a wrong-role staff the district admin route", () => {
    state.user = { subject_id: "1", kind: "staff", role: "teacher", school_id: "s" }
    renderAt("/app/district")
    expect(screen.queryByRole("heading", { name: /district admin/i })).not.toBeInTheDocument()
  })

  it("permits the matching staff role its own route", () => {
    state.user = { subject_id: "1", kind: "staff", role: "district", school_id: "s" }
    renderAt("/app/district")
    expect(screen.getByRole("heading", { name: /district admin/i })).toBeInTheDocument()
  })

  it("resolves the admin console for an admin-kind session", () => {
    state.user = { subject_id: "1", kind: "admin", role: null, school_id: null }
    renderAt("/app/admin")
    expect(screen.getByRole("heading", { name: /admin console/i })).toBeInTheDocument()
  })

  it("shows a loading state while the session is still resolving", () => {
    state.loading = true
    renderAt("/app/dashboard")
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
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
