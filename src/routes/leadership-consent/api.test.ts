import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { recordConsent } from "./api"
import { getToken, setToken } from "../../api/client"

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}

describe("recordConsent (FR-20-06 client)", () => {
  beforeEach(() => setToken(null))
  afterEach(() => vi.unstubAllGlobals())

  it("POSTs { status: 'verified' } by default with the staff bearer", async () => {
    setToken("leadership-bearer")
    const fetchMock = vi.fn(async () => jsonResponse(200, { status: "verified" }))
    vi.stubGlobal("fetch", fetchMock)

    const res = await recordConsent("student-1")

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/students/student-1/consent",
      expect.objectContaining({ method: "POST" }),
    )
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect((call[1].headers as Record<string, string>).Authorization).toBe("Bearer leadership-bearer")
    expect(JSON.parse(call[1].body as string)).toEqual({ status: "verified" })
    expect(res).toEqual({ status: "verified" })
  })

  it("sends no Authorization header when there is no session token", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { status: "verified" }))
    vi.stubGlobal("fetch", fetchMock)

    await recordConsent("student-1")

    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect((call[1].headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it("surfaces 403 as a generic permission message (cross-school or non-leadership role)", async () => {
    setToken("t")
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(403, { detail: "forbidden" })))
    await expect(recordConsent("student-1")).rejects.toThrow(/permission/i)
    // a 403 is NOT a session expiry — the token survives
    expect(getToken()).toBe("t")
  })

  it("clears the stale token and surfaces a permission message on 401", async () => {
    setToken("t")
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(401, {})))
    await expect(recordConsent("student-1")).rejects.toThrow(/permission/i)
    expect(getToken()).toBeNull()
  })

  it("surfaces 422 as an invalid-record message", async () => {
    setToken("t")
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(422, { detail: "bad" })))
    await expect(recordConsent("student-1")).rejects.toThrow(/valid/i)
  })

  it("surfaces a 500 as a generic error", async () => {
    setToken("t")
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(500, { error: "boom" })))
    await expect(recordConsent("student-1")).rejects.toThrow(/couldn.t record/i)
  })
})
