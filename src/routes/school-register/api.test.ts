import { afterEach, describe, expect, it, vi } from "vitest"

import { registerSchool } from "./api"

// FR-02-01 client — every status the FINAL (security-hardened) backend can return
// (`Youhue-BE feat/FR-02-01-school-register` @ b2b9bcf: routers/schools.py +
// application/schools/services.py + schemas/schools.py). The 403 enumeration oracle was REMOVED and
// the 409 body no longer carries `school_id`/`action` — these tests pin the post-hardening shapes.

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("registerSchool (FR-02-01 client)", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("posts ONLY the three contract fields to POST /api/v1/schools", async () => {
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
    // exactly the three allowed fields — nothing else (the server forbids extras)
    expect(JSON.parse(init.body as string)).toEqual({
      school_name: "Oakwood Primary",
      registrant_email: "head@oakwood.edu",
      password: "Password123",
    })
    // the created outcome carries the server's status and NOTHING that could be a tenant UUID
    expect(outcome).toEqual({ kind: "created", status: "pending" })
    expect(JSON.stringify(outcome)).not.toContain("3f0f6c3e")
  })

  it("returns the server's own lifecycle status rather than assuming one", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(201, { school_id: "s1", status: "pending" })))
    const outcome = await registerSchool({
      school_name: "Oakwood Primary",
      registrant_email: "head@oakwood.edu",
      password: "Password123",
    })
    expect(outcome.kind === "created" && outcome.status).toBe("pending")
  })

  it("treats an already-registered email exactly like a new one (no enumeration signal)", async () => {
    // The hardened backend returns 201 for a KNOWN email too — it answers no question about who has
    // an account. The client must therefore surface the same neutral 'created' outcome, learning and
    // exposing nothing about account/tenant existence.
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(201, { school_id: "s2", status: "pending" })))
    const outcome = await registerSchool({
      school_name: "Birchwood Academy",
      registrant_email: "known.teacher@elsewhere.example",
      password: "Password123",
    })
    expect(outcome).toEqual({ kind: "created", status: "pending" })
  })

  it("maps a 409 name-conflict to terminal guidance (no join promise, no tenant id)", async () => {
    // Final 409 body: { detail: { code, message } } — no school_id, no action:"join".
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(409, {
          detail: { code: "school_exists", message: "A school with this name is already registered." },
        }),
      ),
    )
    const outcome = await registerSchool({
      school_name: "Oakwood Primary",
      registrant_email: "new.teacher@oakwood.edu",
      password: "Password123",
    })
    expect(outcome.kind).toBe("failed")
    expect(outcome.kind === "failed" && outcome.reason).toBe("conflict")
    expect(outcome.kind === "failed" && outcome.message).toMatch(/already registered/i)
    // guidance must not promise a join flow that does not exist
    expect(outcome.kind === "failed" && outcome.message).not.toMatch(/\bjoin\b/i)
  })

  it("surfaces the server's own 422 validation message from the ARRAY detail shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(422, {
          detail: [
            { loc: ["body", "password"], msg: "String should have at least 8 characters", type: "string_too_short" },
          ],
        }),
      ),
    )
    const outcome = await registerSchool({
      school_name: "Oakwood Primary",
      registrant_email: "head@oakwood.edu",
      password: "short",
    })
    expect(outcome.kind === "failed" && outcome.reason).toBe("invalid")
    expect(outcome.kind === "failed" && outcome.message).toMatch(/at least 8 characters/i)
  })

  it.each([
    [429, "throttled", /too many attempts/i],
    [500, "error", /something went wrong/i],
  ])("maps HTTP %s to a %s outcome with a user-visible message", async (status, reason, re) => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(status, { detail: "Too many requests, slow down" })))

    const outcome = await registerSchool({
      school_name: "Oakwood Primary",
      registrant_email: "head@oakwood.edu",
      password: "Password123",
    })

    expect(outcome.kind).toBe("failed")
    expect(outcome.kind === "failed" && outcome.reason).toBe(reason)
    expect(outcome.kind === "failed" && outcome.message).toMatch(re)
  })

  it("never surfaces a tenant UUID even if a stray one appears in a 409 body", async () => {
    // Defensive: the final contract carries no school_id, but if a server ever regressed and leaked
    // one, our own copy must not echo it to an unauthenticated caller.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(409, {
          detail: { code: "school_exists", message: "taken", school_id: "SECRET-ID" },
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
