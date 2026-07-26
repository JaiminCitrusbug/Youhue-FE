import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { RequireRole } from "../../components/layout/guards"
import { ROLE_ROUTES } from "../../lib/roles"
import * as api from "./api"
import type { ClassDashboard, MyClass, RosterStudent } from "./api"
import { ClassDashboardApp } from "./index"

// FR-10-01 · SC-027 — behaviour tests for the class dashboard. Every displayed figure comes
// straight from the mocked API response (SRS §13.5 render-not-recompute) — these tests assert the
// screen RENDERS what the server sent, never recomputing trend/index itself.

let currentRole = "teacher"
vi.mock("../../app/AuthContext", () => ({
  useAuth: () => ({
    user: { subject_id: "u1", kind: "staff", role: currentRole, school_id: "sch1" },
    loading: false,
    refresh: vi.fn(),
    signOut: vi.fn(),
  }),
}))

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>()
  return {
    ...actual, getMyClasses: vi.fn(), getClassDashboard: vi.fn(), getClassRoster: vi.fn(),
  }
})

const classesMock = vi.mocked(api.getMyClasses)
const dashboardMock = vi.mocked(api.getClassDashboard)
const rosterMock = vi.mocked(api.getClassRoster)

const CLASS_A: MyClass = { id: "cls1", name: "Year 5 — Maple" }
const DASH: ClassDashboard = {
  class_id: "cls1",
  class_name: "Year 5 — Maple",
  mood_index: 8.0,
  trend: "up",
  as_of: "2026-07-22T09:10:00Z",
  live: true,
  period: "this_week",
  timezone: "Europe/London",
}
const ROSTER: RosterStudent[] = [
  { id: "s1", display_name: "Amy" },
  { id: "s2", display_name: "Ben" },
]

describe("ClassDashboardApp (FR-10-01 · SC-027, FR-10-02 roster delta)", () => {
  beforeEach(() => {
    currentRole = "teacher"
    classesMock.mockReset().mockResolvedValue([CLASS_A])
    dashboardMock.mockReset().mockResolvedValue(DASH)
    rosterMock.mockReset().mockResolvedValue(ROSTER)
  })

  function renderGated() {
    render(
      <MemoryRouter initialEntries={["/app/dashboard"]}>
        <Routes>
          <Route
            path="/app/dashboard"
            element={
              <RequireRole allow={ROLE_ROUTES.dashboard}>
                <ClassDashboardApp />
              </RequireRole>
            }
          />
          <Route path="/app" element={<h1>Role home</h1>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  describe("role gate (ROLE_ROUTES.dashboard)", () => {
    it("mounts the screen for a teacher", async () => {
      renderGated()
      await waitFor(() => expect(dashboardMock).toHaveBeenCalled())
    })
    it("mounts the screen for support (co-teacher)", async () => {
      currentRole = "support"
      renderGated()
      await waitFor(() => expect(dashboardMock).toHaveBeenCalled())
    })
    it("denies 'leadership' — bounced to role home, screen never mounts", async () => {
      currentRole = "leadership"
      renderGated()
      await screen.findByText("Role home")
      expect(classesMock).not.toHaveBeenCalled()
    })
  })

  it("renders the server-owned mood index and trend, never recomputed", async () => {
    renderGated()
    expect(await screen.findByText("8")).toBeInTheDocument()
    expect(screen.getByText("Trending up vs last period")).toBeInTheDocument()
    expect(dashboardMock).toHaveBeenCalledWith("cls1")
  })

  it("states whose data, which period/timezone, and live-or-as-of (ticket Scenario 2)", async () => {
    renderGated()
    await screen.findByText("Year 5 — Maple")
    const sub = await screen.findByText(/this week.*Live.*Europe\/London/i)
    expect(sub).toBeInTheDocument()
  })

  it("renders an 'as of' label (not Live) when the server reports a stale figure", async () => {
    dashboardMock.mockResolvedValue({ ...DASH, live: false })
    renderGated()
    const sub = await screen.findByText(/as of/i)
    expect(sub).toBeInTheDocument()
  })

  it("shows a flat trend with a dash, never fabricating a direction, when no check-ins exist yet", async () => {
    dashboardMock.mockResolvedValue({ ...DASH, mood_index: null, trend: "flat" })
    renderGated()
    expect(await screen.findByText("—")).toBeInTheDocument()
    expect(screen.getByText("Flat vs last period")).toBeInTheDocument()
  })

  it("shows a real empty state when the teacher has no classes at all", async () => {
    classesMock.mockResolvedValue([])
    renderGated()
    expect(await screen.findByText("No classes yet")).toBeInTheDocument()
    expect(dashboardMock).not.toHaveBeenCalled()
  })

  it("surfaces a generic error and never crashes when the load fails", async () => {
    classesMock.mockRejectedValue(new Error("network down"))
    renderGated()
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't load/i)
  })

  describe("roster (FR-10-02 Scenario 1 — click into a single student)", () => {
    it("renders the real class roster, name-ordered as the server returned it", async () => {
      renderGated()
      expect(await screen.findByText("Amy")).toBeInTheDocument()
      expect(screen.getByText("Ben")).toBeInTheDocument()
      expect(rosterMock).toHaveBeenCalledWith("cls1")
    })

    it("drills into a student on 'View', never a dead control", async () => {
      const { default: userEvent } = await import("@testing-library/user-event")
      render(
        <MemoryRouter initialEntries={["/app/dashboard"]}>
          <Routes>
            <Route
              path="/app/dashboard"
              element={
                <RequireRole allow={ROLE_ROUTES.dashboard}>
                  <ClassDashboardApp />
                </RequireRole>
              }
            />
            <Route
              path="/app/dashboard/students/:studentId"
              element={<h1>Student detail page</h1>}
            />
          </Routes>
        </MemoryRouter>,
      )
      const viewButtons = await screen.findAllByRole("button", { name: /view/i })
      await userEvent.click(viewButtons[0])
      expect(await screen.findByText("Student detail page")).toBeInTheDocument()
    })

    it("shows a real empty state when the class has no students yet", async () => {
      rosterMock.mockResolvedValue([])
      renderGated()
      expect(await screen.findByText("No students yet")).toBeInTheDocument()
    })
  })
})
