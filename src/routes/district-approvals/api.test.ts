import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { decideSchool, getPendingSchools, getSchoolDetail } from "./api"
import { getToken, setToken } from "../../api/client"

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}

describe("getPendingSchools (FR-02-02 client)", () => {
  beforeEach(() => setToken(null))
  afterEach(() => vi.unstubAllGlobals())

  it("GETs with the staff bearer and returns the queue", async () => {
    setToken("district-bearer")
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, { schools: [{ school_id: "s1", name: "Oakwood", registrant_email: "h@o.edu", created_at: "2026-01-01T00:00:00Z" }] }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const res = await getPendingSchools()

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/schools/pending",
      expect.objectContaining({ method: "GET" }),
    )
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect((call[1].headers as Record<string, string>).Authorization).toBe("Bearer district-bearer")
    expect(res.schools).toHaveLength(1)
  })

  it("sends no Authorization header when there is no session token", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { schools: [] }))
    vi.stubGlobal("fetch", fetchMock)
    await getPendingSchools()
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect((call[1].headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it("surfaces 403 as a generic permission message and keeps the token", async () => {
    setToken("t")
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(403, { detail: "forbidden" })))
    await expect(getPendingSchools()).rejects.toThrow(/permission/i)
    expect(getToken()).toBe("t")
  })

  it("clears the stale token and surfaces a permission message on 401", async () => {
    setToken("t")
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(401, {})))
    await expect(getPendingSchools()).rejects.toThrow(/permission/i)
    expect(getToken()).toBeNull()
  })

  it("throws a generic load error on a 500", async () => {
    setToken("t")
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(500, { detail: "boom" })))
    await expect(getPendingSchools()).rejects.toThrow(/couldn.t load/i)
  })
})

describe("getSchoolDetail (FR-02-02 client)", () => {
  beforeEach(() => setToken(null))
  afterEach(() => vi.unstubAllGlobals())

  it("GETs the single school and returns its detail", async () => {
    setToken("t")
    const body = {
      school_id: "s1", name: "Oakwood", status: "pending",
      registrant_email: "h@o.edu", student_count: 0, created_at: "2026-01-01T00:00:00Z",
    }
    const fetchMock = vi.fn(async () => jsonResponse(200, body))
    vi.stubGlobal("fetch", fetchMock)

    const res = await getSchoolDetail("s1")

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/schools/s1",
      expect.objectContaining({ method: "GET" }),
    )
    expect(res).toEqual(body)
  })

  it("surfaces 404 as a not-found message", async () => {
    setToken("t")
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(404, { detail: "School not found" })))
    await expect(getSchoolDetail("nope")).rejects.toThrow(/could not be found/i)
  })

  it("surfaces 403 as a generic permission message", async () => {
    setToken("t")
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(403, { detail: "forbidden" })))
    await expect(getSchoolDetail("s1")).rejects.toThrow(/permission/i)
  })
})

describe("decideSchool (FR-02-02 client)", () => {
  beforeEach(() => setToken(null))
  afterEach(() => vi.unstubAllGlobals())

  it("POSTs { decision } with the staff bearer and returns the outcome", async () => {
    setToken("district-bearer")
    const fetchMock = vi.fn(async () => jsonResponse(200, { school_id: "s1", status: "active" }))
    vi.stubGlobal("fetch", fetchMock)

    const res = await decideSchool("s1", "approve")

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/schools/s1/decision",
      expect.objectContaining({ method: "POST" }),
    )
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect((call[1].headers as Record<string, string>).Authorization).toBe("Bearer district-bearer")
    expect(JSON.parse(call[1].body as string)).toEqual({ decision: "approve" })
    expect(res).toEqual({ school_id: "s1", status: "active" })
  })

  it("surfaces 409 as an already-decided message", async () => {
    setToken("t")
    vi.stubGlobal("fetch", vi.fn(async () =>
      jsonResponse(409, { detail: { code: "not_pending", message: "already decided" } }),
    ))
    await expect(decideSchool("s1", "reject")).rejects.toThrow(/already been decided/i)
  })

  it("surfaces 404 as a not-found message", async () => {
    setToken("t")
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(404, { detail: "School not found" })))
    await expect(decideSchool("nope", "approve")).rejects.toThrow(/could not be found/i)
  })

  it("surfaces 403 as a generic permission message and keeps the token", async () => {
    setToken("t")
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(403, { detail: "forbidden" })))
    await expect(decideSchool("s1", "approve")).rejects.toThrow(/permission/i)
    expect(getToken()).toBe("t")
  })

  it("clears the stale token and surfaces a permission message on 401", async () => {
    setToken("t")
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(401, {})))
    await expect(decideSchool("s1", "approve")).rejects.toThrow(/permission/i)
    expect(getToken()).toBeNull()
  })

  it("throws a generic error on a 500", async () => {
    setToken("t")
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(500, { detail: "boom" })))
    await expect(decideSchool("s1", "approve")).rejects.toThrow(/couldn.t record/i)
  })
})
