import { describe, expect, it, vi } from "vitest"

import { ssoAuthorizeUrl, startSso } from "./sso"

const ORIGIN = "https://app.test"

function makeWin(popup: unknown) {
  const listeners: Array<(e: MessageEvent) => void> = []
  let intervalCb: (() => void) | null = null
  const clearInterval = vi.fn()
  const win = {
    open: vi.fn().mockReturnValue(popup),
    addEventListener: (type: string, cb: (e: MessageEvent) => void) => {
      if (type === "message") listeners.push(cb)
    },
    removeEventListener: (_type: string, cb: (e: MessageEvent) => void) => {
      const i = listeners.indexOf(cb)
      if (i >= 0) listeners.splice(i, 1)
    },
    setInterval: (cb: () => void) => {
      intervalCb = cb
      return 1
    },
    clearInterval,
    location: { origin: ORIGIN },
  } as unknown as Window
  return {
    win,
    emit: (data: unknown, origin = ORIGIN) =>
      listeners.slice().forEach((l) => l({ origin, data } as MessageEvent)),
    fireInterval: () => intervalCb?.(),
    listenerCount: () => listeners.length,
    clearInterval,
  }
}

describe("ssoAuthorizeUrl", () => {
  it("targets the provider start endpoint with an encoded school_code", () => {
    expect(ssoAuthorizeUrl("google", "maple/primary")).toBe(
      "/api/v1/auth/staff/sso/google?school_code=maple%2Fprimary",
    )
  })
})

describe("startSso (popup + postMessage)", () => {
  it("rejects when the popup is blocked", async () => {
    const { win } = makeWin(null)
    await expect(startSso("google", "S", win)).rejects.toThrow("popup_blocked")
  })

  it("resolves with the token delivered by the same-origin callback bridge", async () => {
    const popup = { closed: false, close: vi.fn() }
    const h = makeWin(popup)
    const p = startSso("google", "S", h.win)
    h.emit({ type: "youhue-sso", ok: true, access_token: "tok-123" })
    await expect(p).resolves.toEqual({ kind: "ok", accessToken: "tok-123" })
    expect(popup.close).toHaveBeenCalled()
    expect(h.clearInterval).toHaveBeenCalled()
    expect(h.listenerCount()).toBe(0) // cleaned up
  })

  it("resolves link_required for a first-time SSO matching an existing account", async () => {
    const popup = { closed: false, close: vi.fn() }
    const h = makeWin(popup)
    const p = startSso("microsoft", "S", h.win)
    h.emit({ type: "youhue-sso", link_required: true, link_token: "lt", provider: "microsoft", email: "e@x" })
    await expect(p).resolves.toEqual({
      kind: "link_required",
      linkToken: "lt",
      provider: "microsoft",
      email: "e@x",
    })
  })

  it("rejects on a provider error message", async () => {
    const popup = { closed: false, close: vi.fn() }
    const h = makeWin(popup)
    const p = startSso("google", "S", h.win)
    h.emit({ type: "youhue-sso", ok: false, error: "no_match" })
    await expect(p).rejects.toThrow("no_match")
  })

  it("ignores a message from a foreign origin, then accepts the trusted one", async () => {
    const popup = { closed: false, close: vi.fn() }
    const h = makeWin(popup)
    const p = startSso("google", "S", h.win)
    h.emit({ type: "youhue-sso", ok: true, access_token: "evil" }, "https://evil.test") // ignored
    h.emit({ type: "not-ours", ok: true, access_token: "x" }) // wrong envelope, ignored
    h.emit({ type: "youhue-sso", ok: true, access_token: "good" })
    await expect(p).resolves.toEqual({ kind: "ok", accessToken: "good" })
  })

  it("rejects when the user closes the popup", async () => {
    const popup = { closed: true, close: vi.fn() }
    const h = makeWin(popup)
    const p = startSso("google", "S", h.win)
    h.fireInterval()
    await expect(p).rejects.toThrow("popup_closed")
  })
})
