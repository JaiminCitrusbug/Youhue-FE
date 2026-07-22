import { afterEach, describe, expect, it, vi } from "vitest"

import { api, getToken, onAuthFailure, setToken } from "./api"

describe("api client", () => {
  afterEach(() => {
    setToken(null)
    vi.restoreAllMocks()
  })

  it("stores and clears the token", () => {
    setToken("abc")
    expect(getToken()).toBe("abc")
    setToken(null)
    expect(getToken()).toBeNull()
  })

  it("attaches the bearer token and returns json", async () => {
    setToken("tok")
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ x: 1 }) })
    vi.stubGlobal("fetch", fetchMock)
    const out = await api<{ x: number }>("/me")
    expect(out).toEqual({ x: 1 })
    const opts = fetchMock.mock.calls[0][1] as RequestInit
    expect((opts.headers as Record<string, string>).Authorization).toBe("Bearer tok")
  })

  it("throws on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(api("/me")).rejects.toThrow(/500/)
  })

  it("clears the token and notifies on a 401 (token in memory only)", async () => {
    setToken("tok")
    const listener = vi.fn()
    const unsub = onAuthFailure(listener)
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }))
    await expect(api("/me")).rejects.toThrow()
    expect(getToken()).toBeNull() // stale session cannot persist
    expect(listener).toHaveBeenCalled()
    unsub()
  })
})
