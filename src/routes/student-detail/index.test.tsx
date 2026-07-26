import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as api from "./api"
import type { StudentDetail, StudentSummary } from "./api"
import { StudentDetailApp } from "./index"

// FR-10-02 · SC-028 — behaviour tests for the student detail drill-in. Every displayed figure
// comes straight from the mocked API response (SRS §13.5 render-not-recompute).

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>()
  return { ...actual, getStudentSummary: vi.fn(), getStudentDetail: vi.fn() }
})

const summaryMock = vi.mocked(api.getStudentSummary)
const detailMock = vi.mocked(api.getStudentDetail)

const SUMMARY: StudentSummary = {
  id: "s1", display_name: "Amy", age_band: "b8_11", school_id: "sch1",
}
const DETAIL: StudentDetail = {
  mood_history: [{ local_date: "2026-07-21", mood_value: 4 }],
  reflections: [{ local_date: "2026-07-21", reflection_text: "Good day" }],
  participation_rate: 0.4286,
}

function renderAt(studentId = "s1") {
  render(
    <MemoryRouter initialEntries={[`/app/dashboard/students/${studentId}`]}>
      <Routes>
        <Route path="/app/dashboard/students/:studentId" element={<StudentDetailApp />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("StudentDetailApp (FR-10-02 · SC-028)", () => {
  beforeEach(() => {
    summaryMock.mockReset().mockResolvedValue(SUMMARY)
    detailMock.mockReset().mockResolvedValue(DETAIL)
  })

  it("Scenario 1 — shows the student's mood history, reflections and participation", async () => {
    renderAt()
    expect(await screen.findByText("Amy")).toBeInTheDocument()
    expect(screen.getByText("Good day")).toBeInTheDocument()
    expect(screen.getByText("43%")).toBeInTheDocument() // round(0.4286 * 100)
    await waitFor(() => expect(detailMock).toHaveBeenCalledWith("s1"))
  })

  it("Scenario 2 — participation renders the server figure, never a client-recompute", async () => {
    detailMock.mockResolvedValue({ ...DETAIL, participation_rate: 0.6 })
    renderAt()
    expect(await screen.findByText("60%")).toBeInTheDocument()
  })

  it("shows a real empty state before the student has any check-ins", async () => {
    detailMock.mockResolvedValue({ mood_history: [], reflections: [], participation_rate: 0 })
    renderAt()
    expect(await screen.findByText("No check-ins yet")).toBeInTheDocument()
    expect(screen.getByText("No reflections yet")).toBeInTheDocument()
  })

  it("surfaces a real, specific error and never crashes on a 403 (out-of-scope student)", async () => {
    const { StudentDetailApiError } = api
    detailMock.mockRejectedValue(new StudentDetailApiError(403, "Access denied"))
    renderAt()
    expect(await screen.findByRole("alert")).toHaveTextContent(/access denied/i)
  })
})
