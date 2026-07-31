import { api } from "../../api/client"

// FR-13-04 · GET /api/v1/flags/{id}/guidance (SC-040) — advisory guidance for the teacher opening
// the response to a flagged check-in: suggested wording, sensible next steps and useful links.
// Read-only, no persistence; the teacher may use, adapt or ignore every suggestion.

export interface GuidanceLink {
  label: string
}

export interface Guidance {
  suggested_wording: string
  next_steps: string[]
  links: GuidanceLink[]
}

export async function getGuidance(flagId: string): Promise<Guidance> {
  return api<Guidance>(`/flags/${flagId}/guidance`)
}
