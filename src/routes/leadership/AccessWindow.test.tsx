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
  access_window: { window_start: "08:30:00", window_end: "09:30:00", timezone: "Europe/London" },
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
    }))
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
