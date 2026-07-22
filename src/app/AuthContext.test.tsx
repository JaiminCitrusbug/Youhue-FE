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

  it("signOut calls the logout endpoint and clears the token + user", async () => {
    setToken("tok")
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
  })

  it("useAuth throws outside a provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow(/AuthProvider/)
  })
})
