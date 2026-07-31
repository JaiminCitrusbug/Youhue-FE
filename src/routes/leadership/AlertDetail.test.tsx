import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as riskApi from "./risk-api"
import type { FlagTimelineEvent } from "./risk-api"
import { AlertDetail } from "./AlertDetail"

// Default mock: leadership. Leadership can view this timeline (ROLE_ROUTES.flagTimeline) but is
// not the involved teacher the BE restricts guided-response reads to (ROLE_ROUTES.guidedResponse),
// so "Guided response" is correctly absent — same posture as every other existing test below.
const mockUser = vi.hoisted(() => ({
  current: { subject_id: "u1", kind: "staff", role: "leadership", school_id: "sch1" },
}))
vi.mock("../../app/AuthContext", () => ({
  useAuth: () => ({ user: mockUser.current, loading: false, refresh: vi.fn(), signOut: vi.fn() }),
}))

vi.mock("./risk-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./risk-api")>()
  return { ...actual, getFlagEvents: vi.fn(), acknowledgeAlert: vi.fn() }
})

const getMock = vi.mocked(riskApi.getFlagEvents)
const ackMock = vi.mocked(riskApi.acknowledgeAlert)

const EVENTS: FlagTimelineEvent[] = [
  { type: "alerted", actor: null, at: "2026-01-01T08:47:00Z" },
  { type: "viewed", actor: "lead@oakwood.edu", at: "2026-01-01T08:55:00Z" },
]

const ESCALATED_EVENTS: FlagTimelineEvent[] = [
  { type: "alerted", actor: null, at: "2026-01-01T08:47:00Z" },
  { type: "escalated", actor: "pastoral@oakwood.edu", at: "2026-01-01T09:02:00Z" },
]

function renderAt(flagId: string) {
  return render(
    <MemoryRouter initialEntries={[`/app/triage/${flagId}`]}>
      <Routes>
        <Route path="/app/triage/:flagId" element={<AlertDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("AlertDetail screen (FR-12-09 · SC-039 timeline + FR-12-08 · GATE G-8 acknowledge/escalate)", () => {
  beforeEach(() => {
    getMock.mockReset()
    ackMock.mockReset()
    mockUser.current = { subject_id: "u1", kind: "staff", role: "leadership", school_id: "sch1" }
  })

  it("renders the immutable timeline from the real read", async () => {
    getMock.mockResolvedValue({ events: EVENTS })
    renderAt("f1")
    expect(await screen.findByText("Alerted")).toBeInTheDocument()
    expect(screen.getByText("Viewed")).toBeInTheDocument()
    expect(screen.getByText("System")).toBeInTheDocument() // null actor (alerted, system-recorded)
    expect(screen.getByText("lead@oakwood.edu")).toBeInTheDocument()
    expect(screen.getByText(/immutable/i)).toBeInTheDocument()
    expect(getMock).toHaveBeenCalledWith("f1")
  })

  it("shows a distinct empty state, never a bare/broken card, when no events exist yet", async () => {
    getMock.mockResolvedValue({ events: [] })
    renderAt("f2")
    expect(await screen.findByText(/no events recorded yet/i)).toBeInTheDocument()
  })

  it("surfaces a load failure (never silently dropped)", async () => {
    getMock.mockRejectedValue(new Error("request failed: 403"))
    renderAt("f3")
    expect(await screen.findByText(/could not be loaded/i)).toBeInTheDocument()
  })

  it("the timeline itself stays append-only — no edit/delete control on any entry", async () => {
    getMock.mockResolvedValue({ events: EVENTS })
    renderAt("f4")
    await screen.findByText("Alerted")
    // exactly one real control exists on this screen: Acknowledge — never a per-entry edit/delete.
    expect(screen.getAllByRole("button")).toHaveLength(1)
    expect(screen.getByRole("button", { name: /acknowledge/i })).toBeInTheDocument()
  })

  it("Acknowledge is wired to the real endpoint, not a dead control (FR-12-08 delta)", async () => {
    getMock.mockResolvedValue({ events: EVENTS })
    ackMock.mockResolvedValue({ flag_id: "f5", status: "acknowledged" })
    renderAt("f5")
    const button = await screen.findByRole("button", { name: /^acknowledge$/i })
    fireEvent.click(button)
    expect(ackMock).toHaveBeenCalledWith("f5")
    expect(await screen.findByRole("button", { name: /acknowledged/i })).toBeDisabled()
  })

  it("surfaces an already-acknowledged (409) conflict without wiping the loaded timeline", async () => {
    getMock.mockResolvedValue({ events: EVENTS })
    ackMock.mockRejectedValue(new Error("request failed: 409"))
    renderAt("f6")
    const button = await screen.findByRole("button", { name: /^acknowledge$/i })
    fireEvent.click(button)
    expect(await screen.findByText(/already been acknowledged/i)).toBeInTheDocument()
    expect(screen.getByText("Alerted")).toBeInTheDocument() // timeline still intact
  })

  it("shows the Escalated badge when the timeline carries an escalated event (GATE G-8 state)", async () => {
    getMock.mockResolvedValue({ events: ESCALATED_EVENTS })
    renderAt("f7")
    await screen.findByText("Alerted")
    const heading = screen.getByRole("heading", { name: /flag record/i })
    expect(within(heading).getByText("Escalated")).toBeInTheDocument()
    // no manual "Escalate" control — the DoD's escalation is a scheduled/background process
    expect(screen.queryByRole("button", { name: /escalate/i })).not.toBeInTheDocument()
  })

  it("does not show the Escalated badge when no escalated event has occurred", async () => {
    getMock.mockResolvedValue({ events: EVENTS })
    renderAt("f8")
    await screen.findByText("Alerted")
    const heading = screen.getByRole("heading", { name: /flag record/i })
    expect(within(heading).queryByText("Escalated")).not.toBeInTheDocument()
  })

  describe("Guided response nav (2026-07-31 wiring fix)", () => {
    it("teacher sees a real 'Guided response' control alongside Acknowledge, never a dead one", async () => {
      const { default: userEvent } = await import("@testing-library/user-event")
      mockUser.current = { subject_id: "u9", kind: "staff", role: "teacher", school_id: "sch1" }
      getMock.mockResolvedValue({ events: EVENTS })
      render(
        <MemoryRouter initialEntries={["/app/triage/f9"]}>
          <Routes>
            <Route path="/app/triage/:flagId" element={<AlertDetail />} />
            <Route path="/app/flags/:flagId/guidance" element={<h1>Guided response page</h1>} />
          </Routes>
        </MemoryRouter>,
      )
      await screen.findByText("Alerted")
      const guidedResponse = screen.getByRole("button", { name: /guided response/i })
      await userEvent.click(guidedResponse)
      expect(await screen.findByText("Guided response page")).toBeInTheDocument()
    })

    it("leadership (not the involved teacher) does not see 'Guided response' — omitted, not a dead control", async () => {
      getMock.mockResolvedValue({ events: EVENTS })
      renderAt("f10")
      await screen.findByText("Alerted")
      expect(screen.queryByRole("button", { name: /guided response/i })).not.toBeInTheDocument()
    })
  })
})
