import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  createSeedActivity,
  listSeedActivities,
  reinstateSeedActivity,
  retireSeedActivity,
  seedErrorMessage,
  updateSeedActivity,
} from "./api"
import { setToken } from "../../../api/client"

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}

function lastCall(fetchMock: ReturnType<typeof vi.fn>): [string, RequestInit] {
  return fetchMock.mock.calls[0] as unknown as [string, RequestInit]
}

describe("seed-activities client (FR-19-04)", () => {
  beforeEach(() => setToken("adm-bearer"))
  afterEach(() => {
    vi.unstubAllGlobals()
    setToken(null)
  })

  it("lists with the include_retired flag and attaches the admin bearer", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { activities: [{ id: "a1", title: "Box breathing" }] }))
    vi.stubGlobal("fetch", fetchMock)

    const res = await listSeedActivities(true)

    const [url, init] = lastCall(fetchMock)
    expect(url).toBe("/api/v1/admin/seed-activities?include_retired=true")
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer adm-bearer")
    expect(res).toEqual([{ id: "a1", title: "Box breathing" }])
  })

  it("defaults include_retired to false", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { activities: [] }))
    vi.stubGlobal("fetch", fetchMock)
    await listSeedActivities()
    expect(lastCall(fetchMock)[0]).toBe("/api/v1/admin/seed-activities?include_retired=false")
  })

  it("creates via POST with the JSON body and returns the activity", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { activity: { id: "a9" } }))
    vi.stubGlobal("fetch", fetchMock)

    const res = await createSeedActivity({ title: "Body scan", type: "grounding", age_band: "all", topic: "Calm" })

    const [url, init] = lastCall(fetchMock)
    expect(url).toBe("/api/v1/admin/seed-activities")
    expect(init.method).toBe("POST")
    expect(JSON.parse(init.body as string)).toEqual({
      title: "Body scan",
      type: "grounding",
      age_band: "all",
      topic: "Calm",
    })
    expect(res).toEqual({ id: "a9" })
  })

  it("edits via PATCH /{id} with only the supplied fields", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { activity: { id: "a1", title: "New" } }))
    vi.stubGlobal("fetch", fetchMock)

    const res = await updateSeedActivity("a1", { title: "New" })

    const [url, init] = lastCall(fetchMock)
    expect(url).toBe("/api/v1/admin/seed-activities/a1")
    expect(init.method).toBe("PATCH")
    expect(JSON.parse(init.body as string)).toEqual({ title: "New" })
    expect(res).toEqual({ id: "a1", title: "New" })
  })

  it("retires via DELETE /{id} (soft, returns the retired activity)", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { activity: { id: "a1", active: false } }))
    vi.stubGlobal("fetch", fetchMock)

    const res = await retireSeedActivity("a1")

    const [url, init] = lastCall(fetchMock)
    expect(url).toBe("/api/v1/admin/seed-activities/a1")
    expect(init.method).toBe("DELETE")
    expect(res).toEqual({ id: "a1", active: false })
  })

  it("re-instates via PATCH active:true", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { activity: { id: "a1", active: true } }))
    vi.stubGlobal("fetch", fetchMock)

    await reinstateSeedActivity("a1")

    const [url, init] = lastCall(fetchMock)
    expect(url).toBe("/api/v1/admin/seed-activities/a1")
    expect(init.method).toBe("PATCH")
    expect(JSON.parse(init.body as string)).toEqual({ active: true })
  })

  it("maps a request failure to human copy — including the RBAC 403", () => {
    expect(seedErrorMessage(new Error("request failed: 403"))).toMatch(/permission/i)
    expect(seedErrorMessage(new Error("request failed: 404"))).toMatch(/no longer exists/i)
    expect(seedErrorMessage(new Error("request failed: 422"))).toMatch(/details/i)
    expect(seedErrorMessage(new Error("request failed: 500"))).toMatch(/something went wrong/i)
    expect(seedErrorMessage("not-an-error")).toMatch(/something went wrong/i)
  })
})
