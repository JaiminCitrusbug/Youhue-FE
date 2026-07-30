import { api } from "../../api/client"

// FR-20-02 · POST /api/v1/schools/{id}/export-and-delete — school exit: export-then-hard-delete
// (SC-065). Reuses FR-20-01's `DataExport` row/poll machinery (`kind=export_and_delete`, polled
// via the SAME `GET /schools/{id}/exports/{id}` this module does not redefine — see
// `./export-api`'s `getExportStatus`). THIS one endpoint answers BOTH steps of the ordered exit —
// the first call offers the export, a LATER call (once that export is `ready`) performs the
// irreversible hard delete. Always 200 (never 202 — this ticket's own contract).
//   1st call                  -> { deleted: false, status: "pending" }   (export offered)
//   later call, not ready yet -> 409 { detail: { code: "export_not_retrieved", message } }
//   later call, export ready  -> { deleted: true,  status: "completed" } (hard-deleted)
// Leadership-only, own-school-only — the BE re-checks role AND school_id on every call.

export type ExportAndDeleteStatus = "pending" | "ready" | "completed"

export interface ExportAndDeleteOut {
  export_id: string
  status: ExportAndDeleteStatus
  deleted: boolean
}

export function exportAndDeleteErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : ""
  const status = Number(/(\d{3})/.exec(msg)?.[1])
  if (status === 403) return "You don't have permission to delete this school's data."
  if (status === 409) return "The full export isn't ready yet — check its status, then try again."
  return "Something went wrong. Please try again."
}

export async function requestExportAndDelete(schoolId: string): Promise<ExportAndDeleteOut> {
  return api<ExportAndDeleteOut>(`/schools/${schoolId}/export-and-delete`, { method: "POST" })
}
