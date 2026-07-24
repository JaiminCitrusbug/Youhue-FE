import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as api from "./api"
import type { SchoolSettings, StaffRow } from "./api"
import { AlertRouting } from "./AlertRouting"

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
  return { ...actual, getSettings: vi.fn(), listStaff: vi.fn(), updateAlertRouting: vi.fn() }
})

const getMock = vi.mocked(api.getSettings)
const staffMock = vi.mocked(api.listStaff)
const updateMock = vi.mocked(api.updateAlertRouting)

const TEACHER: StaffRow = { id: "st1", email: "teacher@school.edu", role: "teacher", status: "active", created_at: "x" }
const PASTORAL: StaffRow = { id: "st2", email: "pastoral@school.edu", role: "support", status: "active", created_at: "x" }

const BASE_SETTINGS: SchoolSettings = {
  concern_words: { platform_defaults: [], school_additions: [] },
  alert_routing: [{ alert_type: "immediate", recipient_staff_ids: ["st1"] }],
  access_window: null,
}

describe("AlertRouting screen (FR-16-02 · SC-061)", () => {
  beforeEach(() => {
    getMock.mockReset().mockResolvedValue({ settings: BASE_SETTINGS })
    staffMock.mockReset().mockResolvedValue({ staff: [TEACHER, PASTORAL] })
    updateMock.mockReset()
  })

  it("shows the configured recipient chain read-only, by staff email", async () => {
    render(<AlertRouting />)
    expect(await screen.findByText("teacher@school.edu")).toBeInTheDocument()
    expect(screen.getByText("Immediate")).toBeInTheDocument()
    expect(screen.getByText("Triage")).toBeInTheDocument()
    expect(screen.getByText(/no recipients set/i)).toBeInTheDocument() // triage is empty
  })

  it("Edit recipients opens a real edit form seeded from the current config", async () => {
    const user = userEvent.setup()
    render(<AlertRouting />)
    await screen.findByText("teacher@school.edu")

    await user.click(screen.getByRole("button", { name: /edit recipients/i }))
    expect(screen.getByRole("button", { name: /^save$/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^cancel$/i })).toBeInTheDocument()
  })

  it("adding a recipient then saving calls the real PATCH", async () => {
    updateMock.mockResolvedValue({
      settings: {
        ...BASE_SETTINGS,
        alert_routing: [{ alert_type: "immediate", recipient_staff_ids: ["st1", "st2"] }],
      },
    })
    const user = userEvent.setup()
    render(<AlertRouting />)
    await screen.findByText("teacher@school.edu")
    await user.click(screen.getByRole("button", { name: /edit recipients/i }))

    await user.selectOptions(screen.getByLabelText(/add a recipient for immediate/i), "st2")
    const addButtons = screen.getAllByRole("button", { name: /^add$/i })
    await user.click(addButtons[0])
    await user.click(screen.getByRole("button", { name: /^save$/i }))

    await waitFor(() => expect(updateMock).toHaveBeenCalledWith("sch1", [
      { alert_type: "immediate", recipient_staff_ids: ["st1", "st2"] },
    ]))
  })

  it("removing a recipient in edit mode takes it off the draft", async () => {
    const user = userEvent.setup()
    render(<AlertRouting />)
    await screen.findByText("teacher@school.edu")
    await user.click(screen.getByRole("button", { name: /edit recipients/i }))

    await user.click(screen.getByRole("button", { name: /remove/i }))
    expect(screen.queryAllByRole("button", { name: /remove/i })).toHaveLength(0)
    expect(screen.getAllByText(/no recipients yet/i)).toHaveLength(2)
  })

  it("cancel discards the draft without calling the API", async () => {
    const user = userEvent.setup()
    render(<AlertRouting />)
    await screen.findByText("teacher@school.edu")
    await user.click(screen.getByRole("button", { name: /edit recipients/i }))
    await user.click(screen.getByRole("button", { name: /^cancel$/i }))

    expect(updateMock).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: /edit recipients/i })).toBeInTheDocument()
  })

  it("surfaces a save failure (never silently dropped)", async () => {
    updateMock.mockRejectedValue(new Error("request failed: 422"))
    const user = userEvent.setup()
    render(<AlertRouting />)
    await screen.findByText("teacher@school.edu")
    await user.click(screen.getByRole("button", { name: /edit recipients/i }))
    await user.click(screen.getByRole("button", { name: /^save$/i }))

    expect(await screen.findByText(/isn't valid/i)).toBeInTheDocument()
  })

  it("surfaces a load failure (never silently dropped)", async () => {
    getMock.mockReset().mockRejectedValue(new Error("request failed: 500"))
    render(<AlertRouting />)
    expect(await screen.findByText(/could not be loaded/i)).toBeInTheDocument()
  })
})
