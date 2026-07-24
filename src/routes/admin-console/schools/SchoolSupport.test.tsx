import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as api from "./api"
import type { SchoolDetail } from "./api"
import { SchoolSupport } from "./SchoolSupport"

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>()
  return { ...actual, getSchool: vi.fn(), openSupportAccess: vi.fn() }
})

const getMock = vi.mocked(api.getSchool)
const openMock = vi.mocked(api.openSupportAccess)

function detail(overrides: Partial<SchoolDetail> = {}): SchoolDetail {
  return {
    id: "s2",
    name: "Riverside",
    tier: "free",
    status: "active",
    timezone: "UTC",
    subscription_state: null,
    trial_end_at: null,
    trial_extension_count: 0,
    ...overrides,
  }
}

function renderScreen(schoolId = "s2") {
  return render(
    <MemoryRouter initialEntries={[`/app/admin/schools/${schoolId}/support`]}>
      <Routes>
        <Route path="/app/admin/schools/:schoolId/support" element={<SchoolSupport />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("SchoolSupport screen (FR-19-02 · SC-077)", () => {
  beforeEach(() => {
    getMock.mockReset()
    openMock.mockReset()
  })

  it("loads the school and shows the permission-bound / audited banner", async () => {
    getMock.mockResolvedValue(detail())
    renderScreen()
    expect(await screen.findByText(/open riverside for support/i)).toBeInTheDocument()
    expect(screen.getByText(/permission-bound and written to the audit log/i)).toBeInTheDocument()
  })

  it("keeps the open control disabled until a reason is typed (no dead controls)", async () => {
    const user = userEvent.setup()
    getMock.mockResolvedValue(detail())
    renderScreen()
    await screen.findByText(/open riverside for support/i)

    const openBtn = screen.getByRole("button", { name: /open with reason/i })
    expect(openBtn).toBeDisabled()

    await user.type(screen.getByLabelText(/reason for access/i), "Ticket 4821")
    expect(openBtn).toBeEnabled()
  })

  it("opens support access with the typed reason and confirms it was logged", async () => {
    const user = userEvent.setup()
    getMock.mockResolvedValue(detail())
    openMock.mockResolvedValue({ action: "support_access", school: detail() })
    renderScreen()
    await screen.findByText(/open riverside for support/i)

    await user.type(screen.getByLabelText(/reason for access/i), "Ticket 4821 — alert routing")
    await user.click(screen.getByRole("button", { name: /open with reason/i }))

    await waitFor(() =>
      expect(openMock).toHaveBeenCalledWith("s2", "Ticket 4821 — alert routing"),
    )
    expect(await screen.findByRole("status")).toHaveTextContent(/opened and logged/i)
  })

  it("surfaces the RBAC 403 when the actor's role lacks access_child_data (permission-bound)", async () => {
    const user = userEvent.setup()
    getMock.mockResolvedValue(detail())
    openMock.mockRejectedValue(new Error("request failed: 403"))
    renderScreen()
    await screen.findByText(/open riverside for support/i)

    await user.type(screen.getByLabelText(/reason for access/i), "Ticket 4821")
    await user.click(screen.getByRole("button", { name: /open with reason/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/permission/i)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("surfaces the 422 when the reason is rejected server-side", async () => {
    const user = userEvent.setup()
    getMock.mockResolvedValue(detail())
    openMock.mockRejectedValue(new Error("request failed: 422"))
    renderScreen()
    await screen.findByText(/open riverside for support/i)

    await user.type(screen.getByLabelText(/reason for access/i), "x")
    await user.click(screen.getByRole("button", { name: /open with reason/i }))
    expect(await screen.findByRole("alert")).toHaveTextContent(/reason is required/i)
  })

  it("clears a prior confirmation when the reason is edited again", async () => {
    const user = userEvent.setup()
    getMock.mockResolvedValue(detail())
    openMock.mockResolvedValue({ action: "support_access", school: detail() })
    renderScreen()
    await screen.findByText(/open riverside for support/i)

    await user.type(screen.getByLabelText(/reason for access/i), "Ticket #1")
    await user.click(screen.getByRole("button", { name: /open with reason/i }))
    expect(await screen.findByRole("status")).toBeInTheDocument()

    await user.type(screen.getByLabelText(/reason for access/i), " more")
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("withholds the form and offers retry when the school fails to load", async () => {
    const user = userEvent.setup()
    getMock.mockRejectedValueOnce(new Error("request failed: 500"))
    renderScreen()
    expect(await screen.findByRole("alert")).toBeInTheDocument()
    expect(screen.queryByLabelText(/reason for access/i)).not.toBeInTheDocument()

    getMock.mockResolvedValue(detail())
    await user.click(screen.getByRole("button", { name: /retry/i }))
    expect(await screen.findByLabelText(/reason for access/i)).toBeInTheDocument()
  })
})
