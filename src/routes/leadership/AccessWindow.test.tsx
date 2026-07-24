import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as api from "./api"
import type { SchoolSettings } from "./api"
import { AccessWindow } from "./AccessWindow"

vi.mock("../../app/AuthContext", () => ({
  useAuth: () => ({
    user: { subject_id: "u1", kind: "staff", role: "leadership", school_id: "sch1" },
    loading: false,
    refresh: vi.fn(),
    signOut: vi.fn(),
  }),
}))

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>()
  return { ...actual, getSettings: vi.fn(), updateAccessWindow: vi.fn() }
})

const getMock = vi.mocked(api.getSettings)
const updateMock = vi.mocked(api.updateAccessWindow)

const EMPTY_SETTINGS: SchoolSettings = {
  concern_words: { platform_defaults: [], school_additions: [] },
  alert_routing: [],
  access_window: null,
}

const SAVED_SETTINGS: SchoolSettings = {
  ...EMPTY_SETTINGS,
  access_window: {
    window_start: "08:30:00", window_end: "09:30:00", timezone: "Europe/London",
    term_start: null, term_end: null,
  },
}

const SAVED_WITH_TERM: SchoolSettings = {
  ...EMPTY_SETTINGS,
  access_window: {
    window_start: "08:30:00", window_end: "09:30:00", timezone: "Europe/London",
    term_start: "2026-09-01", term_end: "2026-12-18",
  },
}

describe("AccessWindow screen (FR-16-02 · SC-063)", () => {
  beforeEach(() => {
    getMock.mockReset().mockResolvedValue({ settings: EMPTY_SETTINGS })
    updateMock.mockReset()
  })

  it("shows sensible defaults when nothing has been saved yet", async () => {
    render(<AccessWindow />)
    expect(await screen.findByLabelText("Opens")).toHaveValue("08:30")
    expect(screen.getByLabelText("Closes")).toHaveValue("09:30")
  })

  it("loads the saved window when one exists", async () => {
    getMock.mockResolvedValue({ settings: SAVED_SETTINGS })
    render(<AccessWindow />)
    expect(await screen.findByLabelText("Opens")).toHaveValue("08:30")
    expect(screen.getByLabelText("Timezone")).toHaveValue("Europe/London")
  })

  it("loads saved term dates when they exist", async () => {
    getMock.mockResolvedValue({ settings: SAVED_WITH_TERM })
    render(<AccessWindow />)
    expect(await screen.findByLabelText("Term starts")).toHaveValue("2026-09-01")
    expect(screen.getByLabelText("Term ends")).toHaveValue("2026-12-18")
  })

  it("editing and saving calls the real PATCH with the entered values", async () => {
    updateMock.mockResolvedValue({ settings: SAVED_SETTINGS })
    const user = userEvent.setup()
    render(<AccessWindow />)
    await screen.findByLabelText("Opens")

    await user.clear(screen.getByLabelText("Opens"))
    await user.type(screen.getByLabelText("Opens"), "08:30")
    await user.selectOptions(screen.getByLabelText("Timezone"), "Europe/London")
    await user.click(screen.getByRole("button", { name: /^save$/i }))

    await waitFor(() => expect(updateMock).toHaveBeenCalledWith("sch1", {
      window_start: "08:30", window_end: "09:30", timezone: "Europe/London",
      term_start: null, term_end: null,
    }))
  })

  it("saving with both term dates entered sends them to the real PATCH", async () => {
    updateMock.mockResolvedValue({ settings: SAVED_WITH_TERM })
    const user = userEvent.setup()
    render(<AccessWindow />)
    await screen.findByLabelText("Opens")

    await user.type(screen.getByLabelText("Term starts"), "2026-09-01")
    await user.type(screen.getByLabelText("Term ends"), "2026-12-18")
    await user.click(screen.getByRole("button", { name: /^save$/i }))

    await waitFor(() => expect(updateMock).toHaveBeenCalledWith("sch1", {
      window_start: "08:30", window_end: "09:30", timezone: "UTC",
      term_start: "2026-09-01", term_end: "2026-12-18",
    }))
  })

  it("blocks saving one-sided term dates without calling the API", async () => {
    const user = userEvent.setup()
    render(<AccessWindow />)
    await screen.findByLabelText("Opens")

    await user.type(screen.getByLabelText("Term starts"), "2026-09-01")
    await user.click(screen.getByRole("button", { name: /^save$/i }))

    expect(await screen.findByText(/enter both term dates/i)).toBeInTheDocument()
    expect(updateMock).not.toHaveBeenCalled()
  })

  it("disables Save while the request is in flight (real disabled state)", async () => {
    let resolve!: (v: { settings: SchoolSettings }) => void
    updateMock.mockReturnValue(new Promise((r) => { resolve = r }))
    const user = userEvent.setup()
    render(<AccessWindow />)
    await screen.findByLabelText("Opens")

    await user.click(screen.getByRole("button", { name: /^save$/i }))
    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled()
    resolve({ settings: SAVED_SETTINGS })
    await waitFor(() => expect(screen.getByRole("button", { name: /^save$/i })).not.toBeDisabled())
  })

  it("surfaces a save failure (never silently dropped)", async () => {
    updateMock.mockRejectedValue(new Error("request failed: 422"))
    const user = userEvent.setup()
    render(<AccessWindow />)
    await screen.findByLabelText("Opens")
    await user.click(screen.getByRole("button", { name: /^save$/i }))
    expect(await screen.findByText(/isn't valid/i)).toBeInTheDocument()
  })

  it("surfaces a load failure (never silently dropped)", async () => {
    getMock.mockReset().mockRejectedValue(new Error("request failed: 500"))
    render(<AccessWindow />)
    expect(await screen.findByText(/could not be loaded/i)).toBeInTheDocument()
  })
})
