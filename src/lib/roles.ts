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
  // FR-02-03: only a class OWNER may invite a colleague to share it. `support` staff hold only
  // shared-scope class access (never owner, by construction — application/authz/services.py),
  // so they are excluded here rather than reaching a route that can never do anything for them.
  classInvitations: ["teacher"],
  // FR-12-06 (SC-038): the BE (`GET /risk/triage`) is any-staff-role, school-scoped (same posture
  // as /risk/score) — every staff role that can see students' wellbeing signals may review the
  // triage queue, matching the approved screen's teacher-facing chrome plus leadership oversight.
  triage: ["teacher", "support", "leadership"],
  // FR-18-03 (SC-054): the BE (`GET /notifications`) is any-staff-role, self-scoped (a recipient
  // reads only their own feed) — every staff role that can receive an alert/invite/transactional
  // notification may view their own notifications centre.
  notifications: ["teacher", "support", "leadership", "district"],
}

// The landing route for each effective role (used by RoleHome).
export const HOME_BY_ROLE: Record<string, string> = {
  teacher: "dashboard",
  support: "dashboard",
  leadership: "leadership",
  district: "district",
  admin: "admin",
}
