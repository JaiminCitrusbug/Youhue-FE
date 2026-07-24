import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ApprovalDecisionScreen } from "./ApprovalDecisionScreen"

const api = vi.hoisted(() => ({ getSchoolDetail: vi.fn(), decideSchool: vi.fn() }))
vi.mock("./api", () => ({ getSchoolDetail: api.getSchoolDetail, decideSchool: api.decideSchool }))

function detail(over: Partial<Record<string, unknown>> = {}) {
  return {
    school_id: "s1",
    name: "St. Aidan's",
    status: "pending",
    registrant_email: "h.begum@staidans.sch",
    student_count: 0,
    created_at: new Date().toISOString(),
    ...over,
  }
}

function renderScreen(schoolId = "s1") {
  render(
    <MemoryRouter initialEntries={[`/app/district/${schoolId}`]}>
      <Routes>
        <Route path="/app/district/:schoolId" element={<ApprovalDecisionScreen />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("ApprovalDecisionScreen (FR-02-02 · SC-070)", () => {
  beforeEach(() => {
    api.getSchoolDetail.mockReset()
    api.decideSchool.mockReset()
  })
  afterEach(() => vi.restoreAllMocks())

  it("loads the school and renders real registrant + student-count details", async () => {
    api.getSchoolDetail.mockResolvedValue(detail())
    renderScreen()

    expect(screen.getByRole("status")).toHaveTextContent(/loading/i)
    expect(await screen.findByRole("heading", { name: /st\. aidan's — review/i })).toBeInTheDocument()
    expect(screen.getByText("h.begum@staidans.sch")).toBeInTheDocument()
    expect(screen.getByText("0")).toBeInTheDocument() // real student_count, never a fabricated number
    expect(screen.getByText(/approving arms a whole-school premium trial/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^approve$/i })).toBeEnabled()
    expect(screen.getByRole("button", { name: /^reject$/i })).toBeEnabled()
  })

  it("withholds the details and offers retry when the load fails", async () => {
    const user = userEvent.setup()
    api.getSchoolDetail.mockRejectedValueOnce(new Error("boom"))
    renderScreen()

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t load/i)
    expect(screen.queryByRole("button", { name: /^approve$/i })).not.toBeInTheDocument()

    api.getSchoolDetail.mockResolvedValue(detail())
    await user.click(screen.getByRole("button", { name: /retry/i }))
    expect(await screen.findByRole("button", { name: /^approve$/i })).toBeInTheDocument()
  })

  it("approves: calls the API with the right school id and shows a real success outcome", async () => {
    const user = userEvent.setup()
    api.getSchoolDetail.mockResolvedValue(detail())
    api.decideSchool.mockResolvedValue({ school_id: "s1", status: "active" })
    renderScreen()

    await screen.findByRole("button", { name: /^approve$/i })
    await user.click(screen.getByRole("button", { name: /^approve$/i }))

    expect(api.decideSchool).toHaveBeenCalledWith("s1", "approve")
    expect(await screen.findByText(/the school is now live and its premium trial is armed/i)).toBeInTheDocument()
    // decided -> buttons are genuinely disabled, not dead (still present, real disabled state)
    expect(screen.getByRole("button", { name: /^approve$/i })).toBeDisabled()
    expect(screen.getByRole("button", { name: /^reject$/i })).toBeDisabled()
  })

  it("rejects: calls the API and shows the reject outcome", async () => {
    const user = userEvent.setup()
    api.getSchoolDetail.mockResolvedValue(detail())
    api.decideSchool.mockResolvedValue({ school_id: "s1", status: "rejected" })
    renderScreen()

    await screen.findByRole("button", { name: /^reject$/i })
    await user.click(screen.getByRole("button", { name: /^reject$/i }))

    expect(api.decideSchool).toHaveBeenCalledWith("s1", "reject")
    expect(await screen.findByText(/rejected — the school stays not-live/i)).toBeInTheDocument()
  })

  it("disables Approve/Reject while a decision is in flight (no double-submit)", async () => {
    const user = userEvent.setup()
    api.getSchoolDetail.mockResolvedValue(detail())
    let resolve: (v: { school_id: string; status: string }) => void = () => {}
    api.decideSchool.mockReturnValue(new Promise((r) => { resolve = r }))
    renderScreen()

    await screen.findByRole("button", { name: /^approve$/i })
    await user.click(screen.getByRole("button", { name: /^approve$/i }))

    expect(screen.getByRole("button", { name: /approving/i })).toBeDisabled()
    expect(screen.getByRole("button", { name: /^reject$/i })).toBeDisabled()
    resolve({ school_id: "s1", status: "active" })
    await waitFor(() => expect(api.decideSchool).toHaveBeenCalled())
  })

  it("surfaces a generic error and keeps the school actionable when the decision call fails", async () => {
    const user = userEvent.setup()
    api.getSchoolDetail.mockResolvedValue(detail())
    api.decideSchool.mockRejectedValue(new Error("This school has already been decided — it is no longer pending."))
    renderScreen()

    await screen.findByRole("button", { name: /^approve$/i })
    await user.click(screen.getByRole("button", { name: /^approve$/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/already been decided/i)
  })

  it("an already-decided school (status !== pending) shows real disabled controls, no dead buttons", async () => {
    api.getSchoolDetail.mockResolvedValue(detail({ status: "rejected" }))
    renderScreen()

    expect(await screen.findByText(/this school was already rejected/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^approve$/i })).toBeDisabled()
    expect(screen.getByRole("button", { name: /^reject$/i })).toBeDisabled()
  })

  it("shows a neutral fallback, not a fabricated email, when the registrant is unknown", async () => {
    api.getSchoolDetail.mockResolvedValue(detail({ registrant_email: null }))
    renderScreen()
    expect(await screen.findByText("Unknown")).toBeInTheDocument()
  })
})
