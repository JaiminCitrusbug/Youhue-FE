/**
 * useSignInComplete — the one place a freshly issued staff access token becomes a live session.
 * Stores the token IN MEMORY (setToken, never localStorage), refreshes `/me` so the role resolves,
 * then navigates to `/app` where RoleHome lands the staff member on their role's home screen.
 */
import { useCallback } from "react"
import { useNavigate } from "react-router-dom"

import { setToken } from "../../api/client"
import { useAuth } from "../../app/AuthContext"

export function useSignInComplete(): (accessToken: string) => Promise<void> {
  const { refresh } = useAuth()
  const navigate = useNavigate()
  return useCallback(
    async (accessToken: string) => {
      setToken(accessToken)
      await refresh()
      navigate("/app")
    },
    [refresh, navigate],
  )
}

/**
 * Resolve the SSO tenant context (school_code) without adding a field to the approved sign-in card:
 * prefer an explicit `?school=<CODE>` on the sign-in URL (invite/login links carry it), else fall
 * back to the domain of the school email the user typed. See the gate doc for the BE reconciliation note.
 */
export function resolveSchoolCode(email: string, search: string): string {
  const fromUrl = new URLSearchParams(search).get("school")
  if (fromUrl) return fromUrl
  const at = email.indexOf("@")
  return at >= 0 ? email.slice(at + 1) : ""
}
