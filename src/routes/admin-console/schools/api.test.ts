import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  adminSchoolErrorMessage,
  extendTrial,
  getSchool,
  listSchools,
  openSupportAccess,
  updateAccount,
} from "./api"
import { setToken } from "../../../api/client"

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}

function lastCall(fetchMock: ReturnType<typeof vi.fn>): [string, RequestInit] {
  return fetchMock.mock.calls[0] as unknown as [string, RequestInit]
}

describe("school-admin client (FR-19-02)", () => {
  beforeEach(() => setToken("adm-bearer"))
  afterEach(() => {
    vi.unstubAllGlobals()
    setToken(null)
  })

  it("lists schools and attaches the admin bearer", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { schools: [{ id: "s1", name: "Oakfield", tier: "free", status: "active" }], count: 1 }))
    vi.stubGlobal("fetch", fetchMock)

    const res = await listSchools()

    const [url, init] = lastCall(fetchMock)
    expect(url).toBe("/api/v1/admin/schools")
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer adm-bearer")
    expect(res.count).toBe(1)
  })

  it("passes a trimmed, encoded search query", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { schools: [], count: 0 }))
    vi.stubGlobal("fetch", fetchMock)
    await listSchools("  river side ")
    expect(lastCall(fetchMock)[0]).toBe("/api/v1/admin/schools?q=river%20side")
  })

  it("omits the query param when the search is blank", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { schools: [], count: 0 }))
    vi.stubGlobal("fetch", fetchMock)
    await listSchools("   ")
    expect(lastCall(fetchMock)[0]).toBe("/api/v1/admin/schools")
  })

  it("reads a single school", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, {
        id: "s1", name: "Oakfield", tier: "premium", status: "active", timezone: "UTC",
        subscription_state: "trial", trial_end_at: "2026-08-06T00:00:00Z", trial_extension_count: 0,
      }),
    )
    vi.stubGlobal("fetch", fetchMock)
    const res = await getSchool("s1")
    expect(lastCall(fetchMock)[0]).toBe("/api/v1/admin/schools/s1")
    expect(res.trial_extension_count).toBe(0)
  })

  it("extends the trial via PATCH { action: extend_trial }", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, { action: "extend_trial", school: { id: "s1", trial_extension_count: 1 } }),
    )
    vi.stubGlobal("fetch", fetchMock)
    const res = await extendTrial("s1")
    const [url, init] = lastCall(fetchMock)
    expect(url).toBe("/api/v1/admin/schools/s1")
    expect(init.method).toBe("PATCH")
    expect(JSON.parse(init.body as string)).toEqual({ action: "extend_trial" })
    expect(res.school.trial_extension_count).toBe(1)
  })

  it("a second extend_trial surfaces the 409 as human copy", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(409, { detail: "extension already used" }))
    vi.stubGlobal("fetch", fetchMock)
    await expect(extendTrial("s1")).rejects.toThrow(/409/)
  })

  it("updates the account via PATCH { action: update_account, ... }", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, { action: "update_account", school: { id: "s1", tier: "premium" } }),
    )
    vi.stubGlobal("fetch", fetchMock)
    await updateAccount("s1", { tier: "premium" })
    const [, init] = lastCall(fetchMock)
    expect(JSON.parse(init.body as string)).toEqual({ action: "update_account", tier: "premium" })
  })

  it("opens support access via PATCH { action: support_access, reason }", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, { action: "support_access", school: { id: "s1" } }),
    )
    vi.stubGlobal("fetch", fetchMock)
    await openSupportAccess("s1", "ticket 4821")
    const [, init] = lastCall(fetchMock)
    expect(JSON.parse(init.body as string)).toEqual({ action: "support_access", reason: "ticket 4821" })
  })

  it("maps failures to human copy — 403 / 409 / 404 / 422 / generic", () => {
    expect(adminSchoolErrorMessage(new Error("request failed: 403"))).toMatch(/permission/i)
    expect(adminSchoolErrorMessage(new Error("request failed: 409"))).toMatch(/already been used/i)
    expect(adminSchoolErrorMessage(new Error("request failed: 404"))).toMatch(/no longer exists/i)
    expect(adminSchoolErrorMessage(new Error("request failed: 422"))).toMatch(/reason is required/i)
    expect(adminSchoolErrorMessage(new Error("request failed: 500"))).toMatch(/something went wrong/i)
    expect(adminSchoolErrorMessage("not-an-error")).toMatch(/something went wrong/i)
  })
})
