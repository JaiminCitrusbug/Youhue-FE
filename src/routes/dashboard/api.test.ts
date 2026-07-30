import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setToken } from "../../api/client"
import { DashboardApiError, getClassDashboard, getClassRoster, getMyClasses } from "./api"

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("dashboard client (FR-10-01)", () => {
  beforeEach(() => setToken("staff-tok"))
  afterEach(() => vi.unstubAllGlobals())

  it("getMyClasses attaches the bearer and returns the classes array", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { classes: [{ id: "c1", name: "3A" }] }))
    vi.stubGlobal("fetch", fetchMock)

    const res = await getMyClasses()

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/classes/mine",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer staff-tok" }) }),
    )
    expect(res).toEqual([{ id: "c1", name: "3A" }])
  })

  it("getClassDashboard fetches the given class id and returns the server-owned figures", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, {
        class_id: "c1", class_name: "3A", mood_index: 7.2, trend: "down",
        as_of: "2026-07-22T09:10:00Z", live: true, period: "this_week", timezone: "UTC",
        data_state: "has_data",
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const res = await getClassDashboard("c1")

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/classes/c1/dashboard", expect.anything())
    expect(res.mood_index).toBe(7.2)
    expect(res.trend).toBe("down")
    expect(res.data_state).toBe("has_data")  // FR-10-05: server-owned, rendered as-is
  })

  it("surfaces the REAL server detail + status on a non-2xx response (e.g. 403 cross-scope)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(403, { detail: "Access denied" })))
    const err = await getClassDashboard("not-mine").catch((e: unknown) => e)
    expect(err).toBeInstanceOf(DashboardApiError)
    expect((err as DashboardApiError).status).toBe(403)
    expect((err as DashboardApiError).message).toBe("Access denied")
  })

  it("falls back to a generic message when the error body has no detail", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 500 })))
    const err = await getMyClasses().catch((e: unknown) => e)
    expect(err).toBeInstanceOf(DashboardApiError)
    expect((err as DashboardApiError).message).toMatch(/something went wrong/i)
  })

  it("getClassRoster (FR-10-02) fetches the given class id and unwraps the students array", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, { students: [{ id: "s1", display_name: "Amy" }] }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const res = await getClassRoster("c1")

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/classes/c1/roster", expect.anything())
    expect(res).toEqual([{ id: "s1", display_name: "Amy" }])
  })
})
