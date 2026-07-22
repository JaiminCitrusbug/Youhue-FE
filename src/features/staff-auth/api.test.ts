import { afterEach, describe, expect, it, vi } from "vitest"

import {
  staffForgotPassword,
  staffMfaVerify,
  staffResetPassword,
  staffSignIn,
  staffSsoLink,
} from "./api"

function mockFetch(status: number, body: unknown, jsonThrows = false) {
  const fetchMock = vi.fn().mockResolvedValue({
    status,
    json: async () => {
      if (jsonThrows) throw new Error("no body")
      return body
    },
  })
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

describe("staff-auth api", () => {
  afterEach(() => vi.restoreAllMocks())

  it("posts sign-in credentials and returns status + data", async () => {
    const fetchMock = mockFetch(200, { access_token: "t", token_type: "bearer", mfa_required: false })
    const res = await staffSignIn("a@b.sch", "pw")
    expect(res.status).toBe(200)
    expect(res.data?.access_token).toBe("t")
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe("/api/v1/auth/staff/sign-in")
    expect(JSON.parse((opts as RequestInit).body as string)).toEqual({ email: "a@b.sch", password: "pw" })
    // pre-auth call must NOT attach an Authorization header
    expect((opts as RequestInit).headers).not.toHaveProperty("Authorization")
  })

  it("includes device_id only when provided", async () => {
    const fetchMock = mockFetch(200, {})
    await staffSignIn("a@b.sch", "pw", "dev-1")
    expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)).toMatchObject({
      device_id: "dev-1",
    })
  })

  it("surfaces a 401 without throwing (generic handling is the caller's job)", async () => {
    mockFetch(401, { detail: "invalid" })
    const res = await staffSignIn("a@b.sch", "wrong")
    expect(res.status).toBe(401)
  })

  it("verifies an MFA code against the session token", async () => {
    const fetchMock = mockFetch(200, { access_token: "final", token_type: "bearer" })
    const res = await staffMfaVerify("sess", "123456")
    expect(res.data?.access_token).toBe("final")
    expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)).toEqual({
      session_token: "sess",
      code: "123456",
    })
  })

  it("forgot-password returns the generic 202 accepted result", async () => {
    mockFetch(202, { status: "accepted" })
    const res = await staffForgotPassword("a@b.sch")
    expect(res.status).toBe(202)
    expect(res.data?.status).toBe("accepted")
  })

  it("reset-password treats the 204 (no body) as success with null data", async () => {
    mockFetch(204, null, true)
    const res = await staffResetPassword("tok", "newpassword")
    expect(res.status).toBe(204)
    expect(res.data).toBeNull()
  })

  it("returns null data when a non-204 body is not JSON", async () => {
    mockFetch(500, null, true)
    const res = await staffResetPassword("tok", "newpassword")
    expect(res.status).toBe(500)
    expect(res.data).toBeNull()
  })

  it("exchanges an SSO link token for a session", async () => {
    mockFetch(200, { access_token: "linked", token_type: "bearer" })
    const res = await staffSsoLink("lt")
    expect(res.data?.access_token).toBe("linked")
  })
})
