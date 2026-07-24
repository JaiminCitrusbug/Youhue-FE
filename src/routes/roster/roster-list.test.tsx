import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as api from "./api"
import type { RosterStudent } from "./api"
import { RosterListApp } from "./index"

interface MockMe {
  subject_id: string
  kind: string
  role: string | null
  school_id: string | null
}
const authState = vi.hoisted(() => ({
  user: { subject_id: "u1", kind: "staff", role: "teacher", school_id: "sch1" } as MockMe,
}))
vi.mock("../../app/AuthContext", () => ({ useAuth: () => ({ user: authState.user }) }))

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>()
  return { ...actual, getRoster: vi.fn(), reconcileRoster: vi.fn() }
})

const getRosterMock = vi.mocked(api.getRoster)
const reconcileMock = vi.mocked(api.reconcileRoster)

const ACTIVE: RosterStudent = { id: "s1", display_name: "Aisha K.", age_band: "b8_11", status: "active", external_ref: "ext-1" }
const LEAVER: RosterStudent = { id: "s2", display_name: "Sam D.", age_band: "b8_11", status: "inactive", external_ref: "ext-2" }

function csvFile(name = "roster.csv", contents = "name,age,external_ref\nAmy,6,ext-1\n"): File {
  return new File([contents], name, { type: "text/csv" })
}

async function chooseFile(user: ReturnType<typeof userEvent.setup>, file: File) {
  const input = screen.getByLabelText(/choose a csv roster file to re-import/i)
  await user.upload(input, file)
}

describe("RosterListApp (FR-03-05 · SC-037)", () => {
  beforeEach(() => {
    authState.user = { subject_id: "u1", kind: "staff", role: "teacher", school_id: "sch1" }
    getRosterMock.mockReset().mockResolvedValue([ACTIVE, LEAVER])
    reconcileMock.mockReset()
  })

  it("lists every student at the school, real data, active and inactive alike", async () => {
    render(<RosterListApp />)
    expect(await screen.findByText("Aisha K.")).toBeInTheDocument()
    expect(screen.getByText("Sam D.")).toBeInTheDocument()
    expect(getRosterMock).toHaveBeenCalledWith("sch1")
  })

  it("shows status as icon + label, never colour alone", async () => {
    render(<RosterListApp />)
    await screen.findByText("Aisha K.")
    expect(screen.getByText("Active")).toBeInTheDocument()
    expect(screen.getByText(/inactive/i)).toBeInTheDocument()
  })

  it("shows the real age band label", async () => {
    render(<RosterListApp />)
    await screen.findByText("Aisha K.")
    expect(screen.getAllByText("8–11")).toHaveLength(2)
  })

  it("the header sub-line reports real counts, never a fixture number", async () => {
    render(<RosterListApp />)
    await screen.findByText("Aisha K.")
    expect(screen.getByText("2 students · 1 active")).toBeInTheDocument()
  })

  it("re-import triggers a real file picker that POSTs to reconcile and reloads the list", async () => {
    const user = userEvent.setup()
    reconcileMock.mockResolvedValue({
      kind: "success",
      result: { stayers_active: 1, leavers_deactivated: 1, new_added: 1 },
    })
    render(<RosterListApp />)
    await screen.findByText("Aisha K.")

    await chooseFile(user, csvFile())

    await waitFor(() => expect(reconcileMock).toHaveBeenCalledWith("sch1", expect.any(File)))
    expect(await screen.findByText(/stayed active 1/i)).toBeInTheDocument()
    expect(screen.getByText(/deactivated 1/i)).toBeInTheDocument()
    expect(screen.getByText(/added 1/i)).toBeInTheDocument()
    // real reload: the GET is called again after a successful reconcile
    await waitFor(() => expect(getRosterMock).toHaveBeenCalledTimes(2))
  })

  it("shows a loading state on the Re-import control while reconciling (real disabled state)", async () => {
    const user = userEvent.setup()
    let resolve!: (v: Awaited<ReturnType<typeof api.reconcileRoster>>) => void
    reconcileMock.mockReturnValue(new Promise((r) => (resolve = r)))
    render(<RosterListApp />)
    await screen.findByText("Aisha K.")

    await chooseFile(user, csvFile())
    const pending = await screen.findByRole("button", { name: /reconciling/i })
    expect(pending).toBeDisabled()

    resolve({ kind: "success", result: { stayers_active: 1, leavers_deactivated: 0, new_added: 0 } })
    await waitFor(() => expect(screen.getByRole("button", { name: /^re-import$/i })).toBeInTheDocument())
  })

  it("surfaces a 415 with the true reason named by the server", async () => {
    const user = userEvent.setup()
    reconcileMock.mockResolvedValue({
      kind: "failed",
      failure: { kind: "unsupported_type", message: "The file type is not accepted. Upload a .csv roster file." },
    })
    render(<RosterListApp />)
    await screen.findByText("Aisha K.")
    await chooseFile(user, csvFile("roster.exe"))
    expect(await screen.findByRole("alert")).toHaveTextContent(/not accepted/i)
  })

  it("surfaces a 422 with every row error listed", async () => {
    const user = userEvent.setup()
    reconcileMock.mockResolvedValue({
      kind: "failed",
      failure: {
        kind: "malformed_rows",
        message: "One or more rows could not be imported.",
        errors: [{ row: 2, error: "Missing student name." }],
      },
    })
    render(<RosterListApp />)
    await screen.findByText("Aisha K.")
    await chooseFile(user, csvFile())
    expect(await screen.findByRole("alert")).toHaveTextContent(/could not be imported/i)
    expect(screen.getByText(/row 2: missing student name/i)).toBeInTheDocument()
  })

  it("surfaces a load failure without crashing (never silently dropped)", async () => {
    getRosterMock.mockReset().mockRejectedValue(new Error("request failed: 500"))
    render(<RosterListApp />)
    expect(await screen.findByText(/roster could not be loaded/i)).toBeInTheDocument()
  })

  it("shows a genuine empty state when the school has no students", async () => {
    getRosterMock.mockResolvedValue([])
    render(<RosterListApp />)
    expect(await screen.findByText(/no students yet/i)).toBeInTheDocument()
  })

  it("disables Re-import and shows guidance when the session carries no school", () => {
    authState.user = { subject_id: "u1", kind: "staff", role: "teacher", school_id: null }
    render(<RosterListApp />)
    expect(screen.getByRole("alert")).toHaveTextContent(/sign in again/i)
    expect(screen.getByRole("button", { name: /^re-import$/i })).toBeDisabled()
  })
})
