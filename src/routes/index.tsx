import { useEffect } from "react"
import { Navigate, Route, Routes, useNavigate } from "react-router-dom"

import { setToken } from "../api/client"
import { useAuth } from "../app/AuthContext"
import { AppShell } from "../components/layout/AppShell"
import { RequireRole, RequireStaff, RequireStudent } from "../components/layout/guards"
import { StudentShell } from "../components/layout/StudentShell"
import {
  CoppaFerpa, Maintenance, NotFound404, PrivacyPolicy, ServerError500, Terms,
} from "../components/layout/system"
import { StaffAuthRoutes } from "../features/staff-auth/StaffAuthRoutes"
import { effectiveRole, HOME_BY_ROLE, ROLE_ROUTES } from "../lib/roles"
import { AcceptInviteApp } from "./accept-invite"
import { CheckInApp } from "./checkin"
import { InviteColleagueApp } from "./class-invitations"
import { ClassDashboardApp } from "./dashboard"
import { StudentDetailApp } from "./student-detail"
import { SeedActivities } from "./admin-console/seed-activities/SeedActivities"
import { SchoolAccounts } from "./admin-console/schools/SchoolAccounts"
import { SchoolSupport } from "./admin-console/schools/SchoolSupport"
import { SchoolTrial } from "./admin-console/schools/SchoolTrial"
import { AdminSignInApp } from "./admin-signin"
import { DefaultWordListsApp } from "./admin-word-lists"
import { ApprovalDecisionApp, SchoolApprovalsApp } from "./district-approvals"
import { LeadershipConsentApp } from "./leadership-consent"
import { AccessWindow } from "./leadership/AccessWindow"
import { AlertRouting } from "./leadership/AlertRouting"
import { ConcernWords } from "./leadership/ConcernWords"
import { StaffManagement } from "./leadership/StaffManagement"
import { TriageQueue } from "./leadership/TriageQueue"
import { SubscriptionApp } from "./subscription"
import { RosterListApp } from "./roster"
import { RosterImportApp } from "./roster-import"
import { SchoolRegisterApp } from "./school-register"
import { StudentSignInApp } from "./student-signin"
import { MyHistoryApp } from "./student-history"

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
      {/* FR-02-03 — accepting a shared-class colleague invitation owns its own route module
          (decision #4), PUBLIC/pre-login (the invitee has no account yet, or is only proving
          control of the invite link). */}
      <Route path="/accept-invite" element={<AcceptInviteApp />} />
      <Route
        path="/app"
        element={
          <RequireStaff>
            <AppShell />
          </RequireStaff>
        }
      >
        <Route index element={<RoleHome />} />
        {/* FR-10-01 — SC-027 class dashboard: weighted mood index + trend. Replaces the trunk-era
            stub (same precedent as FR-04-01/FR-02-02/etc. this session). */}
        <Route
          path="dashboard"
          element={
            <RequireRole allow={ROLE_ROUTES.dashboard}>
              <ClassDashboardApp />
            </RequireRole>
          }
        />
        {/* FR-10-02 — SC-028 single-student drill-in from the class dashboard. Same role gate as
            `dashboard` above; the BE additionally re-checks own/shared class scope per student
            (403), same-school (403), and unknown id (404). */}
        <Route
          path="dashboard/students/:studentId"
          element={
            <RequireRole allow={ROLE_ROUTES.dashboard}>
              <StudentDetailApp />
            </RequireRole>
          }
        />
        {/* FR-03-01 — SC-036 CSV roster import. Same RequireRole gate as `dashboard` (teacher /
            support own a class roster); the BE additionally re-checks role AND same-school. */}
        <Route
          path="roster/import"
          element={
            <RequireRole allow={ROLE_ROUTES.dashboard}>
              <RosterImportApp />
            </RequireRole>
          }
        />
        {/* FR-03-05 — SC-037 roster list + re-import reconciliation. Sibling to `roster/import`
            above (a DIFFERENT screen — a management view, not another upload form; see the logged
            reasoning in `./roster/index.tsx`), same RequireRole gate; the BE additionally
            re-checks role AND same-school on both the GET list and the reconcile POST. */}
        <Route
          path="roster"
          element={
            <RequireRole allow={ROLE_ROUTES.dashboard}>
              <RosterListApp />
            </RequireRole>
          }
        />
        {/* FR-02-03 — SC-059 invite a colleague to co-teach a shared class. Class-owner
            (teacher)-only — `support` staff hold only shared-scope access, never owner, so they
            are excluded from this route entirely (see `lib/roles.ts`); the BE additionally
            re-checks ownership AND same-school on every write. */}
        <Route
          path="roster/invite"
          element={
            <RequireRole allow={ROLE_ROUTES.classInvitations}>
              <InviteColleagueApp />
            </RequireRole>
          }
        />
        {/* FR-12-06 — SC-038 triage queue: open, triage-band flags for human review (GATE G-9).
            Any-staff-role, school-scoped (same posture as the BE's other /risk/* endpoints). */}
        <Route
          path="triage"
          element={
            <RequireRole allow={ROLE_ROUTES.triage}>
              <TriageQueue />
            </RequireRole>
          }
        />
        {/* FR-16-02 — the leadership hub: staff management (SC-057) is the landing screen (mirrors
            the district/admin pattern: the role's home route IS its first real, fully-wired
            screen), plus sibling routes for the leadership-exposed settings surfaces. */}
        <Route
          path="leadership"
          element={
            <RequireRole allow={ROLE_ROUTES.leadership}>
              <StaffManagement />
            </RequireRole>
          }
        />
        <Route
          path="leadership/staff"
          element={
            <RequireRole allow={ROLE_ROUTES.leadership}>
              <StaffManagement />
            </RequireRole>
          }
        />
        <Route
          path="leadership/settings/concern-words"
          element={
            <RequireRole allow={ROLE_ROUTES.leadership}>
              <ConcernWords />
            </RequireRole>
          }
        />
        <Route
          path="leadership/settings/alert-routing"
          element={
            <RequireRole allow={ROLE_ROUTES.leadership}>
              <AlertRouting />
            </RequireRole>
          }
        />
        <Route
          path="leadership/settings/access-window"
          element={
            <RequireRole allow={ROLE_ROUTES.leadership}>
              <AccessWindow />
            </RequireRole>
          }
        />
        {/* FR-17-01 — SC-085 subscription/entitlements. The BE endpoint itself is any-staff
            (Scenario 2: "staff use the platform"), but the entry point lives under the
            leadership nav, matching the approved screen's own `chrome('leadership', ...)`. */}
        <Route
          path="leadership/subscription"
          element={
            <RequireRole allow={ROLE_ROUTES.leadership}>
              <SubscriptionApp />
            </RequireRole>
          }
        />
        {/* FR-20-06 — SC-088 parental-consent attestation (COPPA), school-mediated: leadership
            confirms consent on the parent's behalf. The same RequireRole gate as `leadership`
            above; the BE also re-checks the `leadership` role and school scope (403 otherwise). */}
        <Route
          path="leadership/consent"
          element={
            <RequireRole allow={ROLE_ROUTES.leadership}>
              <LeadershipConsentApp />
            </RequireRole>
          }
        />
        {/* FR-02-02 — District/Trust leadership reviews + approves/rejects a pending school
            (SC-069 queue, SC-070 single-school decide). Replaces the bare placeholder. */}
        <Route
          path="district"
          element={
            <RequireRole allow={ROLE_ROUTES.district}>
              <SchoolApprovalsApp />
            </RequireRole>
          }
        />
        <Route
          path="district/:schoolId"
          element={
            <RequireRole allow={ROLE_ROUTES.district}>
              <ApprovalDecisionApp />
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
        {/* FR-19-02 — admin console: school accounts (SC-075), the one-time 14-day trial extension
            (SC-076), and permission-bound audited support access (SC-077). Same RequireRole gate;
            the BE additionally enforces `manage_accounts` / `access_child_data` RBAC per action. */}
        <Route
          path="admin/schools"
          element={
            <RequireRole allow={ROLE_ROUTES.admin}>
              <SchoolAccounts />
            </RequireRole>
          }
        />
        <Route
          path="admin/schools/:schoolId/trial"
          element={
            <RequireRole allow={ROLE_ROUTES.admin}>
              <SchoolTrial />
            </RequireRole>
          }
        />
        <Route
          path="admin/schools/:schoolId/support"
          element={
            <RequireRole allow={ROLE_ROUTES.admin}>
              <SchoolSupport />
            </RequireRole>
          }
        />
      </Route>
      {/* FR-04-01 — SC-023 daily check-in: mood select (index) then a SEPARATE reflection step
          (`/student/reflection`), owned by its own container so the two steps share state the
          same way `student-signin/index.tsx` does for its own multi-step flow. */}
      <Route
        path="/student"
        element={
          <RequireStudent>
            <StudentShell />
          </RequireStudent>
        }
      >
        {/* FR-08-01 · SC-025 — the caller's own moods-over-time + reflections; must be declared
            BEFORE the `*` catch-all below or CheckInApp's own nested `*` route would swallow it. */}
        <Route path="history" element={<MyHistoryApp />} />
        <Route path="*" element={<CheckInApp />} />
      </Route>
      <Route path="/terms" element={<Terms />} />
      {/* FR-20-06 — SC-009 Privacy · SC-010 COPPA/FERPA: static legal pages, no state/API (same
          pattern as /terms above). */}
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/coppa-ferpa" element={<CoppaFerpa />} />
      <Route path="/maintenance" element={<Maintenance />} />
      <Route path="/500" element={<ServerError500 />} />
      <Route path="*" element={<NotFound404 />} />
    </Routes>
    </>
  )
}
