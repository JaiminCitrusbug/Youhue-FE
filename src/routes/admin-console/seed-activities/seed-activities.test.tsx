import { render, screen, waitFor, within } from "@testing-library/react"
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

/** The table row that carries `title` — lets a test scope an assertion to one activity. */
function rowFor(title: string): HTMLElement {
  const row = screen.getByText(title).closest("tr")
  if (!row) throw new Error(`no table row found for "${title}"`)
  return row
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
    expect(screen.getByText("New seed activity")).toBeInTheDocument()
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

  // The approved copy on the right-hand control is "Author / edit", so the panel it opens must do
  // both: a row's Edit action opens THE SAME panel pre-filled, in edit mode, and it PATCHes.
  it("edits an activity in the 'Author / edit' panel — pre-filled, PATCHes the changed fields", async () => {
    const user = userEvent.setup()
    render(<SeedActivities />)
    await screen.findByText("Box breathing")

    await user.click(screen.getByRole("button", { name: /edit box breathing/i }))
    expect(screen.getByText("Edit seed activity")).toBeInTheDocument()

    const title = screen.getByLabelText("Activity")
    expect(title).toHaveValue("Box breathing") // pre-filled with the row, not a blank create form
    expect(screen.getByLabelText("Topic")).toHaveValue("Healthy habits")

    await user.clear(title)
    await user.type(title, "Box breathing v2")
    await user.click(screen.getByRole("button", { name: /save changes/i }))

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith("a1", expect.objectContaining({ title: "Box breathing v2" })),
    )
    expect(createMock).not.toHaveBeenCalled()
    // the panel closes and falls back to author mode
    await waitFor(() => expect(screen.queryByText("Edit seed activity")).toBeNull())
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

  // M3 — the retired row is the delta with no approved visual; pin what it actually shows.
  it("marks a retired activity as Retired and offers re-instate in place of retire", async () => {
    listMock.mockResolvedValue([BOX, RETIRED])
    render(<SeedActivities />)
    await screen.findByText("Old drill")

    const retired = within(rowFor("Old drill"))
    expect(retired.getByText("Retired")).toBeInTheDocument()
    expect(retired.getByRole("button", { name: /reinstate old drill/i })).toBeInTheDocument()
    expect(retired.queryByRole("button", { name: /^retire/i })).toBeNull()

    const active = within(rowFor("Box breathing"))
    expect(active.queryByText("Retired")).toBeNull()
    expect(active.getByRole("button", { name: /retire box breathing/i })).toBeInTheDocument()
  })

  // M5 — the Type column is a delta column; pin that it renders the label, not the wire enum.
  it("shows the Type column using the display label, never the wire enum", async () => {
    render(<SeedActivities />)
    await screen.findByText("Box breathing")

    expect(screen.getByRole("columnheader", { name: "Type" })).toBeInTheDocument()
    const box = within(rowFor("Box breathing"))
    expect(box.getByText("Breathing")).toBeInTheDocument()
    expect(box.queryByText("breathing")).toBeNull()
    expect(within(rowFor("Worry jar")).getByText("Grounding")).toBeInTheDocument()
  })

  // M4 — a global mutation must not be double-submitted while it is in flight.
  it("disables the row actions while a mutation is in flight, and re-enables them after", async () => {
    const user = userEvent.setup()
    let settle: (a: SeedActivity) => void = () => {}
    retireMock.mockImplementation(
      () =>
        new Promise<SeedActivity>((resolve) => {
          settle = resolve
        }),
    )
    render(<SeedActivities />)
    await screen.findByText("Box breathing")

    expect(screen.getByRole("button", { name: /retire worry jar/i })).toBeEnabled()

    await user.click(screen.getByRole("button", { name: /retire box breathing/i }))

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /retire worry jar/i })).toBeDisabled(),
    )
    expect(screen.getByRole("button", { name: /edit box breathing/i })).toBeDisabled()

    settle({ ...BOX, active: false })
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /retire worry jar/i })).toBeEnabled(),
    )
  })

  it("keeps the author panel submit disabled until a non-blank title is entered", async () => {
    const user = userEvent.setup()
    render(<SeedActivities />)
    await screen.findByText("Box breathing")

    await user.click(screen.getByRole("button", { name: /author \/ edit/i }))
    expect(screen.getByRole("button", { name: /add activity/i })).toBeDisabled()

    await user.type(screen.getByLabelText("Activity"), "   ")
    expect(screen.getByRole("button", { name: /add activity/i })).toBeDisabled()

    await user.type(screen.getByLabelText("Activity"), "Body scan")
    expect(screen.getByRole("button", { name: /add activity/i })).toBeEnabled()
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

  // RM-1 — a failed *mutation* sets `error` but the loaded list is still in state; the table must
  // STAY visible under the banner. The bug was `listBody()` checking error before rows, which threw
  // away an on-screen list and falsely claimed "could not be loaded". Rows-before-error fixes it.
  it("keeps the loaded list on screen when a mutation fails (never 'could not be loaded')", async () => {
    const user = userEvent.setup()
    retireMock.mockRejectedValue(new Error("request failed: 500"))
    render(<SeedActivities />)
    await screen.findByText("Box breathing")

    await user.click(screen.getByRole("button", { name: /retire box breathing/i }))
    expect(await screen.findByRole("alert")).toBeInTheDocument()

    // the list the admin was looking at is still there, under the error banner
    expect(screen.getByText("Box breathing")).toBeInTheDocument()
    expect(screen.getByText("Worry jar")).toBeInTheDocument()
    expect(screen.queryByText("Seed activities could not be loaded")).toBeNull()
  })

  // Major 1 — the list body must never assert something the data does not support.
  it("never shows an empty state under the error banner", async () => {
    listMock.mockReset().mockRejectedValue(new Error("request failed: 403"))
    render(<SeedActivities />)
    await screen.findByRole("alert")

    expect(screen.getByText("Seed activities could not be loaded")).toBeInTheDocument()
    expect(screen.queryByText("No seed activities yet")).toBeNull()
    expect(screen.queryByText("No active seed activities")).toBeNull()
    expect(screen.queryByText(/add the first one/i)).toBeNull()
  })

  it("does not claim the seed set is empty after the last active activity is retired", async () => {
    const user = userEvent.setup()
    listMock.mockReset().mockResolvedValueOnce([BOX]).mockResolvedValue([])
    render(<SeedActivities />)
    await screen.findByText("Box breathing")

    await user.click(screen.getByRole("button", { name: /retire box breathing/i }))

    // retire is a SOFT deactivate — the activity still exists, it is merely filtered out
    expect(await screen.findByText("No active seed activities")).toBeInTheDocument()
    expect(screen.queryByText("No seed activities yet")).toBeNull()
    expect(screen.queryByText(/add the first one/i)).toBeNull()

    // and the empty state offers the way back to the unfiltered view
    await user.click(screen.getByRole("button", { name: /show retired activities/i }))
    await waitFor(() => expect(listMock).toHaveBeenCalledWith(true))
  })

  it("reports a genuinely empty seed set only in the unfiltered view", async () => {
    const user = userEvent.setup()
    listMock.mockReset().mockResolvedValue([])
    render(<SeedActivities />)

    expect(await screen.findByText("No active seed activities")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /include retired/i }))
    expect(await screen.findByText("No seed activities yet")).toBeInTheDocument()
    expect(screen.queryByText("No active seed activities")).toBeNull()
  })
})
