import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ActivitiesApiError } from "./api"
import { ActivityRunAssignApp } from "./index"

// Behaviour tests for FR-14-02's real run/assign screen (SC-046), composed from the approved
// Card/Button structure, real GET /classes/mine + GET /classes/{id}/roster + GET /activities/seed
// reads, real POST /activities/{id}/run.

const api = vi.hoisted(() => ({
  getMyClasses: vi.fn(),
  getClassRoster: vi.fn(),
  getSeedActivities: vi.fn(),
  runOrAssignActivity: vi.fn(),
}))
vi.mock("../dashboard/api", () => ({
  getMyClasses: api.getMyClasses,
  getClassRoster: api.getClassRoster,
}))
vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>()
  return {
    ...actual,
    getSeedActivities: api.getSeedActivities,
    runOrAssignActivity: api.runOrAssignActivity,
  }
})

const ACTIVITY = { id: "a1", title: "Friendship circle", type: "grounding", topic: "Friendships" }
const ROSTER = [
  { id: "s1", display_name: "Amy" },
  { id: "s2", display_name: "Ben" },
]

describe("ActivityRunAssignApp (FR-14-02 · SC-046)", () => {
  beforeEach(() => {
    api.getMyClasses.mockReset()
    api.getClassRoster.mockReset()
    api.getSeedActivities.mockReset()
    api.runOrAssignActivity.mockReset()
    api.getMyClasses.mockResolvedValue([{ id: "c1", name: "3A" }])
    api.getClassRoster.mockResolvedValue(ROSTER)
    api.getSeedActivities.mockResolvedValue([ACTIVITY])
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("shows the seed activity with real title/hint (no fabricated duration)", async () => {
    render(<ActivityRunAssignApp />)
    expect(await screen.findByText("Friendship circle")).toBeInTheDocument()
    expect(screen.getByText("Friendships")).toBeInTheDocument()
    expect(screen.queryByText(/~15 min/i)).not.toBeInTheDocument() // no invented data
  })

  it("Run with class posts target=class:{id} and shows a real assigned count", async () => {
    const user = userEvent.setup()
    api.runOrAssignActivity.mockResolvedValue(["s1", "s2"])
    render(<ActivityRunAssignApp />)

    await user.click(await screen.findByRole("button", { name: /run with class/i }))

    await waitFor(() =>
      expect(api.runOrAssignActivity).toHaveBeenCalledWith("a1", "class:c1"),
    )
    expect(await screen.findByText(/2 student\(s\)/)).toBeInTheDocument()
  })

  it("Assign to a student reveals a real roster picker, then posts target=student:{id}", async () => {
    const user = userEvent.setup()
    api.runOrAssignActivity.mockResolvedValue(["s1"])
    render(<ActivityRunAssignApp />)

    await user.click(await screen.findByRole("button", { name: /assign to a student/i }))
    const select = await screen.findByRole("combobox", { name: /student/i })
    expect(screen.getByRole("option", { name: "Amy" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Ben" })).toBeInTheDocument()

    await user.selectOptions(select, "s1")
    await user.click(screen.getByRole("button", { name: /confirm assignment/i }))

    await waitFor(() =>
      expect(api.runOrAssignActivity).toHaveBeenCalledWith("a1", "student:s1"),
    )
    expect(await screen.findByText(/assigned to amy/i)).toBeInTheDocument()
  })

  it("Confirm assignment stays disabled until a student is chosen", async () => {
    const user = userEvent.setup()
    render(<ActivityRunAssignApp />)

    await user.click(await screen.findByRole("button", { name: /assign to a student/i }))
    expect(screen.getByRole("button", { name: /confirm assignment/i })).toBeDisabled()
  })

  it("a 403 out-of-scope failure surfaces the real message", async () => {
    const user = userEvent.setup()
    api.runOrAssignActivity.mockRejectedValue(new ActivitiesApiError(403, "Access denied"))
    render(<ActivityRunAssignApp />)

    await user.click(await screen.findByRole("button", { name: /run with class/i }))
    expect(await screen.findByRole("alert")).toHaveTextContent(/access denied/i)
  })

  it("no owned classes shows a real empty state, not a fixture", async () => {
    api.getMyClasses.mockResolvedValue([])
    render(<ActivityRunAssignApp />)
    expect(await screen.findByText(/no classes yet/i)).toBeInTheDocument()
  })

  it("no seed activities shows a real empty state, not an error", async () => {
    api.getSeedActivities.mockResolvedValue([])
    render(<ActivityRunAssignApp />)
    expect(await screen.findByText(/no activities yet/i)).toBeInTheDocument()
  })

  it("a load failure surfaces the real message, not a generic one", async () => {
    api.getMyClasses.mockRejectedValue(new ActivitiesApiError(500, "boom"))
    render(<ActivityRunAssignApp />)
    expect(await screen.findByRole("alert")).toHaveTextContent(/boom/i)
  })
})
