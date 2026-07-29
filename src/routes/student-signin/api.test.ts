import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getStudentRoster, studentSignIn } from "./api"
import { getToken, setToken } from "../../api/client"

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}

describe("studentSignIn (FR-01-02 client)", () => {
  beforeEach(() => setToken(null))
  afterEach(() => vi.unstubAllGlobals())

  it("posts to the student sign-in endpoint and stores session_token as the bearer", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { session_token: "st", student_id: "id", age_band: "8-10" }))
    vi.stubGlobal("fetch", fetchMock)

    const res = await studentSignIn({ school_or_class_code: "MAP123", student_id: "id" })

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/student/sign-in",
      expect.objectContaining({ method: "POST" }),
    )
    expect(res.session_token).toBe("st")
    expect(getToken()).toBe("st") // session_token becomes the in-memory bearer (never access_token)
  })

  it.each([
    [400, /didn't work/i],
    [404, /couldn't find/i],
    [429, /too many/i],
    [500, /something went wrong/i],
  ])("surfaces HTTP %s as a friendly error and never sets a token", async (status, re) => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(status, { error: "x" })))
    await expect(studentSignIn({ qr_token: "tok", student_id: "id" })).rejects.toThrow(re)
    expect(getToken()).toBeNull()
  })
})

describe("getStudentRoster (FR-01-02 client, real roster — closes DEF-007)", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("GETs the roster by school_or_class_code", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { students: [{ id: "s1", display_name: "Amy K" }] }))
    vi.stubGlobal("fetch", fetchMock)

    const res = await getStudentRoster({ school_or_class_code: "MAP123" })

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/student/roster?school_or_class_code=MAP123",
    )
    expect(res.students).toEqual([{ id: "s1", display_name: "Amy K" }])
  })

  it("GETs the roster by qr_token", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { students: [] }))
    vi.stubGlobal("fetch", fetchMock)

    await getStudentRoster({ qr_token: "QRTOK" })

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/auth/student/roster?qr_token=QRTOK")
  })

  it.each([
    [400, /didn't work/i],
    [404, /couldn't find/i],
    [429, /too many/i],
    [500, /something went wrong/i],
  ])("surfaces HTTP %s as a friendly error, never a silent empty roster", async (status, re) => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(status, { error: "x" })))
    await expect(getStudentRoster({ school_or_class_code: "X" })).rejects.toThrow(re)
  })
})
