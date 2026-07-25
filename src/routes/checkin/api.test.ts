import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setToken } from "../../api/client"
import { CheckInApiError, getCheckInConfig, submitCheckIn, syncCheckIn } from "./api"

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("check-in client (FR-04-01 + FR-04-03)", () => {
  beforeEach(() => setToken("student-tok"))
  afterEach(() => vi.unstubAllGlobals())

  it("getCheckInConfig attaches the bearer and returns mode/mood_set/read_aloud", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, { mode: "simple", mood_set: [1, 3, 5], read_aloud: true }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const res = await getCheckInConfig()

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/check-ins/config",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer student-tok" }),
      }),
    )
    expect(res.mode).toBe("simple")
    expect(res.mood_set).toEqual([1, 3, 5])
    expect(res.read_aloud).toBe(true)
  })

  it("submitCheckIn posts mood_value and omits reflection_text when blank", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(201, { checkin_id: "c1", activity_offer: null }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const res = await submitCheckIn(4)

    const [, opts] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(opts.body as string)).toEqual({ mood_value: 4 })
    expect(res.checkin_id).toBe("c1")
    expect(res.activity_offer).toBeNull()
  })

  it("submitCheckIn includes reflection_text when provided", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(201, { checkin_id: "c2", activity_offer: null }),
    )
    vi.stubGlobal("fetch", fetchMock)

    await submitCheckIn(2, "a rough day")

    const [, opts] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(opts.body as string)).toEqual({ mood_value: 2, reflection_text: "a rough day" })
  })

  it.each([
    [403, "check-in is not open right now"],
    [409, "You already checked in today"],
    [422, "A reflection is required before this check-in can be completed"],
  ])("surfaces the REAL server detail + status for HTTP %s", async (status, detail) => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(status, { detail })))
    const err = await submitCheckIn(4).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(CheckInApiError)
    expect((err as CheckInApiError).status).toBe(status)
    expect((err as CheckInApiError).message).toBe(detail)
  })

  it("falls back to a generic message when the error body has no detail", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 500 })))
    const err = await submitCheckIn(4).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(CheckInApiError)
    expect((err as CheckInApiError).message).toMatch(/something went wrong/i)
  })

  // ---- FR-04-06 — syncCheckIn (offline sync, client_entry_id idempotency key) --------------------

  it("syncCheckIn posts client_entry_id + mood_value and omits reflection_text when blank", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(201, { checkin_id: "c3", activity_offer: null }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const res = await syncCheckIn("entry-1", 4)

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/check-ins/sync",
      expect.objectContaining({ method: "POST" }),
    )
    const [, opts] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(opts.body as string)).toEqual({
      client_entry_id: "entry-1", mood_value: 4,
    })
    expect(res.checkin_id).toBe("c3")
  })

  it("syncCheckIn includes reflection_text when provided", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(201, { checkin_id: "c4", activity_offer: null })),
    )
    await syncCheckIn("entry-2", 2, "offline reflection")

    const fetchMock = vi.mocked(fetch)
    const [, opts] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(opts.body as string)).toEqual({
      client_entry_id: "entry-2", mood_value: 2, reflection_text: "offline reflection",
    })
  })

  it("syncCheckIn on a retried entry_id returns 200 with the existing entry, not an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(200, { checkin_id: "c3", activity_offer: null })),
    )
    const res = await syncCheckIn("entry-1", 4)
    expect(res.checkin_id).toBe("c3")
  })

  it("syncCheckIn surfaces a real 409 for a different check-in already existing that day", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(409, { detail: "You already checked in today" })),
    )
    const err = await syncCheckIn("entry-3", 4).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(CheckInApiError)
    expect((err as CheckInApiError).status).toBe(409)
  })
})
