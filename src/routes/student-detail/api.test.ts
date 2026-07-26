import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setToken } from "../../api/client"
import { getStudentDetail, getStudentSummary, StudentDetailApiError } from "./api"

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("student-detail client (FR-10-02)", () => {
  beforeEach(() => setToken("staff-tok"))
  afterEach(() => vi.unstubAllGlobals())

  it("getStudentSummary fetches the given student id", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, {
        id: "s1", display_name: "Amy", age_band: "b8_11", school_id: "sch1",
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const res = await getStudentSummary("s1")

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/students/s1", expect.anything())
    expect(res.display_name).toBe("Amy")
  })

  it("getStudentDetail fetches the given student id and returns the server-owned figures", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, {
        mood_history: [{ local_date: "2026-07-21", mood_value: 4 }],
        reflections: [{ local_date: "2026-07-21", reflection_text: "Good day" }],
        participation_rate: 0.4286,
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const res = await getStudentDetail("s1")

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/students/s1/detail", expect.anything())
    expect(res.participation_rate).toBe(0.4286)
    expect(res.mood_history).toHaveLength(1)
  })

  it("surfaces the REAL server detail + status on a non-2xx response (e.g. 403 out-of-scope)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(403, { detail: "Access denied" })))
    const err = await getStudentDetail("not-mine").catch((e: unknown) => e)
    expect(err).toBeInstanceOf(StudentDetailApiError)
    expect((err as StudentDetailApiError).status).toBe(403)
    expect((err as StudentDetailApiError).message).toBe("Access denied")
  })

  it("falls back to a generic message when the error body has no detail", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 404 })))
    const err = await getStudentSummary("unknown").catch((e: unknown) => e)
    expect(err).toBeInstanceOf(StudentDetailApiError)
    expect((err as StudentDetailApiError).message).toMatch(/something went wrong/i)
  })
})
