import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as api from "./api"
import type { PlatformStats } from "./api"
import { AdminStats } from "./AdminStats"

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>()
  return { ...actual, getPlatformStats: vi.fn() }
})

const getMock = vi.mocked(api.getPlatformStats)

const ACTIVE_STATS: PlatformStats = {
  schools: 142, active_trials: 37, checkin_volume: 41208, alert_volume: 96,
}
const EMPTY_STATS: PlatformStats = {
  schools: 0, active_trials: 0, checkin_volume: 0, alert_volume: 0,
}

describe("AdminStats screen (FR-19-07 · SC-074)", () => {
  beforeEach(() => {
    getMock.mockReset()
  })

  it("renders real platform-wide counts from the read-only aggregate endpoint", async () => {
    getMock.mockResolvedValue(ACTIVE_STATS)
    render(<AdminStats />)
    expect(await screen.findByText("142")).toBeInTheDocument()
    expect(screen.getByText("37")).toBeInTheDocument()
    expect(screen.getByText("41208")).toBeInTheDocument()
    expect(screen.getByText("96")).toBeInTheDocument()
  })

  it("shows a distinct empty-state caption per stat before there is data (NEG — not an error)", async () => {
    getMock.mockResolvedValue(EMPTY_STATS)
    render(<AdminStats />)
    await screen.findByText("Schools")
    expect(screen.getByText("No schools yet")).toBeInTheDocument()
    expect(screen.getByText("No active trials yet")).toBeInTheDocument()
    expect(screen.getByText("No check-ins yet")).toBeInTheDocument()
    expect(screen.getByText("No alerts yet")).toBeInTheDocument()
  })

  it("surfaces a load failure, never a silent gap (403 without permission)", async () => {
    getMock.mockRejectedValue(new Error("request failed: 403"))
    render(<AdminStats />)
    expect(await screen.findByText(/don't have permission/i)).toBeInTheDocument()
  })
})
