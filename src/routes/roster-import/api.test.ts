import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getToken, setToken } from "../../api/client"
import { importRoster } from "./api"

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}

function csvFile(name = "roster.csv"): File {
  return new File(["name,age\nAmy,6\n"], name, { type: "text/csv" })
}

describe("importRoster (FR-03-01 client)", () => {
  beforeEach(() => setToken(null))
  afterEach(() => vi.unstubAllGlobals())

  it("POSTs a multipart form with the file and the staff bearer", async () => {
    setToken("teacher-bearer")
    const fetchMock = vi.fn(async () => jsonResponse(200, { imported: 3, banded: 3 }))
    vi.stubGlobal("fetch", fetchMock)

    const outcome = await importRoster("school-1", csvFile())

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe("/api/v1/schools/school-1/roster/import")
    expect(init.method).toBe("POST")
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer teacher-bearer")
    // no Content-Type set manually — the browser must own the multipart boundary
    expect((init.headers as Record<string, string>)["Content-Type"]).toBeUndefined()
    expect(init.body).toBeInstanceOf(FormData)
    expect((init.body as FormData).get("file")).toBeInstanceOf(File)
    expect(outcome).toEqual({ kind: "success", result: { imported: 3, banded: 3 } })
  })

  it("sends no Authorization header when there is no session token", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { imported: 1, banded: 1 }))
    vi.stubGlobal("fetch", fetchMock)
    await importRoster("school-1", csvFile())
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect((call[1].headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it("maps 415 to the TRUE reason named by the server, never a generic message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(415, {
          detail: { code: "unsupported_file_type", message: "The file type is not accepted. Upload a .csv roster file." },
        }),
      ),
    )
    const outcome = await importRoster("school-1", csvFile("roster.exe"))
    expect(outcome.kind).toBe("failed")
    expect(outcome.kind === "failed" && outcome.failure.kind).toBe("unsupported_type")
    expect(outcome.kind === "failed" && outcome.failure.message).toMatch(/not accepted/i)
  })

  it("maps 413 to a too-large failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(413, { detail: { code: "file_too_large", message: "The file is over the 2MB limit." } })),
    )
    const outcome = await importRoster("school-1", csvFile())
    expect(outcome.kind === "failed" && outcome.failure.kind).toBe("too_large")
    expect(outcome.kind === "failed" && outcome.failure.message).toMatch(/2MB/)
  })

  it("maps 400 to a failed-scan failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(400, { detail: { code: "failed_scan", message: "The uploaded file is empty." } })),
    )
    const outcome = await importRoster("school-1", csvFile())
    expect(outcome.kind === "failed" && outcome.failure.kind).toBe("failed_scan")
    expect(outcome.kind === "failed" && outcome.failure.message).toMatch(/empty/i)
  })

  it("maps 422 to a malformed-rows failure carrying every row error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(422, {
          detail: {
            code: "malformed_rows",
            message: "One or more rows could not be imported.",
            errors: [
              { row: 2, error: "Missing student name." },
              { row: 3, error: "Age 'x' is not a whole number." },
            ],
          },
        }),
      ),
    )
    const outcome = await importRoster("school-1", csvFile())
    expect(outcome.kind === "failed" && outcome.failure.kind).toBe("malformed_rows")
    const failure = outcome.kind === "failed" && outcome.failure.kind === "malformed_rows" ? outcome.failure : null
    expect(failure?.errors).toEqual([
      { row: 2, error: "Missing student name." },
      { row: 3, error: "Age 'x' is not a whole number." },
    ])
  })

  it("maps 403 to a forbidden failure and keeps the token", async () => {
    setToken("t")
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(403, { detail: "Access denied" })))
    const outcome = await importRoster("school-1", csvFile())
    expect(outcome.kind === "failed" && outcome.failure.kind).toBe("forbidden")
    expect(getToken()).toBe("t")
  })

  it("clears the stale token on 401 and surfaces a session-expired failure", async () => {
    setToken("t")
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(401, {})))
    const outcome = await importRoster("school-1", csvFile())
    expect(outcome.kind === "failed" && outcome.failure.kind).toBe("forbidden")
    expect(outcome.kind === "failed" && outcome.failure.message).toMatch(/session/i)
    expect(getToken()).toBeNull()
  })

  it("maps a 500 to a generic error failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(500, { detail: "Import failed" })))
    const outcome = await importRoster("school-1", csvFile())
    expect(outcome.kind === "failed" && outcome.failure.kind).toBe("error")
  })

  it("treats a 200 with an unreadable body as an error rather than a false success", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not json", { status: 200 })))
    const outcome = await importRoster("school-1", csvFile())
    expect(outcome.kind === "failed" && outcome.failure.kind).toBe("error")
  })

  it("surfaces a network failure as a generic error rather than throwing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down") }))
    const outcome = await importRoster("school-1", csvFile())
    expect(outcome.kind === "failed" && outcome.failure.kind).toBe("error")
  })
})
