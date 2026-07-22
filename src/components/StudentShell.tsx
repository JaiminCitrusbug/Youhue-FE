import { Outlet, useNavigate } from "react-router-dom"

import { useAuth } from "../auth/AuthContext"

// Student frame — a SEPARATE surface from the staff app: coral theme, no staff features/sidebar.
export function StudentShell() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate("/student/sign-in")
  }

  return (
    <div className="min-h-screen bg-coral-canvas font-sans text-neutral-900">
      <header className="flex items-center justify-between px-4 py-3">
        <span className="text-lg font-black tracking-tight text-coral">Youhue</span>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md bg-coral px-3 py-1.5 text-sm text-surface hover:bg-coral-600"
        >
          Log out
        </button>
      </header>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  )
}
