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
  data_state: "has_data",
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
    expect(dashboardMock).toHaveBeenCalledWith("cls1", undefined)
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

  it("shows the distinct 'no data yet' empty state, never a fabricated trend, when no check-ins exist yet (superseded by FR-10-05's data_state)", async () => {
    dashboardMock.mockResolvedValue({ ...DASH, mood_index: null, trend: "flat", data_state: "no_data_yet" })
    renderGated()
    expect(await screen.findByText("No check-ins yet")).toBeInTheDocument()
    expect(screen.queryByText("Flat vs last period")).not.toBeInTheDocument()
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

  describe("range filter (FR-10-03)", () => {
    it("Scenario 1 — selecting 'month' re-fetches with the real range param", async () => {
      const { default: userEvent } = await import("@testing-library/user-event")
      renderGated()
      await screen.findByText("Year 5 — Maple")
      dashboardMock.mockResolvedValue({ ...DASH, period: "this_month", mood_index: 6.4 })

      const select = screen.getByLabelText("Time range")
      await userEvent.selectOptions(select, "month")

      await waitFor(() => expect(dashboardMock).toHaveBeenCalledWith("cls1", "month"))
      expect(await screen.findByText("6.4")).toBeInTheDocument()
    })

    it("selecting 'term' re-fetches with range=term", async () => {
      const { default: userEvent } = await import("@testing-library/user-event")
      renderGated()
      await screen.findByText("Year 5 — Maple")

      const select = screen.getByLabelText("Time range")
      await userEvent.selectOptions(select, "term")

      await waitFor(() => expect(dashboardMock).toHaveBeenCalledWith("cls1", "term"))
    })

    it("Scenario 2 — picking a specific date re-fetches with range=around:{date}", async () => {
      const { default: userEvent } = await import("@testing-library/user-event")
      renderGated()
      await screen.findByText("Year 5 — Maple")
      dashboardMock.mockResolvedValue({ ...DASH, period: "around" })

      const dateInput = screen.getByLabelText("Or around a specific date")
      await userEvent.type(dateInput, "2026-06-10")

      await waitFor(() => expect(dashboardMock).toHaveBeenCalledWith("cls1", "around:2026-06-10"))
    })

    it("re-selecting a named range clears a previously-picked date", async () => {
      const { default: userEvent } = await import("@testing-library/user-event")
      renderGated()
      await screen.findByText("Year 5 — Maple")

      const dateInput = screen.getByLabelText("Or around a specific date") as HTMLInputElement
      await userEvent.type(dateInput, "2026-06-10")
      await waitFor(() => expect(dateInput.value).toBe("2026-06-10"))

      const select = screen.getByLabelText("Time range")
      await userEvent.selectOptions(select, "month")
      await waitFor(() => expect(dateInput.value).toBe(""))
    })

    it("invalid range (e.g. server 422) surfaces the real server message, never a silent no-op", async () => {
      const { default: userEvent } = await import("@testing-library/user-event")
      renderGated()
      await screen.findByText("Year 5 — Maple")
      dashboardMock.mockRejectedValue(
        new (await import("./api")).DashboardApiError(422, "range must be one of this_week|month|term"),
      )

      const select = screen.getByLabelText("Time range")
      await userEvent.selectOptions(select, "term")

      expect(await screen.findByRole("alert")).toHaveTextContent(/range must be one of/i)
    })
  })

  describe("FR-10-05 — empty/loading/error states, each section on its own", () => {
    it("Scenario 1 — shows a distinct 'no data yet' state when the class has no check-ins for the period", async () => {
      dashboardMock.mockResolvedValue({ ...DASH, mood_index: null, trend: "flat", data_state: "no_data_yet" })
      renderGated()
      expect(await screen.findByText("No check-ins yet")).toBeInTheDocument()
    })

    it("Scenario 2 — shows a distinct 'no results' state when a filter matches nothing though data exists", async () => {
      dashboardMock.mockResolvedValue({ ...DASH, mood_index: null, trend: "flat", data_state: "no_results" })
      renderGated()
      expect(await screen.findByText("No results for this filter")).toBeInTheDocument()
    })

    it("shows a real loading state for the mood-index section before the dashboard fetch resolves", async () => {
      let resolveDash: (d: ClassDashboard) => void = () => {}
      dashboardMock.mockReturnValue(new Promise<ClassDashboard>((resolve) => { resolveDash = resolve }))
      renderGated()

      expect(await screen.findByText("Loading your dashboard figures…")).toBeInTheDocument()

      resolveDash(DASH)
      expect(await screen.findByText("8")).toBeInTheDocument()
      expect(screen.queryByText("Loading your dashboard figures…")).not.toBeInTheDocument()
    })

    it("shows a real loading state for the students section before the roster fetch resolves", async () => {
      let resolveRoster: (r: RosterStudent[]) => void = () => {}
      rosterMock.mockReturnValue(new Promise<RosterStudent[]>((resolve) => { resolveRoster = resolve }))
      renderGated()

      expect(await screen.findByText("Loading students…")).toBeInTheDocument()

      resolveRoster(ROSTER)
      expect(await screen.findByText("Amy")).toBeInTheDocument()
      expect(screen.queryByText("Loading students…")).not.toBeInTheDocument()
    })

    it("a failed dashboard fetch shows a scoped error banner without wiping the (independently loaded) roster", async () => {
      dashboardMock.mockRejectedValue(
        new (await import("./api")).DashboardApiError(500, "Could not load the dashboard"),
      )
      renderGated()

      expect(await screen.findByRole("alert")).toHaveTextContent("Could not load the dashboard")
      // the roster section fetched independently and is unaffected — never a crash, never blanked.
      expect(await screen.findByText("Amy")).toBeInTheDocument()
      expect(screen.getByText("Ben")).toBeInTheDocument()
    })

    it("a failed roster fetch shows a scoped error banner without wiping the (independently loaded) mood index", async () => {
      rosterMock.mockRejectedValue(
        new (await import("./api")).DashboardApiError(500, "Could not load the dashboard"),
      )
      renderGated()

      expect(await screen.findByText("8")).toBeInTheDocument()  // mood index still rendered
      expect(await screen.findByRole("alert")).toHaveTextContent("Could not load the dashboard")
    })

    it("a network-level failure (no DashboardApiError) falls back to generic copy, never a raw/blank crash", async () => {
      dashboardMock.mockRejectedValue(new Error("network down"))
      renderGated()

      expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't load the dashboard/i)
    })
  })
})
