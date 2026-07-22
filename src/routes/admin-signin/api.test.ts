import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { adminSignIn } from "./api"
import { getToken, setToken } from "../../api/client"

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}

describe("adminSignIn (FR-19-01 client)", () => {
  beforeEach(() => setToken(null))
  afterEach(() => vi.unstubAllGlobals())

  it("phase 1 (no mfa_code) requests an OTP and stores NO token", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, { admin_session: null, role: null, mfa_required: true }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const res = await adminSignIn({ email: "a@x.io", password: "pw" })

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/admin/sign-in",
      expect.objectContaining({ method: "POST" }),
    )
    // the body carries email+password and NO mfa_code in phase 1
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    const sent = JSON.parse(call[1].body as string)
    expect(sent).toEqual({ email: "a@x.io", password: "pw" })
    expect(res.mfa_required).toBe(true)
    expect(getToken()).toBeNull() // no session until phase 2
  })

  it("phase 2 (email+password+mfa_code) stores admin_session as the bearer (not access_token)", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, { admin_session: "adm-bearer", role: "support", mfa_required: false }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const res = await adminSignIn({ email: "a@x.io", password: "pw", mfa_code: "123456" })

    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    const sent = JSON.parse(call[1].body as string)
    expect(sent).toEqual({ email: "a@x.io", password: "pw", mfa_code: "123456" })
    expect(res.admin_session).toBe("adm-bearer")
    expect(getToken()).toBe("adm-bearer")
  })

  it.each([
    [401, /sign-in failed/i],
    [423, /locked/i],
    [429, /too many/i],
    [500, /something went wrong/i],
  ])("surfaces HTTP %s as a generic error and never sets a token", async (status, re) => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(status, { error: "x" })))
    await expect(adminSignIn({ email: "a@x.io", password: "pw", mfa_code: "000000" })).rejects.toThrow(re)
    expect(getToken()).toBeNull()
  })

  it("gives the IDENTICAL 401 message for a bad email and a wrong password (no enumeration)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(401, {})))
    const a = await adminSignIn({ email: "unknown@x.io", password: "pw" }).catch((e: Error) => e.message)
    const b = await adminSignIn({ email: "real@x.io", password: "wrong" }).catch((e: Error) => e.message)
    expect(a).toBe(b)
  })
})
