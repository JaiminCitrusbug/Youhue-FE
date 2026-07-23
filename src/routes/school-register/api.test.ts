import { afterEach, describe, expect, it, vi } from "vitest"

import { registerSchool } from "./api"

// FR-02-01 client — every status the BUILT backend can return
// (`Youhue-BE feat/FR-02-01-school-register`: routers/schools.py + application/schools/services.py).

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("registerSchool (FR-02-01 client)", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("posts the three contract fields to POST /api/v1/schools", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(201, { school_id: "3f0f6c3e-0000-4000-8000-000000000001", status: "pending" }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const outcome = await registerSchool({
      school_name: "Oakwood Primary",
      registrant_email: "head@oakwood.edu",
      password: "Password123",
    })

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe("/api/v1/schools")
    expect(init.method).toBe("POST")
    expect(JSON.parse(init.body as string)).toEqual({
      school_name: "Oakwood Primary",
      registrant_email: "head@oakwood.edu",
      password: "Password123",
    })
    expect(outcome).toEqual({
      kind: "created",
      school: { school_id: "3f0f6c3e-0000-4000-8000-000000000001", status: "pending" },
    })
  })

  it("returns the server's own lifecycle status rather than assuming one", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(201, { school_id: "s1", status: "pending" })))
    const outcome = await registerSchool({
      school_name: "Oakwood Primary",
      registrant_email: "head@oakwood.edu",
      password: "Password123",
    })
    expect(outcome.kind === "created" && outcome.school.status).toBe("pending")
  })

  it.each([
    [403, "forbidden", /already belongs to a school/i],
    [409, "conflict", /already registered and approved/i],
    [422, "invalid", /at least 8 characters/i],
    [429, "throttled", /too many attempts/i],
    [500, "error", /something went wrong/i],
  ])("maps HTTP %s to a %s outcome with a user-visible message", async (status, reason, re) => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(status, { detail: { message: "x" } })))

    const outcome = await registerSchool({
      school_name: "Oakwood Primary",
      registrant_email: "head@oakwood.edu",
      password: "Password123",
    })

    expect(outcome.kind).toBe("failed")
    expect(outcome.kind === "failed" && outcome.reason).toBe(reason)
    expect(outcome.kind === "failed" && outcome.message).toMatch(re)
  })

  it("never echoes the backend's school_id back to an unauthenticated caller", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(409, {
          detail: { message: "A school with this name already exists.", school_id: "SECRET-ID", action: "join" },
        }),
      ),
    )
    const outcome = await registerSchool({
      school_name: "Oakwood Primary",
      registrant_email: "head@oakwood.edu",
      password: "Password123",
    })
    expect(outcome.kind === "failed" && outcome.message).not.toContain("SECRET-ID")
  })

  it("treats a 201 with an unreadable body as an error rather than a false success", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not json", { status: 201 })))
    const outcome = await registerSchool({
      school_name: "Oakwood Primary",
      registrant_email: "head@oakwood.edu",
      password: "Password123",
    })
    expect(outcome).toEqual({ kind: "failed", reason: "error", message: "Something went wrong. Please try again." })
  })
})
