import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AppRoutes } from "./index"
import type { Me } from "../app/AuthContext"

const state = vi.hoisted(() => ({ user: null as Me | null, loading: false }))
vi.mock("../app/AuthContext", () => ({
  useAuth: () => ({ user: state.user, loading: state.loading, refresh: vi.fn(), signOut: vi.fn() }),
}))

// The admin console's first screen (DefaultWordListsApp) now GETs the current default on mount
// (FR-19-05 Blocker-1 fix). This router test only asserts the route RESOLVES, so stub the read to a
// deterministic empty default — otherwise the on-mount fetch settles after the assertion and warns.
vi.mock("./admin-word-lists/api", () => ({
  getDefaultConcernWords: vi.fn(async () => ({ words: [], count: 0, is_default: true })),
  saveDefaultConcernWords: vi.fn(),
}))

// The district approvals queue (SchoolApprovalsApp) GETs the pending queue on mount (FR-02-02).
// Same reasoning as above: stub a deterministic empty queue so the router test's on-mount fetch
// settles before assertions run.
vi.mock("./district-approvals/api", () => ({
  getPendingSchools: vi.fn(async () => ({ schools: [] })),
  getSchoolDetail: vi.fn(),
  decideSchool: vi.fn(),
}))

// FR-19-02 — the school-admin screens GET on mount too; stub deterministically for the same reason.
vi.mock("./admin-console/schools/api", () => ({
  listSchools: vi.fn(async () => ({ schools: [], count: 0 })),
  getSchool: vi.fn(async () => ({
    id: "s1", name: "Oakfield Primary", tier: "free", status: "active", timezone: "UTC",
    subscription_state: null, trial_end_at: null, trial_extension_count: 0,
  })),
  extendTrial: vi.fn(),
  updateAccount: vi.fn(),
  openSupportAccess: vi.fn(),
  adminSchoolErrorMessage: (err: unknown) => (err instanceof Error ? err.message : "error"),
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
    expect(
      screen.getByRole("heading", { name: /sign in to student wellbeing/i }),
    ).toBeInTheDocument()
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
    expect(
      screen.getByRole("heading", { name: /sign in to student wellbeing/i }),
    ).toBeInTheDocument()
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
    expect(screen.queryByRole("heading", { name: /school approvals/i })).not.toBeInTheDocument()
  })

  it("permits the matching staff role its own route", async () => {
    state.user = { subject_id: "1", kind: "staff", role: "district", school_id: "s" }
    renderAt("/app/district")
    expect(screen.getByRole("heading", { name: /school approvals/i })).toBeInTheDocument()
    // let the on-mount pending-queue read settle (stubbed empty), wrapped in act
    expect(await screen.findByText(/no schools waiting/i)).toBeInTheDocument()
  })

  it("resolves the admin console for an admin-kind session (FR-19-05 · SC-079 default word lists)", async () => {
    state.user = { subject_id: "1", kind: "admin", role: null, school_id: null }
    renderAt("/app/admin")
    // The admin console's first built screen is the default concern-word lists editor.
    expect(
      screen.getByRole("heading", { name: /default concern-word lists/i }),
    ).toBeInTheDocument()
    // let the on-mount default-list read settle (empty), so its state update is wrapped in act
    expect(await screen.findByText(/no default words yet/i)).toBeInTheDocument()
  })

  // FR-19-02 — the admin console gains three sibling screens: school accounts, trial extension,
  // and support access, all behind the same admin guard.
  it("resolves the school-accounts console route for an admin-kind session (FR-19-02 · SC-075)", async () => {
    state.user = { subject_id: "1", kind: "admin", role: null, school_id: null }
    renderAt("/app/admin/schools")
    expect(screen.getByRole("heading", { name: /school accounts/i })).toBeInTheDocument()
    expect(await screen.findByText(/no schools match your search/i)).toBeInTheDocument()
  })

  it("resolves the per-school trial route for an admin-kind session (FR-19-02 · SC-076)", async () => {
    state.user = { subject_id: "1", kind: "admin", role: null, school_id: null }
    renderAt("/app/admin/schools/s1/trial")
    expect(await screen.findByText(/oakfield primary — trial/i)).toBeInTheDocument()
  })

  it("resolves the per-school support route for an admin-kind session (FR-19-02 · SC-077)", async () => {
    state.user = { subject_id: "1", kind: "admin", role: null, school_id: null }
    renderAt("/app/admin/schools/s1/support")
    expect(await screen.findByText(/open oakfield primary for support/i)).toBeInTheDocument()
  })

  it("denies a wrong-role staff the school-accounts console route", () => {
    state.user = { subject_id: "1", kind: "staff", role: "teacher", school_id: "s" }
    renderAt("/app/admin/schools")
    expect(screen.queryByRole("heading", { name: /school accounts/i })).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /class dashboard/i })).toBeInTheDocument()
  })

  it("shows a loading state while the session is still resolving", () => {
    state.loading = true
    renderAt("/app/dashboard")
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  // FR-02-01 — the pre-login school-registration module is mounted on a real route.
  it("mounts the school self-registration screen at /register-school", () => {
    renderAt("/register-school")
    expect(screen.getByRole("heading", { name: /register your school/i })).toBeInTheDocument()
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
