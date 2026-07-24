import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as api from "./api"
import type { SchoolDetail } from "./api"
import { SchoolTrial } from "./SchoolTrial"

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>()
  return { ...actual, getSchool: vi.fn(), extendTrial: vi.fn() }
})

const getMock = vi.mocked(api.getSchool)
const extendMock = vi.mocked(api.extendTrial)

function detail(overrides: Partial<SchoolDetail> = {}): SchoolDetail {
  return {
    id: "s1",
    name: "Oakfield Primary",
    tier: "premium",
    status: "active",
    timezone: "UTC",
    subscription_state: "trial",
    trial_end_at: null,
    trial_extension_count: 0,
    ...overrides,
  }
}

function renderScreen(schoolId = "s1") {
  return render(
    <MemoryRouter initialEntries={[`/app/admin/schools/${schoolId}/trial`]}>
      <Routes>
        <Route path="/app/admin/schools/:schoolId/trial" element={<SchoolTrial />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("SchoolTrial screen (FR-19-02 · SC-076)", () => {
  beforeEach(() => {
    getMock.mockReset()
    extendMock.mockReset()
  })

  it("loads the school and shows its trial state", async () => {
    getMock.mockResolvedValue(
      detail({ trial_end_at: new Date(Date.now() + 24 * 86400 * 1000).toISOString() }),
    )
    renderScreen()
    expect(await screen.findByText(/oakfield primary — trial/i)).toBeInTheDocument()
    expect(screen.getByText(/in 24 day/i)).toBeInTheDocument()
    expect(screen.getByText("0 / 1")).toBeInTheDocument()
    expect(getMock).toHaveBeenCalledWith("s1")
  })

  it("grants the extension and shows the confirmation", async () => {
    const user = userEvent.setup()
    getMock.mockResolvedValue(detail())
    extendMock.mockResolvedValue({
      action: "extend_trial",
      school: detail({
        trial_extension_count: 1,
        trial_end_at: new Date(Date.now() + 14 * 86400 * 1000).toISOString(),
      }),
    })
    renderScreen()
    await screen.findByText(/oakfield primary — trial/i)

    await user.click(screen.getByRole("button", { name: /grant 14-day extension/i }))

    await waitFor(() => expect(extendMock).toHaveBeenCalledWith("s1"))
    expect(await screen.findByRole("status")).toHaveTextContent(/extended/i)
    expect(screen.getByText("1 / 1")).toBeInTheDocument()
  })

  it("disables the button once the extension is already used", async () => {
    getMock.mockResolvedValue(detail({ trial_extension_count: 1 }))
    renderScreen()
    const btn = await screen.findByRole("button", { name: /extension already used/i })
    expect(btn).toBeDisabled()
  })

  it("surfaces the 409 when a second extension attempt is refused", async () => {
    const user = userEvent.setup()
    getMock.mockResolvedValue(detail())
    extendMock.mockRejectedValue(new Error("request failed: 409"))
    renderScreen()
    await screen.findByRole("button", { name: /grant 14-day extension/i })

    await user.click(screen.getByRole("button", { name: /grant 14-day extension/i }))
    expect(await screen.findByRole("alert")).toHaveTextContent(/already been used/i)
  })

  it("surfaces the RBAC 403 (permission-bound account management)", async () => {
    const user = userEvent.setup()
    getMock.mockResolvedValue(detail())
    extendMock.mockRejectedValue(new Error("request failed: 403"))
    renderScreen()
    await screen.findByRole("button", { name: /grant 14-day extension/i })

    await user.click(screen.getByRole("button", { name: /grant 14-day extension/i }))
    expect(await screen.findByRole("alert")).toHaveTextContent(/permission/i)
  })

  it("withholds the extend control and offers retry when the load fails", async () => {
    const user = userEvent.setup()
    getMock.mockRejectedValueOnce(new Error("request failed: 500"))
    renderScreen()
    expect(await screen.findByRole("alert")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /grant 14-day extension/i })).not.toBeInTheDocument()

    getMock.mockResolvedValue(detail())
    await user.click(screen.getByRole("button", { name: /retry/i }))
    expect(await screen.findByRole("button", { name: /grant 14-day extension/i })).toBeInTheDocument()
  })

  it("shows 'No active trial' when the school has none yet", async () => {
    getMock.mockResolvedValue(detail({ trial_end_at: null }))
    renderScreen()
    expect(await screen.findByText(/no active trial/i)).toBeInTheDocument()
  })
})
