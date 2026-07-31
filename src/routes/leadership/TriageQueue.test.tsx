import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as riskApi from "./risk-api"
import type { TriageFlag } from "./risk-api"
import { TriageQueue } from "./TriageQueue"

vi.mock("./risk-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./risk-api")>()
  return { ...actual, getTriageQueue: vi.fn() }
})

const getMock = vi.mocked(riskApi.getTriageQueue)

const FLAG: TriageFlag = {
  flag_id: "f1",
  student_id: "s1",
  student_name: "Zara M.",
  type: "slow_burn",
  risk_score: 0.7,
  created_at: "2026-01-01T08:00:00Z",
}

describe("TriageQueue screen (FR-12-06 · SC-038 · GATE G-9)", () => {
  beforeEach(() => {
    getMock.mockReset()
  })

  it("renders the open triage-band flags from the real, render-only read", async () => {
    getMock.mockResolvedValue({ flags: [FLAG] })
    render(<MemoryRouter><TriageQueue /></MemoryRouter>)
    expect(await screen.findByText("Zara M.")).toBeInTheDocument()
    expect(screen.getByText(/slow-burn/i)).toBeInTheDocument()
    expect(screen.getByText("Triage")).toBeInTheDocument()
  })

  it("shows a distinct empty state, never a bare/broken table, when nothing needs review", async () => {
    getMock.mockResolvedValue({ flags: [] })
    render(<MemoryRouter><TriageQueue /></MemoryRouter>)
    expect(await screen.findByText(/nothing needs review/i)).toBeInTheDocument()
  })

  it("surfaces a load failure (never silently dropped)", async () => {
    getMock.mockRejectedValue(new Error("request failed: 500"))
    render(<MemoryRouter><TriageQueue /></MemoryRouter>)
    expect(await screen.findByText(/could not be loaded/i)).toBeInTheDocument()
  })

  it("is read-only — no control offers an action ON the student (GATE G-9)", async () => {
    getMock.mockResolvedValue({ flags: [FLAG] })
    render(<MemoryRouter><TriageQueue /></MemoryRouter>)
    await screen.findByText("Zara M.")
    // The only control is "View" — pure navigation to the flag's own record (FR-12-09), never an
    // action on the student (no acknowledge/escalate/message-family control exists here).
    const buttons = screen.queryAllByRole("button")
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toHaveTextContent(/view/i)
  })

  it("View navigates to the flag's own record, never a dead control", async () => {
    const { default: userEvent } = await import("@testing-library/user-event")
    getMock.mockResolvedValue({ flags: [FLAG] })
    render(
      <MemoryRouter initialEntries={["/app/triage"]}>
        <Routes>
          <Route path="/app/triage" element={<TriageQueue />} />
          <Route path="/app/triage/:flagId" element={<h1>Flag record page</h1>} />
        </Routes>
      </MemoryRouter>,
    )
    const view = await screen.findByRole("button", { name: /view/i })
    await userEvent.click(view)
    expect(await screen.findByText("Flag record page")).toBeInTheDocument()
  })
})
