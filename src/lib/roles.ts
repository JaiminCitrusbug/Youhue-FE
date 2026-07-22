// Role/route mapping for the shell's UX guard. Backend authorization stays authoritative
// (INFRA-03 owns the real matrix); this is presentational routing only.
import type { Me } from "../app/AuthContext"

// The effective role used for routing/nav. Staff roles mirror the backend StaffRole enum
// (teacher, support, leadership, district). An admin-kind session carries no StaffRole
// (`/me` returns role: null), so it is treated as the "admin" role for the internal console.
export function effectiveRole(user: Me | null): string | null {
  if (!user) return null
  if (user.kind === "admin") return "admin"
  return user.role
}

// Which roles each staff sub-route permits. A role not listed for a route is denied the mount.
export const ROLE_ROUTES: Record<string, string[]> = {
  dashboard: ["teacher", "support"],
  leadership: ["leadership"],
  district: ["district"],
  admin: ["admin"],
}

// The landing route for each effective role (used by RoleHome).
export const HOME_BY_ROLE: Record<string, string> = {
  teacher: "dashboard",
  support: "dashboard",
  leadership: "leadership",
  district: "district",
  admin: "admin",
}
