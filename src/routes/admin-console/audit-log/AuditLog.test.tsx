import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as api from "./api"
import type { AuditLogEntry, AuditLogListResponse } from "./api"
import { AuditLog } from "./AuditLog"

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>()
  return { ...actual, listAuditLog: vi.fn(), exportAuditLog: vi.fn() }
})

const listMock = vi.mocked(api.listAuditLog)
const exportMock = vi.mocked(api.exportAuditLog)

const SUPPORT_ENTRY: AuditLogEntry = {
  id: "e1", at: "2026-07-29T09:03:00Z", actor_id: "admin-1",
  action: "fr_19_02.support_access", target: "school:s1", school_id: "s1",
}
const CONFIG_ENTRY: AuditLogEntry = {
  id: "e2", at: "2026-07-29T08:52:00Z", actor_id: "system",
  action: "fr_16_02.config_changed", target: "school:s1", school_id: "s1",
}

function page(entries: AuditLogEntry[], total = entries.length, p = 1): AuditLogListResponse {
  return { entries, total, page: p, page_size: 20 }
}

describe("AuditLog screen (FR-20-05 · SC-080)", () => {
  beforeEach(() => {
    listMock.mockReset().mockResolvedValue(page([SUPPORT_ENTRY, CONFIG_ENTRY]))
    exportMock.mockReset()
  })

  // ---- Scenario 1: view + filter -----------------------------------------------------------

  it("lists recorded events (when/actor/action) on mount", async () => {
    render(<AuditLog />)
    expect(await screen.findByText("fr_19_02.support_access")).toBeInTheDocument()
    expect(screen.getByText("fr_16_02.config_changed")).toBeInTheDocument()
    expect(listMock).toHaveBeenCalledWith({
      actorId: "", action: "", schoolId: "", dateFrom: "", page: 1, pageSize: 20,
    })
  })

  it("includes a support-access entry among the recorded events", async () => {
    render(<AuditLog />)
    expect(await screen.findByText("fr_19_02.support_access")).toBeInTheDocument()
  })

  it("applying a filter re-queries with the typed values", async () => {
    const user = userEvent.setup()
    render(<AuditLog />)
    await screen.findByText("fr_19_02.support_access")

    await user.type(screen.getByLabelText(/filter by action/i), "support_access")
    await user.click(screen.getByRole("button", { name: /^filter$/i }))

    await waitFor(() =>
      expect(listMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ action: "support_access", page: 1 }),
      ),
    )
  })

  // ---- Scenario 4 (NEG): view + filter + export only, never an editor ----------------------

  it("offers no edit or delete control anywhere on the screen", async () => {
    render(<AuditLog />)
    await screen.findByText("fr_19_02.support_access")
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument()
    expect(screen.getByText(/cannot be edited or deleted/i)).toBeInTheDocument()
  })

  // ---- Export: a real file, not a dead control ----------------------------------------------

  it("the Export control downloads a real CSV file, not a dead link", async () => {
    const user = userEvent.setup()
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:mock")
    const revokeObjectURL = vi.fn()
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL })
    exportMock.mockResolvedValue(new Blob(["at,actor_id,action\n"], { type: "text/csv" }))

    render(<AuditLog />)
    await screen.findByText("fr_19_02.support_access")
    await user.click(screen.getByRole("button", { name: /^export$/i }))

    await waitFor(() => expect(exportMock).toHaveBeenCalled())
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock")

    vi.unstubAllGlobals()
  })

  it("surfaces an export failure, never a silent gap", async () => {
    const user = userEvent.setup()
    exportMock.mockRejectedValue(new Error("request failed: 403"))
    render(<AuditLog />)
    await screen.findByText("fr_19_02.support_access")
    await user.click(screen.getByRole("button", { name: /^export$/i }))
    expect(await screen.findByRole("alert")).toHaveTextContent(/permission/i)
  })

  // ---- Loading / empty / error states --------------------------------------------------------

  it("shows a loading state before data arrives", () => {
    listMock.mockReturnValue(new Promise(() => {}))
    render(<AuditLog />)
    expect(screen.getByText(/loading audit log/i)).toBeInTheDocument()
  })

  it("shows a genuine empty state when a filter matches nothing", async () => {
    listMock.mockResolvedValue(page([], 0))
    render(<AuditLog />)
    expect(await screen.findByText(/no entries match your filter/i)).toBeInTheDocument()
  })

  it("surfaces a load failure, never a silent gap", async () => {
    listMock.mockReset().mockRejectedValue(new Error("request failed: 403"))
    render(<AuditLog />)
    expect(await screen.findByText(/audit log could not be loaded/i)).toBeInTheDocument()
  })

  // ---- Pagination ------------------------------------------------------------------------

  it("Previous is disabled on page 1; Next paginates forward", async () => {
    const user = userEvent.setup()
    listMock.mockResolvedValue(page([SUPPORT_ENTRY], 40, 1))
    render(<AuditLog />)
    await screen.findByText("fr_19_02.support_access")

    const prev = screen.getByRole("button", { name: /^previous$/i })
    const next = screen.getByRole("button", { name: /^next$/i })
    expect(prev).toBeDisabled()
    expect(next).not.toBeDisabled()

    listMock.mockResolvedValue(page([CONFIG_ENTRY], 40, 2))
    await user.click(next)
    await waitFor(() =>
      expect(listMock).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })),
    )
  })

  it("shows the count hint (showing N of TOTAL)", async () => {
    listMock.mockResolvedValue(page([SUPPORT_ENTRY, CONFIG_ENTRY], 40, 1))
    render(<AuditLog />)
    expect(await screen.findByText(/showing 2 of 40/i)).toBeInTheDocument()
  })

  it("renders the actor and action for each row inside the table", async () => {
    render(<AuditLog />)
    const row = (await screen.findByText("fr_19_02.support_access")).closest("tr")
    expect(row).not.toBeNull()
    expect(within(row as HTMLElement).getByText("admin-1")).toBeInTheDocument()
  })
})
