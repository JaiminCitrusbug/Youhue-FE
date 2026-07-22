import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

import { api, getToken, setToken } from "../lib/api"

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
      setUser(null)
      setToken(null)
    }
    setLoading(false)
  }

  async function signOut(): Promise<void> {
    try {
      await api("/auth/logout", { method: "POST" })
    } catch {
      // even if the call fails, drop the local session
    }
    setToken(null)
    setUser(null)
  }

  useEffect(() => {
    void refresh()
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
