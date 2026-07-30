import { api } from "../../api/client"

// FR-18-01 (SC-054 notifications centre) + FR-18-03 (delivery reliability) — the caller's own
// notification feed, each with its per-channel delivery status (INFRA-05 transport + FR-18-03:
// confirmed, retried with backoff, and surfaced — never silently lost) and its own read state
// (FR-18-01: `read_at` null = unread; set in bulk by `markAllRead`).

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
  read_at: string | null
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

// FR-18-01 (SC-054's `onMarkAllRead`): marks every unread notification in the caller's own feed
// as read, in one server-side call — never a client-side-only/fake "read" state.
export async function markAllRead(): Promise<{ marked: number }> {
  return api<{ marked: number }>("/notifications/mark-all-read", { method: "POST" })
}
