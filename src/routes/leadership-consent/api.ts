import { getToken, setToken } from "../../api/client"

// FR-20-06 · POST /api/v1/students/{id}/consent — school-mediated verifiable parental-consent
// capture (SC-088; COPPA). Leadership records consent on the parent's behalf; there is no
// parent-facing screen (FERPA school-official exception).
//
//   POST { status: "verified" | "pending" } -> 200 { status }
//   403   cross-school student, or a role other than `leadership`   (audit-logged BE-side)
//   422   an invalid consent record (e.g. an out-of-enum status)
//   500   { error }   persistence failure
//
// The bearer is attached from the in-memory token store (src/api/client.ts — Authorization:
// Bearer, never localStorage). Errors are surfaced as GENERIC copy, never swallowed.

export type ConsentStatus = "pending" | "verified"

export interface ConsentResponse {
  status: ConsentStatus
}

const FORBIDDEN = "You don't have permission to record consent for this student."
const GENERIC_ERROR = "Couldn't record consent. Please try again."
const INVALID = "That consent record isn't valid — check the student ID and try again."

export async function recordConsent(
  studentId: string,
  status: ConsentStatus = "verified",
): Promise<ConsentResponse> {
  const token = getToken()
  const res = await fetch(`/api/v1/students/${studentId}/consent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ status }),
  })

  if (res.status === 401) {
    // The staff session is invalid/expired — drop the stale token so it can't persist.
    setToken(null)
    throw new Error(FORBIDDEN)
  }
  if (res.status === 403) throw new Error(FORBIDDEN)
  if (res.status === 422) throw new Error(INVALID)
  if (!res.ok) throw new Error(GENERIC_ERROR)

  return (await res.json()) as ConsentResponse
}
