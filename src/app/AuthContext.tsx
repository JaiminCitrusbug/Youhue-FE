import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

import { api, getToken, onAuthFailure, setToken } from "../api/client"
import { logAuthEvent } from "../lib/telemetry"

export interface Me {
  subject_id: string
  kind: string
  role: string | null
  school_id: string | null
}

export interface AuthState {
  user: Me | null
  loading: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthCtx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh(): Promise<void> {
    if (!getToken()) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      setUser(await api<Me>("/me"))
    } catch {
      // Only a 401 forces sign-out, and api() already clears the token + fires onAuthFailure
      // for that case. A transient network/5xx blip must NOT drop the in-memory token — keep it
      // so the session survives and a later refresh can succeed.
      setUser(null)
    }
    setLoading(false)
  }

  async function signOut(): Promise<void> {
    try {
      await api("/auth/logout", { method: "POST" })
      logAuthEvent("fr_01_05_success")
    } catch {
      // even if the call fails, drop the local session
      logAuthEvent("fr_01_05_error")
    }
    setToken(null)
    setUser(null)
  }

  useEffect(() => {
    void refresh()
    // one choke point: any 401 during the session ends it (token already cleared in api())
    return onAuthFailure(() => {
      logAuthEvent("fr_01_05_rejected")
      setUser(null)
      setToken(null)
    })
  }, [])

  return (
    <AuthCtx.Provider value={{ user, loading, refresh, signOut }}>{children}</AuthCtx.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
