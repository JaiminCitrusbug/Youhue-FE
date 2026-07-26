import { api } from "../../api/client"

// FR-20-01 · /api/v1/schools/{id}/export[...] — school data export (SC-064, GATE G-12).
// Async: POST returns 202 (accepted, status=pending); poll GET .../exports/{id} for status=ready.
// Leadership-only, own-school-only — the BE re-checks role AND school_id on every call.

export type ExportKind = "export" | "export_and_delete"
export type ExportStatus = "pending" | "ready" | "completed"

export interface ExportAccepted {
  export_id: string
  status: ExportStatus
}

export interface ExportStatusOut {
  export_id: string
  kind: ExportKind
  status: ExportStatus
  created_at: string
  download_url: string | null
}

export function exportErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : ""
  const status = Number(/(\d{3})/.exec(msg)?.[1])
  if (status === 403) return "You don't have permission to export this school's data."
  return "Something went wrong. Please try again."
}

export async function requestExport(schoolId: string): Promise<ExportAccepted> {
  return api<ExportAccepted>(`/schools/${schoolId}/export`, {
    method: "POST",
    body: JSON.stringify({}),
  })
}

export async function getExportStatus(
  schoolId: string,
  exportId: string,
): Promise<ExportStatusOut> {
  return api<ExportStatusOut>(`/schools/${schoolId}/exports/${exportId}`)
}
