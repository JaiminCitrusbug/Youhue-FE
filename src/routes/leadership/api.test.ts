import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  deactivateStaff,
  getSettings,
  leadershipErrorMessage,
  listStaff,
  updateAccessWindow,
  updateAlertRouting,
  updateConcernWords,
} from "./api"
import { setToken } from "../../api/client"

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}

function lastCall(fetchMock: ReturnType<typeof vi.fn>): [string, RequestInit] {
  return fetchMock.mock.calls[0] as unknown as [string, RequestInit]
}

describe("leadership hub client (FR-16-02)", () => {
  beforeEach(() => setToken("lead-bearer"))
  afterEach(() => {
    vi.unstubAllGlobals()
    setToken(null)
  })

  it("lists staff and attaches the bearer", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, { staff: [{ id: "st1", email: "a@b.edu", role: "teacher", status: "active", created_at: "2026-01-01T00:00:00Z" }] }),
    )
    vi.stubGlobal("fetch", fetchMock)
    const res = await listStaff("sch1")
    const [url, init] = lastCall(fetchMock)
    expect(url).toBe("/api/v1/schools/sch1/staff")
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer lead-bearer")
    expect(res.staff).toHaveLength(1)
  })

  it("deactivates a staff member via PATCH { status: deactivated }", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, { staff: { id: "st1", email: "a@b.edu", role: "teacher", status: "deactivated", created_at: "x" } }),
    )
    vi.stubGlobal("fetch", fetchMock)
    const res = await deactivateStaff("sch1", "st1")
    const [url, init] = lastCall(fetchMock)
    expect(url).toBe("/api/v1/schools/sch1/staff/st1")
    expect(init.method).toBe("PATCH")
    expect(JSON.parse(init.body as string)).toEqual({ status: "deactivated" })
    expect(res.staff.status).toBe("deactivated")
  })

  it("reads the settings snapshot", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, {
        settings: {
          concern_words: { platform_defaults: ["hurt"], school_additions: [] },
          alert_routing: [],
          access_window: null,
        },
      }),
    )
    vi.stubGlobal("fetch", fetchMock)
    const res = await getSettings("sch1")
    expect(lastCall(fetchMock)[0]).toBe("/api/v1/schools/sch1/settings")
    expect(res.settings.concern_words.platform_defaults).toEqual(["hurt"])
  })

  it("updates concern words via PATCH { concern_words: { words } }", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, {
        settings: {
          concern_words: { platform_defaults: [], school_additions: ["kms"] },
          alert_routing: [],
          access_window: null,
        },
      }),
    )
    vi.stubGlobal("fetch", fetchMock)
    await updateConcernWords("sch1", ["kms"])
    const [url, init] = lastCall(fetchMock)
    expect(url).toBe("/api/v1/schools/sch1/settings")
    expect(init.method).toBe("PATCH")
    expect(JSON.parse(init.body as string)).toEqual({ concern_words: { words: ["kms"] } })
  })

  it("updates alert routing via PATCH { alert_routing: { routes } }", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, {
        settings: {
          concern_words: { platform_defaults: [], school_additions: [] },
          alert_routing: [{ alert_type: "immediate", recipient_staff_ids: ["st1"] }],
          access_window: null,
        },
      }),
    )
    vi.stubGlobal("fetch", fetchMock)
    await updateAlertRouting("sch1", [{ alert_type: "immediate", recipient_staff_ids: ["st1"] }])
    const [, init] = lastCall(fetchMock)
    expect(JSON.parse(init.body as string)).toEqual({
      alert_routing: { routes: [{ alert_type: "immediate", recipient_staff_ids: ["st1"] }] },
    })
  })

  it("updates the access window via PATCH { access_window }", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, {
        settings: {
          concern_words: { platform_defaults: [], school_additions: [] },
          alert_routing: [],
          access_window: { window_start: "08:30:00", window_end: "09:30:00", timezone: "UTC" },
        },
      }),
    )
    vi.stubGlobal("fetch", fetchMock)
    await updateAccessWindow("sch1", { window_start: "08:30", window_end: "09:30", timezone: "UTC" })
    const [, init] = lastCall(fetchMock)
    expect(JSON.parse(init.body as string)).toEqual({
      access_window: { window_start: "08:30", window_end: "09:30", timezone: "UTC" },
    })
  })

  it("maps failures to human copy — 403 / 404 / 422 / generic", () => {
    expect(leadershipErrorMessage(new Error("request failed: 403"))).toMatch(/permission/i)
    expect(leadershipErrorMessage(new Error("request failed: 404"))).toMatch(/no longer exists/i)
    expect(leadershipErrorMessage(new Error("request failed: 422"))).toMatch(/isn't valid/i)
    expect(leadershipErrorMessage(new Error("request failed: 500"))).toMatch(/something went wrong/i)
    expect(leadershipErrorMessage("not-an-error")).toMatch(/something went wrong/i)
  })
})
