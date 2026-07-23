import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { saveDefaultConcernWords } from "./api"
import { getToken, setToken } from "../../api/client"

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}

describe("saveDefaultConcernWords (FR-19-05 client)", () => {
  beforeEach(() => setToken(null))
  afterEach(() => vi.unstubAllGlobals())

  it("PUTs { words } with the admin bearer and returns the normalized default", async () => {
    setToken("adm-bearer")
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, { words: ["alone", "hopeless"], count: 2, is_default: true }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const res = await saveDefaultConcernWords(["  Alone ", "HOPELESS"])

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/admin/concern-words/default",
      expect.objectContaining({ method: "PUT" }),
    )
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect((call[1].headers as Record<string, string>).Authorization).toBe("Bearer adm-bearer")
    expect(JSON.parse(call[1].body as string)).toEqual({ words: ["  Alone ", "HOPELESS"] })
    expect(res).toEqual({ words: ["alone", "hopeless"], count: 2, is_default: true })
  })

  it("sends no Authorization header when there is no session token", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { words: ["a"], count: 1, is_default: true }))
    vi.stubGlobal("fetch", fetchMock)

    await saveDefaultConcernWords(["a"])

    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect((call[1].headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it("surfaces 403 as a generic permission message (role lacks manage_word_lists)", async () => {
    setToken("adm")
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(403, { detail: "forbidden" })))
    await expect(saveDefaultConcernWords(["a"])).rejects.toThrow(/permission/i)
    // a 403 is NOT a session expiry — the token survives
    expect(getToken()).toBe("adm")
  })

  it("clears the stale token and surfaces a permission message on 401", async () => {
    setToken("adm")
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(401, {})))
    await expect(saveDefaultConcernWords(["a"])).rejects.toThrow(/permission/i)
    expect(getToken()).toBeNull()
  })

  it.each([
    [422, /couldn.t save/i],
    [500, /couldn.t save/i],
  ])("surfaces HTTP %s as a generic save error", async (status, re) => {
    setToken("adm")
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(status, { error: "boom" })))
    await expect(saveDefaultConcernWords(["a"])).rejects.toThrow(re)
  })
})
