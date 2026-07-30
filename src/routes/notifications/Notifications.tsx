/**
 * SC-054 — Notifications centre (FR-18-01 · US-18-01, folding in FR-18-03's delivery-status work).
 * REUSES `design/approved/screens/Notifications.tsx` in structure, copy and classes, composed from
 * `@design/components`.
 *
 * Divergences from the approved screen — LOGGED, not silently reconciled:
 *  (a) No `<AppShell {...chrome('teacher', 'Notifications', ...)}>` wrapper — same reasoning
 *      already logged on every other screen in this codebase (the app's own routed shell wraps
 *      every `/app/*` route).
 *  (b) FR-18-03 (delivery reliability) built a minimal version of this same screen first (its own
 *      ticket structurally precedes this one) and explicitly deferred the approved screen's channel
 *      tabs (`onChannel`) and "Mark all read" (`onMarkAllRead`) controls, since neither had a
 *      backing endpoint yet (logged in that ticket's gate doc: "a future FR-18-01 build adds them
 *      for real"). This ticket is that build: both are now wired to real behaviour — channel tabs
 *      filter the already-fetched feed client-side (alert-type vs not, the same split already used
 *      for the icon/tone below); "Mark all read" calls the new `POST /notifications/mark-all-read`
 *      (FR-18-01) and updates the fetched read state from the real response, never a fake local flag.
 *  (c) The approved `NotifItem` shape (tone/icon/title/body/time/unread) has no delivery-status
 *      concept — FR-18-03's delivery-status badge (derived from the real `deliveries[]`) is kept
 *      here unchanged; this ticket's own delta is the read/unread dot (derived from the real
 *      `read_at`, FR-18-01) and the channel tabs / mark-all-read wiring.
 */
import { type ReactNode, useEffect, useState } from "react"

import { Button, Card, CardBody, EmptyState, Icon, PageHeader, Tag } from "@design/components"

import {
  listNotifications, markAllRead, notificationsErrorMessage, type NotificationItem,
} from "./api"

const ICON_SQUARE = {
  danger: "bg-status-dangerBg text-status-danger",
  ok: "bg-status-okBg text-status-ok",
  ink: "bg-ink-50 text-ink",
} as const

interface ChannelDef { key: "all" | "alerts" | "email"; label: string; icon?: ReactNode }

const CHANNELS: ChannelDef[] = [
  { key: "all", label: "All" },
  { key: "alerts", label: "Alerts", icon: <Icon.Alert /> },
  { key: "email", label: "Email log", icon: <Icon.Mail /> },
]

function isAlert(n: NotificationItem): boolean {
  return n.type.includes("alert")
}

function matchesChannel(n: NotificationItem, channel: ChannelDef["key"]): boolean {
  if (channel === "all") return true
  return channel === "alerts" ? isAlert(n) : !isAlert(n)
}

function toneFor(n: NotificationItem): keyof typeof ICON_SQUARE {
  if (n.deliveries.some((d) => d.status === "failed")) return "danger"
  if (n.deliveries.some((d) => d.status === "retrying")) return "ink"
  return "ok"
}

function iconFor(n: NotificationItem) {
  return isAlert(n) ? <Icon.Alert /> : <Icon.Mail />
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

/** Never a silent gap (FR-18-03 DoD): a failed/retrying EMAIL delivery is called out explicitly. */
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
  const [channel, setChannel] = useState<ChannelDef["key"]>("all")
  const [marking, setMarking] = useState(false)
  // Separate from the load `error` (which replaces the whole list with a full EmptyState) — a
  // failed mark-all-read must not claim the feed "could not be loaded" when it clearly did.
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    listNotifications()
      .then(setItems)
      .catch((e: unknown) => setError(notificationsErrorMessage(e)))
  }, [])

  const loading = items === null && !error
  const unreadCount = items ? items.filter((n) => n.read_at === null).length : 0
  const visible = items ? items.filter((n) => matchesChannel(n, channel)) : []

  function handleMarkAllRead() {
    setMarking(true)
    setActionError(null)
    markAllRead()
      .then(() => {
        const now = new Date().toISOString()
        setItems((prev) => (prev ? prev.map((n) => (n.read_at === null ? { ...n, read_at: now } : n)) : prev))
      })
      .catch((e: unknown) => setActionError(notificationsErrorMessage(e)))
      .finally(() => setMarking(false))
  }

  return (
    <>
      <PageHeader
        crumb="In-app push + email — the only two channels"
        title="Notifications"
        sub={items ? `${unreadCount} unread` : undefined}
        right={
          <Button
            variant="ghost"
            icon={<Icon.CheckCircle />}
            onClick={handleMarkAllRead}
            disabled={marking || unreadCount === 0}
          >
            Mark all read
          </Button>
        }
      />

      {/* channel tabs — FR-18-01 delta: real client-side filter over the already-fetched feed */}
      <div className="mb-3.5 flex flex-wrap gap-1.5">
        {CHANNELS.map((c) => (
          <button
            key={c.key}
            onClick={() => setChannel(c.key)}
            className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-[12px] font-semibold [&_svg]:h-[13px] [&_svg]:w-[13px] ${c.key === channel ? "bg-ink text-white" : "border border-neutral-200 bg-surface text-neutral-600"}`} // token-ok: approved value, verbatim from screens/Notifications.tsx:72 (do-not-restyle)
          >
            {c.icon}{c.label}
          </button>
        ))}
      </div>

      {actionError && <p className="mb-3 text-xs text-status-danger">{actionError}</p>}

      <Card>
        <CardBody flush>
          {loading && <EmptyState title="Loading notifications…" />}
          {error && <EmptyState icon={<Icon.Alert />} title="Notifications could not be loaded">{error}</EmptyState>}
          {items && visible.length === 0 && (
            <EmptyState icon={<Icon.CheckCircle />} title="Nothing here yet">
              {channel === "all" ? "You have no notifications." : "Nothing in this channel yet."}
            </EmptyState>
          )}
          {visible.map((n) => (
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
              {n.read_at === null && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-coral" />}
            </div>
          ))}
        </CardBody>
      </Card>
    </>
  )
}
