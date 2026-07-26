import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as api from "./export-api"
import type { ExportAccepted, ExportStatusOut } from "./export-api"
import { DataExportScreen } from "./DataExportScreen"

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
  return { ...actual, requestExport: vi.fn(), getExportStatus: vi.fn() }
})

const requestMock = vi.mocked(api.requestExport)
const statusMock = vi.mocked(api.getExportStatus)

const ACCEPTED: ExportAccepted = { export_id: "exp1", status: "pending" }
const PENDING: ExportStatusOut = {
  export_id: "exp1", kind: "export", status: "pending", created_at: "2026-01-01T00:00:00Z",
  download_url: null,
}
const READY: ExportStatusOut = {
  ...PENDING, status: "ready", download_url: "https://minio.local/exp1.json?sig=abc",
}

describe("DataExportScreen (FR-20-01 · SC-064 · GATE G-12)", () => {
  beforeEach(() => {
    requestMock.mockReset()
    statusMock.mockReset()
  })

  it("requests an export and shows the preparing state (async 202 contract)", async () => {
    const user = userEvent.setup()
    requestMock.mockResolvedValue(ACCEPTED)

    render(<DataExportScreen />)
    await user.click(screen.getByRole("button", { name: /request export/i }))

    expect(requestMock).toHaveBeenCalledWith("sch1")
    expect(await screen.findByText(/being prepared/i)).toBeInTheDocument()
    expect(screen.getByText("Preparing")).toBeInTheDocument()
  })

  it("checking status shows a download link once ready (200 export_ready)", async () => {
    const user = userEvent.setup()
    requestMock.mockResolvedValue(ACCEPTED)
    statusMock.mockResolvedValue(READY)

    render(<DataExportScreen />)
    await user.click(screen.getByRole("button", { name: /request export/i }))
    await screen.findByText(/being prepared/i)
    await user.click(screen.getByRole("button", { name: /check status/i }))

    expect(statusMock).toHaveBeenCalledWith("sch1", "exp1")
    expect(await screen.findByText(/ready to download/i)).toBeInTheDocument()
    expect(screen.getByText("Ready")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /download export/i })).toHaveAttribute(
      "href", READY.download_url,
    )
  })

  it("checking status while still pending shows no download link", async () => {
    const user = userEvent.setup()
    requestMock.mockResolvedValue(ACCEPTED)
    statusMock.mockResolvedValue(PENDING)

    render(<DataExportScreen />)
    await user.click(screen.getByRole("button", { name: /request export/i }))
    await screen.findByText(/being prepared/i)
    await user.click(screen.getByRole("button", { name: /check status/i }))

    expect(await screen.findByText(/being prepared/i)).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /download export/i })).not.toBeInTheDocument()
  })

  it("surfaces a request failure (never silently dropped)", async () => {
    const user = userEvent.setup()
    requestMock.mockRejectedValue(new Error("request failed: 403"))

    render(<DataExportScreen />)
    await user.click(screen.getByRole("button", { name: /request export/i }))

    expect(await screen.findByText(/don't have permission/i)).toBeInTheDocument()
  })
})
