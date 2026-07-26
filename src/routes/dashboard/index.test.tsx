import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { RequireRole } from "../../components/layout/guards"
import { ROLE_ROUTES } from "../../lib/roles"
import * as api from "./api"
import type { ClassDashboard, MyClass } from "./api"
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
  return { ...actual, getMyClasses: vi.fn(), getClassDashboard: vi.fn() }
})

const classesMock = vi.mocked(api.getMyClasses)
const dashboardMock = vi.mocked(api.getClassDashboard)

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

describe("ClassDashboardApp (FR-10-01 · SC-027)", () => {
  beforeEach(() => {
    currentRole = "teacher"
    classesMock.mockReset().mockResolvedValue([CLASS_A])
    dashboardMock.mockReset().mockResolvedValue(DASH)
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
})
