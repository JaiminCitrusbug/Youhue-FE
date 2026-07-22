import { type ReactElement } from "react"
import { Navigate } from "react-router-dom"

import { useAuth } from "../../app/AuthContext"
import { effectiveRole } from "../../lib/roles"
import { logAuthEvent } from "../../lib/telemetry"

// Route guards live in layout/ (frontend.md §112). FE guards are UX only — backend authz
// (INFRA-03) remains the security boundary; these prevent a screen from mounting for a
// session whose kind/role does not permit it (403 handled, not rendered — INFRA-04.md §14/§29).

export function RequireStaff({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="p-6">Loading…</p>
  if (!user || (user.kind !== "staff" && user.kind !== "admin")) {
    return <Navigate to="/sign-in" replace />
  }
  return children
}

export function RequireStudent({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="p-6">Loading…</p>
  if (!user || user.kind !== "student") return <Navigate to="/student/sign-in" replace />
  return children
}

// Per-role gate for staff sub-routes. Denies (does not mount) a role the route does not permit
// and bounces the user back to their own role home. Emits fr_01_05_forbidden on denial.
export function RequireRole({ allow, children }: { allow: string[]; children: ReactElement }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="p-6">Loading…</p>
  const role = effectiveRole(user)
  if (!role || !allow.includes(role)) {
    logAuthEvent("fr_01_05_forbidden")
    return <Navigate to="/app" replace />
  }
  return children
}
