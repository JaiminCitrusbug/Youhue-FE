import { Link, Outlet, useNavigate } from "react-router-dom"

import { useAuth } from "../../app/AuthContext"
import { effectiveRole } from "../../lib/roles"

// Role-driven nav (fed by the backend role; INFRA-03 owns who may). Presentational only.
const NAV_BY_ROLE: Record<string, { label: string; to: string }[]> = {
  // FR-02-03: only a class owner (teacher) may invite a colleague — `support` staff can never
  // own a class (application/authz/services.py), so this link is omitted from their nav.
  teacher: [
    { label: "Class dashboard", to: "/app/dashboard" },
    { label: "Invite colleague", to: "/app/roster/invite" },
    { label: "Activities", to: "/app/activities" },
  ],
  support: [
    { label: "Shared class", to: "/app/dashboard" },
    { label: "Activities", to: "/app/activities" },
  ],
  leadership: [
    { label: "Leadership overview", to: "/app/leadership" },
    { label: "Staff", to: "/app/leadership/staff" },
    { label: "Concern words", to: "/app/leadership/settings/concern-words" },
    { label: "Alert routing", to: "/app/leadership/settings/alert-routing" },
    { label: "Access window", to: "/app/leadership/settings/access-window" },
  ],
  district: [{ label: "District admin", to: "/app/district" }],
  admin: [
    { label: "Admin console", to: "/app/admin" },
    { label: "Seed activities", to: "/app/admin/seed-activities" },
  ],
}

export function AppShell() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const role = effectiveRole(user)
  const nav = NAV_BY_ROLE[role ?? ""] ?? []

  async function handleLogout() {
    await signOut()
    navigate("/sign-in")
  }

  return (
    <div className="flex min-h-screen bg-canvas font-sans text-neutral-900">
      <aside className="flex w-60 shrink-0 flex-col bg-ink text-neutral-50">
        <div className="p-4 text-lg font-black tracking-tight">Youhue</div>
        <nav className="flex flex-col gap-1 px-2">
          {nav.map((item) => (
            <Link key={item.to} to={item.to} className="rounded-md px-3 py-2 text-sm hover:bg-ink-600">
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        {/* topbar: bell THEN profile (owner-approved order); logout lives in the profile block */}
        <header className="flex items-center justify-end gap-2.5 border-b border-neutral-200 bg-surface px-6 py-3">
          {/* FR-18-01 — the notifications centre (SC-054) now exists; the bell routes there for
              real (previously an explicit disabled placeholder — never a dead control now). */}
          <Link
            to="/app/notifications"
            aria-label="Notifications"
            title="Notifications"
            className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <span aria-hidden>🔔</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">{role ?? "staff"}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md bg-ink px-3 py-1.5 text-sm text-neutral-50 hover:bg-ink-600"
            >
              Log out
            </button>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
