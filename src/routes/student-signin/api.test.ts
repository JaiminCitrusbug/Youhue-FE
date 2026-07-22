import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { studentSignIn } from "./api"
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
