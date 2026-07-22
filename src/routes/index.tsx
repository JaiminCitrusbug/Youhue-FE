import { Navigate, Route, Routes } from "react-router-dom"

import { useAuth } from "../app/AuthContext"
import { AppShell } from "../components/layout/AppShell"
import { RequireRole, RequireStaff, RequireStudent } from "../components/layout/guards"
import { StudentShell } from "../components/layout/StudentShell"
import { Maintenance, NotFound404, ServerError500, Terms } from "../components/layout/system"
import { effectiveRole, HOME_BY_ROLE, ROLE_ROUTES } from "../lib/roles"

function Placeholder({ title }: { title: string }) {
  return <h1 className="text-2xl font-bold text-ink">{title}</h1>
}

function RoleHome() {
  const { user } = useAuth()
  return <Navigate to={`/app/${HOME_BY_ROLE[effectiveRole(user) ?? ""] ?? "dashboard"}`} replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/sign-in" element={<Placeholder title="Staff sign-in (Wave 1)" />} />
      <Route path="/student/sign-in" element={<Placeholder title="Student sign-in (Wave 1)" />} />
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
        <Route
          path="admin"
          element={
            <RequireRole allow={ROLE_ROUTES.admin}>
              <Placeholder title="Admin console" />
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
  )
}
