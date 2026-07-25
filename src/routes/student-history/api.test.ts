import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setToken } from "../../api/client"
import { getMyHistory, HistoryApiError } from "./api"

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("student-history client (FR-08-01)", () => {
  beforeEach(() => setToken("student-tok"))
  afterEach(() => vi.unstubAllGlobals())

  it("getMyHistory attaches the bearer and returns moods_over_time/reflections", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, {
        moods_over_time: [{ local_date: "2026-07-01", mood_value: 4 }],
        reflections: [{ local_date: "2026-07-01", reflection_text: "ok day" }],
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const res = await getMyHistory()

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/students/me/history",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer student-tok" }),
      }),
    )
    expect(res.moods_over_time).toEqual([{ local_date: "2026-07-01", mood_value: 4 }])
    expect(res.reflections).toEqual([{ local_date: "2026-07-01", reflection_text: "ok day" }])
  })

  it("surfaces the REAL server detail + status on a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(500, { detail: "Could not resolve your history" })),
    )
    const err = await getMyHistory().catch((e: unknown) => e)
    expect(err).toBeInstanceOf(HistoryApiError)
    expect((err as HistoryApiError).status).toBe(500)
    expect((err as HistoryApiError).message).toBe("Could not resolve your history")
  })

  it("falls back to a generic message when the error body has no detail", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 403 })))
    const err = await getMyHistory().catch((e: unknown) => e)
    expect(err).toBeInstanceOf(HistoryApiError)
    expect((err as HistoryApiError).message).toMatch(/couldn't load your history/i)
  })
})
