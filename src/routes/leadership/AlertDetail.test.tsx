import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as riskApi from "./risk-api"
import type { FlagTimelineEvent } from "./risk-api"
import { AlertDetail } from "./AlertDetail"

vi.mock("./risk-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./risk-api")>()
  return { ...actual, getFlagEvents: vi.fn() }
})

const getMock = vi.mocked(riskApi.getFlagEvents)

const EVENTS: FlagTimelineEvent[] = [
  { type: "alerted", actor: null, at: "2026-01-01T08:47:00Z" },
  { type: "viewed", actor: "lead@oakwood.edu", at: "2026-01-01T08:55:00Z" },
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

describe("AlertDetail screen (FR-12-09 · SC-039)", () => {
  beforeEach(() => {
    getMock.mockReset()
  })

  it("renders the immutable timeline from the real, render-only read", async () => {
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

  it("is render-only — no edit/delete control on the immutable record", async () => {
    getMock.mockResolvedValue({ events: EVENTS })
    renderAt("f4")
    await screen.findByText("Alerted")
    expect(screen.queryAllByRole("button")).toHaveLength(0)
  })
})
