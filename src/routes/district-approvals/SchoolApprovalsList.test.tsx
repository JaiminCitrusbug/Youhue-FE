import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { SchoolApprovalsList } from "./SchoolApprovalsList"

const api = vi.hoisted(() => ({ getPendingSchools: vi.fn() }))
vi.mock("./api", () => ({ getPendingSchools: api.getPendingSchools }))

const navigateSpy = vi.hoisted(() => vi.fn())
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return { ...actual, useNavigate: () => navigateSpy }
})

function renderList() {
  render(
    <MemoryRouter initialEntries={["/app/district"]}>
      <Routes>
        <Route path="/app/district" element={<SchoolApprovalsList />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("SchoolApprovalsList (FR-02-02 · SC-069)", () => {
  beforeEach(() => {
    api.getPendingSchools.mockReset()
    navigateSpy.mockReset()
  })
  afterEach(() => vi.restoreAllMocks())

  it("shows a loading state, then the queue with a real pending count", async () => {
    api.getPendingSchools.mockResolvedValue({
      schools: [
        { school_id: "s1", name: "St. Aidan's", registrant_email: "h.begum@staidans.sch", created_at: new Date().toISOString() },
        { school_id: "s2", name: "Green Lane", registrant_email: "m.cole@greenlane.sch", created_at: new Date(Date.now() - 86_400_000).toISOString() },
      ],
    })
    renderList()

    expect(screen.getByRole("status")).toHaveTextContent(/loading/i)
    expect(await screen.findByText("St. Aidan's")).toBeInTheDocument()
    expect(screen.getByText("Green Lane")).toBeInTheDocument()
    expect(screen.getByText("h.begum@staidans.sch")).toBeInTheDocument()
    expect(screen.getByText("today")).toBeInTheDocument()
    expect(screen.getByText("yesterday")).toBeInTheDocument()
    // the header count is REAL (2 rows), never a hardcoded fixture number
    expect(screen.getByText(/2 pending your review/i)).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /school approvals/i })).toBeInTheDocument()
  })

  it("shows a genuine empty state when the queue is empty (not a fabricated row)", async () => {
    api.getPendingSchools.mockResolvedValue({ schools: [] })
    renderList()
    expect(await screen.findByText(/no schools waiting/i)).toBeInTheDocument()
    expect(screen.getByText(/0 pending your review/i)).toBeInTheDocument()
  })

  it("withholds the table and offers retry when the load fails", async () => {
    const user = userEvent.setup()
    api.getPendingSchools.mockRejectedValueOnce(new Error("boom"))
    renderList()

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t load/i)
    expect(screen.queryByRole("table")).not.toBeInTheDocument()

    api.getPendingSchools.mockResolvedValue({ schools: [] })
    await user.click(screen.getByRole("button", { name: /retry/i }))
    expect(await screen.findByText(/no schools waiting/i)).toBeInTheDocument()
  })

  it("Review routes to the single-school decision screen for the right school (real navigation)", async () => {
    const user = userEvent.setup()
    api.getPendingSchools.mockResolvedValue({
      schools: [{ school_id: "abc-123", name: "Oakwood Primary", registrant_email: "h@oak.edu", created_at: new Date().toISOString() }],
    })
    renderList()

    await user.click(await screen.findByRole("button", { name: /review/i }))
    expect(navigateSpy).toHaveBeenCalledWith("/app/district/abc-123")
  })

  it("renders a dash, not a fabricated email, when the registrant email is unknown", async () => {
    api.getPendingSchools.mockResolvedValue({
      schools: [{ school_id: "s1", name: "No Email School", registrant_email: null, created_at: new Date().toISOString() }],
    })
    renderList()
    expect(await screen.findByText("—")).toBeInTheDocument()
  })
})
