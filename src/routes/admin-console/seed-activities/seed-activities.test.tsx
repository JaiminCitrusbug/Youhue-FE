import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as api from "./api"
import type { SeedActivity } from "./api"
import { SeedActivities } from "./SeedActivities"

// Mock only the network calls; keep the real constants/labels and seedErrorMessage so the
// status→copy mapping (incl. the RBAC 403) is exercised end-to-end through the screen.
vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>()
  return {
    ...actual,
    listSeedActivities: vi.fn(),
    createSeedActivity: vi.fn(),
    updateSeedActivity: vi.fn(),
    retireSeedActivity: vi.fn(),
    reinstateSeedActivity: vi.fn(),
  }
})

const listMock = vi.mocked(api.listSeedActivities)
const createMock = vi.mocked(api.createSeedActivity)
const updateMock = vi.mocked(api.updateSeedActivity)
const retireMock = vi.mocked(api.retireSeedActivity)
const reinstateMock = vi.mocked(api.reinstateSeedActivity)

const BOX: SeedActivity = {
  id: "a1",
  title: "Box breathing",
  type: "breathing",
  age_band: "all",
  topic: "Healthy habits",
  active: true,
}
const JAR: SeedActivity = {
  id: "a2",
  title: "Worry jar",
  type: "grounding",
  age_band: "b5_7",
  topic: "Home worries",
  active: true,
}
const RETIRED: SeedActivity = {
  id: "a3",
  title: "Old drill",
  type: "stretch",
  age_band: "b8_11",
  topic: null,
  active: false,
}

describe("SeedActivities screen (FR-19-04)", () => {
  beforeEach(() => {
    listMock.mockReset().mockResolvedValue([BOX, JAR])
    createMock.mockReset().mockResolvedValue(BOX)
    updateMock.mockReset().mockResolvedValue(BOX)
    retireMock.mockReset().mockResolvedValue({ ...BOX, active: false })
    reinstateMock.mockReset().mockResolvedValue({ ...RETIRED, active: true })
  })

  it("lists the current seed activities (available to all schools) on mount", async () => {
    render(<SeedActivities />)
    expect(await screen.findByText("Box breathing")).toBeInTheDocument()
    expect(screen.getByText("Worry jar")).toBeInTheDocument()
    expect(listMock).toHaveBeenCalledWith(false)
  })

  it("adds an activity — POSTs a trimmed payload and re-syncs the list", async () => {
    const user = userEvent.setup()
    render(<SeedActivities />)
    await screen.findByText("Box breathing")

    // "Author / edit" is the approved screen's own right-hand control (now a live toggle).
    await user.click(screen.getByRole("button", { name: /author \/ edit/i }))
    await user.type(screen.getByLabelText("Activity"), "Body scan")
    await user.selectOptions(screen.getByLabelText("Type"), "grounding")
    await user.type(screen.getByLabelText("Topic"), "  Calm  ")
    await user.click(screen.getByRole("button", { name: /add activity/i }))

    await waitFor(() =>
      expect(createMock).toHaveBeenCalledWith({
        title: "Body scan",
        type: "grounding",
        age_band: "all",
        topic: "Calm",
      }),
    )
    // reloaded: mount + after create
    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(2))
  })

  it("edits an activity inline — PATCHes the changed fields", async () => {
    const user = userEvent.setup()
    render(<SeedActivities />)
    await screen.findByText("Box breathing")

    await user.click(screen.getByRole("button", { name: /edit box breathing/i }))
    const title = screen.getByLabelText("Edit activity title")
    await user.clear(title)
    await user.type(title, "Box breathing v2")
    await user.click(screen.getByRole("button", { name: /^save$/i }))

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith("a1", expect.objectContaining({ title: "Box breathing v2" })),
    )
  })

  it("retires an activity (soft remove from the set)", async () => {
    const user = userEvent.setup()
    render(<SeedActivities />)
    await screen.findByText("Box breathing")

    await user.click(screen.getByRole("button", { name: /retire box breathing/i }))
    await waitFor(() => expect(retireMock).toHaveBeenCalledWith("a1"))
  })

  it("re-instates a retired activity", async () => {
    const user = userEvent.setup()
    listMock.mockResolvedValue([RETIRED])
    render(<SeedActivities />)
    await screen.findByText("Old drill")

    await user.click(screen.getByRole("button", { name: /reinstate old drill/i }))
    await waitFor(() => expect(reinstateMock).toHaveBeenCalledWith("a3"))
  })

  it("switching the filter to 'Include retired' re-queries with include_retired=true", async () => {
    const user = userEvent.setup()
    render(<SeedActivities />)
    await screen.findByText("Box breathing")

    // Approved SegmentedControl primitive replaces the hand-rolled checkbox; same behaviour.
    await user.click(screen.getByRole("button", { name: /include retired/i }))
    await waitFor(() => expect(listMock).toHaveBeenCalledWith(true))
  })

  it("surfaces a load failure (never silently dropped)", async () => {
    listMock.mockReset().mockRejectedValue(new Error("request failed: 403"))
    render(<SeedActivities />)
    expect(await screen.findByRole("alert")).toHaveTextContent(/permission/i)
  })

  it("surfaces the RBAC 403 when a maintenance action is denied", async () => {
    const user = userEvent.setup()
    retireMock.mockRejectedValue(new Error("request failed: 403"))
    render(<SeedActivities />)
    await screen.findByText("Box breathing")

    await user.click(screen.getByRole("button", { name: /retire box breathing/i }))
    expect(await screen.findByRole("alert")).toHaveTextContent(/permission/i)
  })
})
