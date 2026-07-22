import { act, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { getToken, setToken } from "../api/client"
import { AuthProvider, useAuth, type AuthState } from "./AuthContext"

function Probe() {
  const { user, loading } = useAuth()
  return <div>{loading ? "loading" : user ? `user:${user.role}` : "anon"}</div>
}

const USER = { subject_id: "1", kind: "staff", role: "teacher", school_id: "s" }

describe("AuthProvider", () => {
  afterEach(() => {
    setToken(null)
    vi.restoreAllMocks()
  })

  it("is anonymous with no token", async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByText("anon")).toBeInTheDocument())
  })

  it("loads the user when a token is present", async () => {
    setToken("tok")
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => USER }))
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByText("user:teacher")).toBeInTheDocument())
  })

  it("keeps the in-memory token on a transient /me failure (no forced sign-out)", async () => {
    setToken("tok")
    // a 503 is transient, not an auth failure — the session must survive
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }))
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByText("anon")).toBeInTheDocument())
    expect(getToken()).toBe("tok")
  })

  it("signOut calls the logout endpoint, clears the token + user, and logs success", async () => {
    setToken("tok")
    const info = vi.spyOn(console, "info").mockImplementation(() => {})
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => USER })
    vi.stubGlobal("fetch", fetchMock)
    let auth: AuthState | undefined
    function Grab() {
      auth = useAuth()
      return null
    }
    render(
      <AuthProvider>
        <Grab />
      </AuthProvider>,
    )
    await waitFor(() => expect(auth?.user).not.toBeNull())
    await act(async () => {
      await auth?.signOut()
    })
    expect(auth?.user).toBeNull()
    expect(getToken()).toBeNull()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/auth/logout"),
      expect.objectContaining({ method: "POST" }),
    )
    expect(info).toHaveBeenCalledWith(expect.stringContaining("fr_01_05_success"))
  })

  it("still ends the session and logs an error event when the logout call fails", async () => {
    setToken("tok")
    const info = vi.spyOn(console, "info").mockImplementation(() => {})
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => USER }) // /me
      .mockRejectedValueOnce(new Error("network down")) // /auth/logout
    vi.stubGlobal("fetch", fetchMock)
    let auth: AuthState | undefined
    function Grab() {
      auth = useAuth()
      return null
    }
    render(
      <AuthProvider>
        <Grab />
      </AuthProvider>,
    )
    await waitFor(() => expect(auth?.user).not.toBeNull())
    await act(async () => {
      await auth?.signOut()
    })
    expect(auth?.user).toBeNull()
    expect(getToken()).toBeNull()
    expect(info).toHaveBeenCalledWith(expect.stringContaining("fr_01_05_error"))
  })

  it("logs a rejected event and ends the session on a 401 during the session", async () => {
    setToken("tok")
    const info = vi.spyOn(console, "info").mockImplementation(() => {})
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => USER }) // initial /me
      .mockResolvedValueOnce({ ok: false, status: 401 }) // refresh -> 401
    vi.stubGlobal("fetch", fetchMock)
    let auth: AuthState | undefined
    function Grab() {
      auth = useAuth()
      return null
    }
    render(
      <AuthProvider>
        <Grab />
      </AuthProvider>,
    )
    await waitFor(() => expect(auth?.user).not.toBeNull())
    await act(async () => {
      await auth?.refresh()
    })
    await waitFor(() => expect(auth?.user).toBeNull())
    expect(getToken()).toBeNull()
    expect(info).toHaveBeenCalledWith(expect.stringContaining("fr_01_05_rejected"))
  })

  it("useAuth throws outside a provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow(/AuthProvider/)
  })
})
