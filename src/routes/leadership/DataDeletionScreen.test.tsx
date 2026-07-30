import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as exportApi from "./export-api"
import type { ExportStatusOut } from "./export-api"
import * as deletionApi from "./deletion-api"
import type { ExportAndDeleteOut } from "./deletion-api"
import { DataDeletionScreen } from "./DataDeletionScreen"

vi.mock("../../app/AuthContext", () => ({
  useAuth: () => ({
    user: { subject_id: "u1", kind: "staff", role: "leadership", school_id: "sch1" },
    loading: false,
    refresh: vi.fn(),
    signOut: vi.fn(),
  }),
}))

vi.mock("./export-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./export-api")>()
  return { ...actual, getExportStatus: vi.fn() }
})

vi.mock("./deletion-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./deletion-api")>()
  return { ...actual, requestExportAndDelete: vi.fn() }
})

const statusMock = vi.mocked(exportApi.getExportStatus)
const exitMock = vi.mocked(deletionApi.requestExportAndDelete)

const OFFERED: ExportAndDeleteOut = { export_id: "exp1", status: "pending", deleted: false }
const COMPLETED: ExportAndDeleteOut = { export_id: "exp1", status: "completed", deleted: true }
const PENDING: ExportStatusOut = {
  export_id: "exp1", kind: "export_and_delete", status: "pending", created_at: "2026-01-01T00:00:00Z",
  download_url: null,
}
const READY: ExportStatusOut = {
  ...PENDING, status: "ready", download_url: "https://minio.local/exp1.json?sig=abc",
}

describe("DataDeletionScreen (FR-20-02 · SC-065)", () => {
  beforeEach(() => {
    exitMock.mockReset()
    statusMock.mockReset()
  })

  it("offers a full export first — no delete happens on the first action", async () => {
    const user = userEvent.setup()
    exitMock.mockResolvedValue(OFFERED)

    render(<DataDeletionScreen />)
    await user.click(screen.getByRole("button", { name: /export first/i }))

    expect(exitMock).toHaveBeenCalledWith("sch1")
    expect(exitMock).toHaveBeenCalledTimes(1)
    expect(await screen.findByText("Preparing export")).toBeInTheDocument()
    // the delete action exists but must stay disabled until the export is ready
    expect(screen.getByRole("button", { name: /delete permanently/i })).toBeDisabled()
  })

  it("shows a real download link and enables delete once the export is ready", async () => {
    const user = userEvent.setup()
    exitMock.mockResolvedValue(OFFERED)
    statusMock.mockResolvedValue(READY)

    render(<DataDeletionScreen />)
    await user.click(screen.getByRole("button", { name: /export first/i }))
    await screen.findByText("Preparing export")
    await user.click(screen.getByRole("button", { name: /check status/i }))

    expect(statusMock).toHaveBeenCalledWith("sch1", "exp1")
    expect(await screen.findByText("Export ready")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /download export/i })).toHaveAttribute(
      "href", READY.download_url,
    )
    expect(screen.getByRole("button", { name: /delete permanently/i })).not.toBeDisabled()
  })

  it("asks for native confirmation before deleting, and does nothing if cancelled", async () => {
    const user = userEvent.setup()
    exitMock.mockResolvedValue(OFFERED)
    statusMock.mockResolvedValue(READY)
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false)

    render(<DataDeletionScreen />)
    await user.click(screen.getByRole("button", { name: /export first/i }))
    await user.click(screen.getByRole("button", { name: /check status/i }))
    await screen.findByText("Export ready")
    await user.click(screen.getByRole("button", { name: /delete permanently/i }))

    expect(confirmSpy).toHaveBeenCalled()
    // still only the ONE call from the offer step — cancelling never fires the delete
    expect(exitMock).toHaveBeenCalledTimes(1)
    expect(screen.queryByText("Deleted")).not.toBeInTheDocument()
    confirmSpy.mockRestore()
  })

  it("hard-deletes after confirmation and shows the terminal state (irreversible)", async () => {
    const user = userEvent.setup()
    exitMock.mockResolvedValueOnce(OFFERED).mockResolvedValueOnce(COMPLETED)
    statusMock.mockResolvedValue(READY)
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true)

    render(<DataDeletionScreen />)
    await user.click(screen.getByRole("button", { name: /export first/i }))
    await user.click(screen.getByRole("button", { name: /check status/i }))
    await screen.findByText("Export ready")
    await user.click(screen.getByRole("button", { name: /delete permanently/i }))

    expect(exitMock).toHaveBeenCalledTimes(2)
    expect(await screen.findByText("Deleted")).toBeInTheDocument()
    expect(
      screen.getByText(/permanently deleted/i),
    ).toBeInTheDocument()
    // terminal — no further actions are offered once the school is gone
    expect(screen.queryByRole("button", { name: /delete permanently/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /export first/i })).not.toBeInTheDocument()
    confirmSpy.mockRestore()
  })

  it("surfaces the ordering-guard rejection if a delete is somehow attempted too early", async () => {
    const user = userEvent.setup()
    exitMock
      .mockResolvedValueOnce(OFFERED)
      .mockRejectedValueOnce(new Error("request failed: 409"))
    statusMock.mockResolvedValue(READY)
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true)

    render(<DataDeletionScreen />)
    await user.click(screen.getByRole("button", { name: /export first/i }))
    await user.click(screen.getByRole("button", { name: /check status/i }))
    await screen.findByText("Export ready")
    await user.click(screen.getByRole("button", { name: /delete permanently/i }))

    expect(await screen.findByText(/isn't ready yet/i)).toBeInTheDocument()
    confirmSpy.mockRestore()
  })

  it("surfaces a forbidden failure starting the exit (never silently dropped)", async () => {
    const user = userEvent.setup()
    exitMock.mockRejectedValue(new Error("request failed: 403"))

    render(<DataDeletionScreen />)
    await user.click(screen.getByRole("button", { name: /export first/i }))

    expect(await screen.findByText(/don't have permission/i)).toBeInTheDocument()
  })
})
