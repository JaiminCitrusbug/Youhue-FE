import { useEffect } from "react"
import { Navigate, Route, Routes, useNavigate } from "react-router-dom"

import { setToken } from "../api/client"
import { useAuth } from "../app/AuthContext"
import { AppShell } from "../components/layout/AppShell"
import { RequireRole, RequireStaff, RequireStudent } from "../components/layout/guards"
import { StudentShell } from "../components/layout/StudentShell"
import { Maintenance, NotFound404, ServerError500, Terms } from "../components/layout/system"
import { StaffAuthRoutes } from "../features/staff-auth/StaffAuthRoutes"
import { effectiveRole, HOME_BY_ROLE, ROLE_ROUTES } from "../lib/roles"
import { SeedActivities } from "./admin-console/seed-activities/SeedActivities"
import { AdminSignInApp } from "./admin-signin"
import { DefaultWordListsApp } from "./admin-word-lists"
import { SchoolRegisterApp } from "./school-register"
import { StudentSignInApp } from "./student-signin"

function Placeholder({ title }: { title: string }) {
  return <h1 className="text-2xl font-bold text-ink">{title}</h1>
}

function RoleHome() {
  const { user } = useAuth()
  return <Navigate to={`/app/${HOME_BY_ROLE[effectiveRole(user) ?? ""] ?? "dashboard"}`} replace />
}

// DEV-ONLY e2e bridge. The token is in-memory only (setToken -> module var in api/client.ts,
// NEVER localStorage). Because sign-in UI is a Wave-1 placeholder, the whole-product Playwright
// gate obtains a REAL token from the live BE and injects it here, then navigates CLIENT-SIDE so no
// full reload wipes the in-memory token. Stripped from production builds by `import.meta.env.DEV`.
function TestAuthBridge() {
  const { refresh } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ;(window as unknown as { __youhueTest?: unknown }).__youhueTest = {
      login: async (token: string, to = "/app") => {
        setToken(token)
        await refresh()
        navigate(to)
      },
    }
  }, [refresh, navigate])
  return null
}

export function AppRoutes() {
  return (
    <>
      {import.meta.env.DEV ? <TestAuthBridge /> : null}
    <Routes>
      {/* FR-01-03 — staff sign-in owns its own route module (decision #4). */}
      <Route path="/sign-in/*" element={<StaffAuthRoutes />} />
      {/* FR-01-02 — student passwordless sign-in owns its own route module (decision #4). */}
      <Route path="/student/sign-in/*" element={<StudentSignInApp />} />
      {/* FR-02-01 — pre-login school self-registration owns its own route module (decision #4). */}
      <Route path="/register-school/*" element={<SchoolRegisterApp />} />
      {/* FR-19-01 — internal admin console sign-in owns its own route module (decision #4). */}
      <Route path="/admin/sign-in/*" element={<AdminSignInApp />} />
      <Route
        path="/app"
        element={
          <RequireStaff>
            <AppShell />
          </RequireStaff>
        }
      >
        <Route index element={<RoleHome />} />
        <Route
          path="dashboard"
          element={
            <RequireRole allow={ROLE_ROUTES.dashboard}>
              <Placeholder title="Class dashboard" />
            </RequireRole>
          }
        />
        <Route
          path="leadership"
          element={
            <RequireRole allow={ROLE_ROUTES.leadership}>
              <Placeholder title="Leadership overview" />
            </RequireRole>
          }
        />
        <Route
          path="district"
          element={
            <RequireRole allow={ROLE_ROUTES.district}>
              <Placeholder title="District admin" />
            </RequireRole>
          }
        />
        {/* FR-19-05 — the internal admin console. SC-079 (default concern-word lists) is its first
            built screen; the console shell/landing + further screens are FR-19-02/04/07. */}
        <Route
          path="admin"
          element={
            <RequireRole allow={ROLE_ROUTES.admin}>
              <DefaultWordListsApp />
            </RequireRole>
          }
        />
        {/* FR-19-04 — seed activity maintenance lives inside the admin console, behind admin auth
            (the same RequireRole gate; the BE also enforces the manage_seed RBAC permission). */}
        <Route
          path="admin/seed-activities"
          element={
            <RequireRole allow={ROLE_ROUTES.admin}>
              <SeedActivities />
            </RequireRole>
          }
        />
      </Route>
      <Route
        path="/student"
        element={
          <RequireStudent>
            <StudentShell />
          </RequireStudent>
        }
      >
        <Route index element={<Placeholder title="Daily check-in" />} />
      </Route>
      <Route path="/terms" element={<Terms />} />
      <Route path="/maintenance" element={<Maintenance />} />
      <Route path="/500" element={<ServerError500 />} />
      <Route path="*" element={<NotFound404 />} />
    </Routes>
    </>
  )
}
