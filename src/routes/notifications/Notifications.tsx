/**
 * SC-054 — Notifications centre (FR-18-03 · US-18-03). REUSES
 * `design/approved/screens/Notifications.tsx` in structure, copy and classes, composed from
 * `@design/components`.
 *
 * Divergences from the approved screen — LOGGED, not silently reconciled:
 *  (a) No `<AppShell {...chrome('teacher', 'Notifications', ...)}>` wrapper — same reasoning
 *      already logged on every other screen in this codebase (the app's own routed shell wraps
 *      every `/app/*` route).
 *  (b) FR-18-03's own traceability line lists FR-18-01 (the notifications-centre ticket) under
 *      "Enables", meaning FR-18-03 structurally PRECEDES it — no FR-18-01 build exists yet to
 *      compose against. This screen is the minimal real read FR-18-03's own DoD requires ("the
 *      notifications surface shows a failed/retrying delivery state") — channel tabs / mark-all-
 *      read (the approved screen's `onChannel`/`onMarkAllRead` props) have no backing endpoint
 *      yet and are NOT reproduced as dead controls; a future FR-18-01 build adds them for real.
 *  (c) The approved `NotifItem` shape (tone/icon/title/body/time/unread) has no delivery-status
 *      concept at all — this ticket's actual DoD is delivery reliability, so a delivery badge is
 *      added per item (the delta this ticket owns), derived from the real `deliveries[]` the BE
 *      returns, never fabricated.
 */
import { useEffect, useState } from "react"

import { Card, CardBody, EmptyState, Icon, PageHeader, Tag } from "@design/components"

import {
  listNotifications, notificationsErrorMessage, type NotificationItem,
} from "./api"

const ICON_SQUARE = {
  danger: "bg-status-dangerBg text-status-danger",
  ok: "bg-status-okBg text-status-ok",
  ink: "bg-ink-50 text-ink",
} as const

function toneFor(n: NotificationItem): keyof typeof ICON_SQUARE {
  if (n.deliveries.some((d) => d.status === "failed")) return "danger"
  if (n.deliveries.some((d) => d.status === "retrying")) return "ink"
  return "ok"
}

function iconFor(n: NotificationItem) {
  return n.type.includes("alert") ? <Icon.Alert /> : <Icon.Mail />
}

function bodyFor(n: NotificationItem): string {
  const reason = n.payload && typeof n.payload.reason === "string" ? n.payload.reason : null
  return reason ?? n.type
}

function timeFor(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

/** Never a silent gap (ticket DoD): a failed/retrying EMAIL delivery is called out explicitly. */
function deliveryBadge(n: NotificationItem) {
  const email = n.deliveries.find((d) => d.channel === "email")
  if (!email) return null
  if (email.status === "failed") {
    return <Tag tone="danger" icon={<Icon.Alert />}>Delivery failed</Tag>
  }
  if (email.status === "retrying") {
    return <Tag tone="warn" icon={<Icon.Clock />}>Retrying delivery</Tag>
  }
  return null
}

export function Notifications() {
  const [items, setItems] = useState<NotificationItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listNotifications()
      .then(setItems)
      .catch((e: unknown) => setError(notificationsErrorMessage(e)))
  }, [])

  const loading = items === null && !error

  return (
    <>
      <PageHeader
        crumb="In-app push + email — the only two channels"
        title="Notifications"
        sub={items ? `${items.length} total` : undefined}
      />

      <Card>
        <CardBody flush>
          {loading && <EmptyState title="Loading notifications…" />}
          {error && <EmptyState icon={<Icon.Alert />} title="Notifications could not be loaded">{error}</EmptyState>}
          {items && items.length === 0 && (
            <EmptyState icon={<Icon.CheckCircle />} title="Nothing here yet">
              You have no notifications.
            </EmptyState>
          )}
          {items?.map((n) => (
            <div key={n.id} className="flex items-start gap-3 border-b border-neutral-100 px-4 py-3 last:border-0">
              <span className={`grid h-[34px] w-[34px] shrink-0 place-items-center rounded-md [&_svg]:h-[17px] [&_svg]:w-[17px] ${ICON_SQUARE[toneFor(n)]}`}> {/* token-ok: approved value, verbatim from screens/Notifications.tsx:84 (do-not-restyle) */}
                {iconFor(n)}
              </span>
              <div className="flex-1">
                <b className="text-[13px] font-semibold">{n.type}</b> {/* token-ok: approved value, verbatim from screens/Notifications.tsx:88 (do-not-restyle) */}
                <p className="mt-0.5 text-[12px] text-neutral-500">{bodyFor(n)}</p> {/* token-ok: approved value, verbatim from screens/Notifications.tsx:89 (do-not-restyle) */}
                {deliveryBadge(n) && <div className="mt-1.5">{deliveryBadge(n)}</div>}
              </div>
              <span className="whitespace-nowrap text-[11px] font-medium text-neutral-400"> {/* token-ok: approved value, verbatim from screens/Notifications.tsx:91 (do-not-restyle) */}
                {timeFor(n.created_at)}
              </span>
            </div>
          ))}
        </CardBody>
      </Card>
    </>
  )
}
