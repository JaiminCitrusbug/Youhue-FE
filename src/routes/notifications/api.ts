import { api } from "../../api/client"

// FR-18-03 · GET /api/v1/notifications — the caller's own notification feed, each with its
// per-channel delivery status (INFRA-05 transport + FR-18-03 reliability: confirmed, retried with
// backoff, and surfaced — never silently lost). No FR-18-01 notifications-centre ticket exists yet
// (this ticket structurally precedes it — see `Notifications.tsx` docstring), so this is the
// minimal real read this ticket's own DoD needs: delivery failure/retry MUST be visible here.

export type DeliveryChannel = "in_app" | "email"
export type DeliveryStatus = "queued" | "sent" | "delivered" | "failed" | "retrying"

export interface Delivery {
  channel: DeliveryChannel
  status: DeliveryStatus
}

export interface NotificationItem {
  id: string
  type: string
  payload: Record<string, unknown> | null
  created_at: string
  deliveries: Delivery[]
}

export function notificationsErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : ""
  const status = Number(/(\d{3})/.exec(msg)?.[1])
  if (status === 403) return "You don't have permission to view notifications."
  return "Something went wrong. Please try again."
}

export async function listNotifications(): Promise<NotificationItem[]> {
  return api<NotificationItem[]>("/notifications")
}
