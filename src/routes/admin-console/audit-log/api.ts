import { api, apiBlob } from "../../../api/client"

// FR-20-05 · GET /api/v1/admin/audit-log[/export] — filter (actor/action/school/date) + paginate
// the platform-wide, immutable audit trail (SC-080); `/export` is the SAME filter as a CSV
// extract. `view_audit_log`-gated; read-only — no PATCH/PUT/DELETE exists on this surface at any
// layer (the DB-level append-only trigger additionally blocks UPDATE/DELETE server-side).

export interface AuditLogEntry {
  id: string
  at: string
  actor_id: string
  action: string
  target: string
  school_id: string | null
}

export interface AuditLogListResponse {
  entries: AuditLogEntry[]
  total: number
  page: number
  page_size: number
}

export interface AuditLogFilter {
  actorId?: string
  action?: string
  schoolId?: string
  dateFrom?: string
  page?: number
  pageSize?: number
}

function buildQuery(f: AuditLogFilter): string {
  const params = new URLSearchParams()
  if (f.actorId?.trim()) params.set("actor_id", f.actorId.trim())
  if (f.action?.trim()) params.set("action", f.action.trim())
  if (f.schoolId?.trim()) params.set("school_id", f.schoolId.trim())
  if (f.dateFrom?.trim()) params.set("date_from", f.dateFrom.trim())
  if (f.page) params.set("page", String(f.page))
  if (f.pageSize) params.set("page_size", String(f.pageSize))
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

export function adminAuditLogErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : ""
  const status = Number(/(\d{3})/.exec(msg)?.[1])
  if (status === 403) return "You don't have permission to view the audit log."
  return "Something went wrong. Please try again."
}

export async function listAuditLog(filter: AuditLogFilter = {}): Promise<AuditLogListResponse> {
  return api<AuditLogListResponse>(`/admin/audit-log${buildQuery(filter)}`)
}

/** Downloads the same filtered set as a CSV `Blob` — the caller turns it into a file save. */
export async function exportAuditLog(filter: AuditLogFilter = {}): Promise<Blob> {
  return apiBlob(`/admin/audit-log/export${buildQuery(filter)}`)
}
