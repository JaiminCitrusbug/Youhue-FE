import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { RosterImportApp } from "./index"

const api = vi.hoisted(() => ({ importRoster: vi.fn() }))
vi.mock("./api", () => ({ importRoster: api.importRoster }))

interface MockMe {
  subject_id: string
  kind: string
  role: string | null
  school_id: string | null
}
const authState = vi.hoisted(() => ({
  user: { subject_id: "staff-1", kind: "staff", role: "teacher", school_id: "school-1" } as MockMe,
}))
vi.mock("../../app/AuthContext", () => ({ useAuth: () => ({ user: authState.user }) }))

function csvFile(name = "roster.csv", contents = "name,age\nAmy,6\n"): File {
  return new File([contents], name, { type: "text/csv" })
}

async function chooseFile(user: ReturnType<typeof userEvent.setup>, file: File) {
  const input = screen.getByLabelText(/choose a csv roster file/i)
  await user.upload(input, file)
}

describe("RosterImportApp (FR-03-01 · SC-036)", () => {
  beforeEach(() => {
    api.importRoster.mockReset()
    authState.user = { subject_id: "staff-1", kind: "staff", role: "teacher", school_id: "school-1" }
  })
  afterEach(() => vi.restoreAllMocks())

  it("renders the approved copy", () => {
    render(<RosterImportApp />)
    expect(screen.getByRole("heading", { name: /import your roster/i })).toBeInTheDocument()
    expect(screen.getByText(/csv import only/i)).toBeInTheDocument()
  })

  it("disables Upload until a file is chosen", async () => {
    render(<RosterImportApp />)
    expect(screen.getByRole("button", { name: /^upload$/i })).toBeDisabled()
  })

  it("enables Upload once a file is chosen, shows its name, and uploads on click", async () => {
    const user = userEvent.setup()
    api.importRoster.mockResolvedValue({ kind: "success", result: { imported: 3, banded: 3 } })
    render(<RosterImportApp />)

    await chooseFile(user, csvFile("class-3a.csv"))
    expect(screen.getByText("class-3a.csv")).toBeInTheDocument()
    const submit = screen.getByRole("button", { name: /^upload$/i })
    expect(submit).toBeEnabled()

    await user.click(submit)

    await waitFor(() => expect(api.importRoster).toHaveBeenCalledWith("school-1", expect.any(File)))
    expect(await screen.findByText(/imported 3/i)).toBeInTheDocument()
    expect(screen.getByText(/banded 3/i)).toBeInTheDocument()
  })

  it("shows a loading state while uploading and disables the control", async () => {
    const user = userEvent.setup()
    let resolve!: (v: unknown) => void
    api.importRoster.mockReturnValue(new Promise((r) => (resolve = r)))
    render(<RosterImportApp />)

    await chooseFile(user, csvFile())
    await user.click(screen.getByRole("button", { name: /^upload$/i }))

    const uploading = await screen.findByRole("button", { name: /uploading/i })
    expect(uploading).toBeDisabled()

    resolve({ kind: "success", result: { imported: 1, banded: 1 } })
    await waitFor(() => expect(screen.getByRole("button", { name: /^upload$/i })).toBeInTheDocument())
  })

  it("surfaces a 415 with the true reason named by the server", async () => {
    const user = userEvent.setup()
    api.importRoster.mockResolvedValue({
      kind: "failed",
      failure: { kind: "unsupported_type", message: "The file type is not accepted. Upload a .csv roster file." },
    })
    render(<RosterImportApp />)

    await chooseFile(user, csvFile("roster.exe"))
    await user.click(screen.getByRole("button", { name: /^upload$/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/not accepted/i)
  })

  it("surfaces a 413 too-large failure", async () => {
    const user = userEvent.setup()
    api.importRoster.mockResolvedValue({
      kind: "failed",
      failure: { kind: "too_large", message: "The file is over the 2MB limit." },
    })
    render(<RosterImportApp />)
    await chooseFile(user, csvFile())
    await user.click(screen.getByRole("button", { name: /^upload$/i }))
    expect(await screen.findByRole("alert")).toHaveTextContent(/2MB limit/i)
  })

  it("surfaces a 400 failed-scan failure", async () => {
    const user = userEvent.setup()
    api.importRoster.mockResolvedValue({
      kind: "failed",
      failure: { kind: "failed_scan", message: "The uploaded file is empty." },
    })
    render(<RosterImportApp />)
    await chooseFile(user, csvFile())
    await user.click(screen.getByRole("button", { name: /^upload$/i }))
    expect(await screen.findByRole("alert")).toHaveTextContent(/empty/i)
  })

  it("surfaces a 422 with every row error listed", async () => {
    const user = userEvent.setup()
    api.importRoster.mockResolvedValue({
      kind: "failed",
      failure: {
        kind: "malformed_rows",
        message: "One or more rows could not be imported.",
        errors: [
          { row: 2, error: "Missing student name." },
          { row: 3, error: "Age 'x' is not a whole number." },
        ],
      },
    })
    render(<RosterImportApp />)
    await chooseFile(user, csvFile())
    await user.click(screen.getByRole("button", { name: /^upload$/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not be imported/i)
    expect(screen.getByText(/row 2: missing student name/i)).toBeInTheDocument()
    expect(screen.getByText(/row 3: age 'x' is not a whole number/i)).toBeInTheDocument()
  })

  it("surfaces a 403 forbidden failure", async () => {
    const user = userEvent.setup()
    api.importRoster.mockResolvedValue({
      kind: "failed",
      failure: { kind: "forbidden", message: "You don't have permission to import a roster for this school." },
    })
    render(<RosterImportApp />)
    await chooseFile(user, csvFile())
    await user.click(screen.getByRole("button", { name: /^upload$/i }))
    expect(await screen.findByRole("alert")).toHaveTextContent(/permission/i)
  })

  it("clears a previous error once a new file is chosen", async () => {
    const user = userEvent.setup()
    api.importRoster.mockResolvedValue({
      kind: "failed",
      failure: { kind: "error", message: "Couldn't import the roster. Please try again." },
    })
    render(<RosterImportApp />)
    await chooseFile(user, csvFile())
    await user.click(screen.getByRole("button", { name: /^upload$/i }))
    expect(await screen.findByRole("alert")).toBeInTheDocument()

    await chooseFile(user, csvFile("second.csv"))
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("disables Upload and shows guidance when the session carries no school", () => {
    authState.user = { subject_id: "staff-1", kind: "staff", role: "teacher", school_id: null }
    render(<RosterImportApp />)
    expect(screen.getByRole("alert")).toHaveTextContent(/sign in again/i)
  })

  it("the Download template control produces a real file, not a dead link", async () => {
    const user = userEvent.setup()
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:mock")
    const revokeObjectURL = vi.fn()
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL })

    render(<RosterImportApp />)
    await user.click(screen.getByRole("button", { name: /download template/i }))

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock")
  })
})
