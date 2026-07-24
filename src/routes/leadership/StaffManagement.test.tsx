import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi, beforeEach } from "vitest"

import * as api from "./api"
import type { StaffRow } from "./api"
import { StaffManagement } from "./StaffManagement"

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
  return { ...actual, listStaff: vi.fn(), deactivateStaff: vi.fn() }
})

const listMock = vi.mocked(api.listStaff)
const deactivateMock = vi.mocked(api.deactivateStaff)

const ACTIVE: StaffRow = { id: "st1", email: "okafor@oakfield.sch", role: "teacher", status: "active", created_at: "2026-01-01" }
const INVITED: StaffRow = { id: "st2", email: "ali@oakfield.sch", role: "teacher", status: "invited", created_at: "2026-01-01" }

describe("StaffManagement screen (FR-16-02 · SC-057)", () => {
  beforeEach(() => {
    listMock.mockReset().mockResolvedValue({ staff: [ACTIVE, INVITED] })
    deactivateMock.mockReset()
  })

  it("lists every staff account at the leader's own school", async () => {
    render(<StaffManagement />)
    expect(await screen.findByText("okafor@oakfield.sch")).toBeInTheDocument()
    expect(screen.getByText("ali@oakfield.sch")).toBeInTheDocument()
    expect(listMock).toHaveBeenCalledWith("sch1")
  })

  it("shows status as a tag (icon + label, never colour alone)", async () => {
    render(<StaffManagement />)
    await screen.findByText("okafor@oakfield.sch")
    expect(screen.getByText("Active")).toBeInTheDocument()
    expect(screen.getByText("Invited")).toBeInTheDocument()
  })

  it("an active row has a real Deactivate control; a non-active row has none", async () => {
    render(<StaffManagement />)
    await screen.findByText("okafor@oakfield.sch")
    expect(screen.getAllByRole("button", { name: /^deactivate$/i })).toHaveLength(1)
  })

  it("deactivating calls the real PATCH and updates the row's status", async () => {
    deactivateMock.mockResolvedValue({ staff: { ...ACTIVE, status: "deactivated" } })
    const user = userEvent.setup()
    render(<StaffManagement />)
    await screen.findByText("okafor@oakfield.sch")

    await user.click(screen.getByRole("button", { name: /^deactivate$/i }))

    await waitFor(() => expect(deactivateMock).toHaveBeenCalledWith("sch1", "st1"))
    expect(await screen.findByText("Deactivated")).toBeInTheDocument()
  })

  it("disables the row's button while the request is in flight (real disabled state)", async () => {
    let resolve!: (v: { staff: StaffRow }) => void
    deactivateMock.mockReturnValue(new Promise((r) => { resolve = r }))
    const user = userEvent.setup()
    render(<StaffManagement />)
    await screen.findByText("okafor@oakfield.sch")

    await user.click(screen.getByRole("button", { name: /^deactivate$/i }))
    const pendingBtn = screen.getByRole("button", { name: /deactivating/i })
    expect(pendingBtn).toBeDisabled()

    resolve({ staff: { ...ACTIVE, status: "deactivated" } })
    await waitFor(() => expect(screen.getByText("Deactivated")).toBeInTheDocument())
  })

  it("surfaces a deactivate failure without crashing the list", async () => {
    deactivateMock.mockRejectedValue(new Error("request failed: 403"))
    const user = userEvent.setup()
    render(<StaffManagement />)
    await screen.findByText("okafor@oakfield.sch")

    await user.click(screen.getByRole("button", { name: /^deactivate$/i }))
    expect(await screen.findByText(/don't have permission/i)).toBeInTheDocument()
  })

  it("surfaces a load failure (never silently dropped)", async () => {
    listMock.mockReset().mockRejectedValue(new Error("request failed: 500"))
    render(<StaffManagement />)
    expect(await screen.findByText(/staff could not be loaded/i)).toBeInTheDocument()
  })

  it("shows a genuine empty state when the school has no staff", async () => {
    listMock.mockResolvedValue({ staff: [] })
    render(<StaffManagement />)
    expect(await screen.findByText(/no staff yet/i)).toBeInTheDocument()
  })
})
