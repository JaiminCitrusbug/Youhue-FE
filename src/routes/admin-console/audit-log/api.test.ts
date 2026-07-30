import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { adminAuditLogErrorMessage, exportAuditLog, listAuditLog } from "./api"
import { setToken } from "../../../api/client"

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}

function lastCall(fetchMock: ReturnType<typeof vi.fn>): [string, RequestInit] {
  return fetchMock.mock.calls[0] as unknown as [string, RequestInit]
}

describe("audit-log client (FR-20-05)", () => {
  beforeEach(() => setToken("adm-bearer"))
  afterEach(() => {
    vi.unstubAllGlobals()
    setToken(null)
  })

  it("lists the audit log and attaches the admin bearer", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, { entries: [], total: 0, page: 1, page_size: 20 }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const res = await listAuditLog()

    const [url, init] = lastCall(fetchMock)
    expect(url).toBe("/api/v1/admin/audit-log")
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer adm-bearer")
    expect(res.total).toBe(0)
  })

  it("encodes every filter field into the query string", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, { entries: [], total: 0, page: 2, page_size: 20 }),
    )
    vi.stubGlobal("fetch", fetchMock)

    await listAuditLog({
      actorId: "a1", action: "support_access", schoolId: "s1", dateFrom: "2026-07-01",
      page: 2, pageSize: 20,
    })

    const [url] = lastCall(fetchMock)
    expect(url).toBe(
      "/api/v1/admin/audit-log?actor_id=a1&action=support_access&school_id=s1&date_from=2026-07-01&page=2&page_size=20",
    )
  })

  it("omits blank filter fields entirely", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, { entries: [], total: 0, page: 1, page_size: 20 }),
    )
    vi.stubGlobal("fetch", fetchMock)
    await listAuditLog({ actorId: "  ", action: "", schoolId: undefined, dateFrom: "" })
    expect(lastCall(fetchMock)[0]).toBe("/api/v1/admin/audit-log")
  })

  it("exports the filtered set as a CSV blob via the export endpoint", async () => {
    const csv = "at,actor_id,action,target,school_id\n"
    const fetchMock = vi.fn(async () =>
      new Response(csv, { status: 200, headers: { "Content-Type": "text/csv" } }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const blob = await exportAuditLog({ action: "support_access" })

    const [url, init] = lastCall(fetchMock)
    expect(url).toBe("/api/v1/admin/audit-log/export?action=support_access")
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer adm-bearer")
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBe(csv.length)
  })

  it("maps failures to human copy — 403 / generic", () => {
    expect(adminAuditLogErrorMessage(new Error("request failed: 403"))).toMatch(/permission/i)
    expect(adminAuditLogErrorMessage(new Error("request failed: 500"))).toMatch(/something went wrong/i)
    expect(adminAuditLogErrorMessage("not-an-error")).toMatch(/something went wrong/i)
  })
})
