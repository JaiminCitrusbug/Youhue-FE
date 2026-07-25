import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { HistoryApiError } from "./api"
import { MyHistoryApp } from "./index"

// FR-08-01 · SC-025 — the student's own history: real moods-over-time + reflections, loading /
// error / empty states, no dead controls (there are none on this read-only screen).

const api = vi.hoisted(() => ({ getMyHistory: vi.fn() }))
vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>()
  return { ...actual, getMyHistory: api.getMyHistory }
})

describe("MyHistoryApp (FR-08-01 · SC-025)", () => {
  it("Scenario 1 — shows the caller's own moods over time and reflections", async () => {
    api.getMyHistory.mockResolvedValue({
      moods_over_time: [
        { local_date: "2026-07-03", mood_value: 4 },
        { local_date: "2026-07-01", mood_value: 2 },
      ],
      reflections: [{ local_date: "2026-07-03", reflection_text: "Great day at school" }],
    })
    render(<MyHistoryApp />)

    await waitFor(() => expect(screen.getByText("Great day at school")).toBeInTheDocument())
    expect(screen.getByText("Good")).toBeInTheDocument()
    expect(screen.getByText("Worried")).toBeInTheDocument()
  })

  it("Scenario 3 — a student with no check-ins sees a clear empty state, not an error", async () => {
    api.getMyHistory.mockResolvedValue({ moods_over_time: [], reflections: [] })
    render(<MyHistoryApp />)

    await waitFor(() => expect(screen.getByText("No check-ins yet")).toBeInTheDocument())
  })

  it("a day with a mood but no reflection shows the mood, not a blank reflection line", async () => {
    api.getMyHistory.mockResolvedValue({
      moods_over_time: [{ local_date: "2026-07-01", mood_value: 3 }],
      reflections: [],
    })
    render(<MyHistoryApp />)

    await waitFor(() => expect(screen.getByText("OK")).toBeInTheDocument())
  })

  it("surfaces a real server error instead of a generic one", async () => {
    api.getMyHistory.mockRejectedValue(new HistoryApiError(500, "Could not resolve your history"))
    render(<MyHistoryApp />)

    await waitFor(() =>
      expect(screen.getByText("Could not resolve your history")).toBeInTheDocument(),
    )
  })

  it("surfaces a generic message for a non-API failure (e.g. a network drop)", async () => {
    api.getMyHistory.mockRejectedValue(new Error("network down"))
    render(<MyHistoryApp />)

    await waitFor(() =>
      expect(screen.getByText("Couldn't load your history. Please try again.")).toBeInTheDocument(),
    )
  })
})
