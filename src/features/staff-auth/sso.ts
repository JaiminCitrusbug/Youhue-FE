/**
 * Staff SSO start (FR-01-03 · decision #1) — popup + postMessage delivery.
 *
 * WHY A POPUP, NOT A TOP-LEVEL REDIRECT:
 *   The SPA holds the access token IN MEMORY ONLY (hard app rule — never localStorage, XSS).
 *   A full-page OAuth redirect would unload the SPA and wipe that in-memory token. So we open the
 *   provider flow in a POPUP; the opener (this SPA) stays alive. When the provider bounces back to
 *   the BE callback, the callback returns a tiny HTML page that does
 *       window.opener.postMessage({ type: "youhue-sso", ok, access_token | link_required, ... }, FRONTEND_ORIGIN)
 *   then closes itself. The opener receives the token, stores it in memory, and closes the popup.
 *
 * SECURITY: we only trust a message whose `origin` equals our own origin (the callback bridge is
 * served same-origin via the dev proxy / same deployment origin) and whose `type` is "youhue-sso".
 *
 * NOTE FOR THE CONDUCTOR (BE reconciliation): the BE callback currently returns 200 JSON. For this
 * delivery it must instead return the HTML postMessage bridge described above (or, alternatively,
 * a 302 to a frontend route carrying the token in the URL fragment — see the gate doc). This is the
 * documented SSO-callback delivery decision; the conductor reconciles the BE side.
 */

export type SsoProvider = "google" | "microsoft"

export interface SsoSuccess {
  kind: "ok"
  accessToken: string
}

/** First-time SSO whose subject matches an existing email account and needs an explicit link (Scenario 3). */
export interface SsoLinkRequired {
  kind: "link_required"
  linkToken: string
  provider: SsoProvider
  email: string
}

export type SsoOutcome = SsoSuccess | SsoLinkRequired

/** The provider-start URL the popup navigates to (BE 302s it onward to Google/Microsoft). */
export function ssoAuthorizeUrl(provider: SsoProvider, schoolCode: string): string {
  return `/api/v1/auth/staff/sso/${provider}?school_code=${encodeURIComponent(schoolCode)}`
}

interface SsoMessage {
  type?: string
  ok?: boolean
  access_token?: string
  link_required?: boolean
  link_token?: string
  provider?: SsoProvider
  email?: string
  error?: string
}

/**
 * Open the provider popup and resolve with the token (or a link-required outcome) delivered by the
 * BE callback bridge via postMessage. Rejects on popup-blocked, user-closed, or a provider error.
 * `win` is injectable so the flow is unit-testable without a real browser.
 */
export function startSso(
  provider: SsoProvider,
  schoolCode: string,
  win: Window = window,
): Promise<SsoOutcome> {
  return new Promise<SsoOutcome>((resolve, reject) => {
    const popup = win.open(ssoAuthorizeUrl(provider, schoolCode), "youhue-sso", "width=520,height=640")
    if (!popup) {
      reject(new Error("popup_blocked"))
      return
    }

    const poll = win.setInterval(() => {
      if (popup.closed) {
        cleanup()
        reject(new Error("popup_closed"))
      }
    }, 400)

    function cleanup() {
      win.clearInterval(poll)
      win.removeEventListener("message", onMessage)
    }

    function onMessage(ev: MessageEvent) {
      // Only trust the same-origin callback bridge with our envelope.
      if (ev.origin !== win.location.origin) return
      const d = ev.data as SsoMessage | null
      if (!d || d.type !== "youhue-sso") return
      cleanup()
      try {
        popup?.close()
      } catch {
        /* popup may already be gone */
      }
      if (d.ok && d.access_token) {
        resolve({ kind: "ok", accessToken: d.access_token })
      } else if (d.link_required && d.link_token) {
        resolve({
          kind: "link_required",
          linkToken: d.link_token,
          provider: d.provider ?? provider,
          email: d.email ?? "",
        })
      } else {
        reject(new Error(d.error ?? "sso_failed"))
      }
    }

    win.addEventListener("message", onMessage)
  })
}
