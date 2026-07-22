import { type ReactElement } from "react"
import { Navigate, Route, Routes } from "react-router-dom"

import { useAuth } from "./auth/AuthContext"
import { AppShell } from "./components/AppShell"
import { StudentShell } from "./components/StudentShell"
import { Maintenance, NotFound404, ServerError500, Terms } from "./pages/system"

function Placeholder({ title }: { title: string }) {
  return <h1 className="text-2xl font-bold text-ink">{title}</h1>
}

function RequireStaff({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="p-6">Loading…</p>
  if (!user || (user.kind !== "staff" && user.kind !== "admin")) {
    return <Navigate to="/sign-in" replace />
  }
  return children
}

function RequireStudent({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="p-6">Loading…</p>
  if (!user || user.kind !== "student") return <Navigate to="/student/sign-in" replace />
  return children
}

const HOME_BY_ROLE: Record<string, string> = {
  teacher: "dashboard",
  support: "dashboard",
  leadership: "leadership",
  district: "district",
  admin: "admin",
}

function RoleHome() {
  const { user } = useAuth()
  return <Navigate to={`/app/${HOME_BY_ROLE[user?.role ?? ""] ?? "dashboard"}`} replace />
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
        <Route path="dashboard" element={<Placeholder title="Class dashboard" />} />
        <Route path="leadership" element={<Placeholder title="Leadership overview" />} />
        <Route path="district" element={<Placeholder title="District admin" />} />
        <Route path="admin" element={<Placeholder title="Admin console" />} />
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
