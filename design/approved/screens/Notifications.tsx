/**
 * SC-054 — Notifications centre  ·  FR-18-01  ·  US-18-01
 * Presentational only (props in, markup out; no data fetching, no business logic).
 * In-app push + email are the only two channels; alerts lead.
 */
import * as React from 'react'
import {
  AppShell, chrome, PageHeader, Card, CardBody, Button, Icon,
} from '../components'

type NotifTone = 'danger' | 'ok' | 'ink'

export interface NotifItem {
  tone: NotifTone
  icon: React.ReactNode
  title: string
  body: string
  time: string
  unread?: boolean
}

export interface NotificationsProps {
  channel?: string
  channels?: { key: string; label: string; icon?: React.ReactNode }[]
  unread?: number
  items?: NotifItem[]
  onChannel?: (key: string) => void
  onMarkAllRead?: () => void
}

const ICON_SQUARE: Record<NotifTone, string> = {
  danger: 'bg-status-dangerBg text-status-danger',
  ok: 'bg-status-okBg text-status-ok',
  ink: 'bg-ink-50 text-ink',
}

const DEFAULT_CHANNELS = [
  { key: 'all', label: 'All' },
  { key: 'alerts', label: 'Alerts', icon: <Icon.Alert /> },
  { key: 'email', label: 'Email log', icon: <Icon.Mail /> },
]

const DEFAULT_ITEMS: NotifItem[] = [
  { tone: 'danger', icon: <Icon.Alert />, title: 'Immediate alert — Liam O.', body: 'Concern-word + AI risk 0.86 · alerted you by email + in-app', time: '08:47', unread: true },
  { tone: 'danger', icon: <Icon.Alert />, title: 'Escalation — Ben T.', body: 'Unacknowledged 3 min → escalated to pastoral lead', time: '08:47', unread: true },
  { tone: 'ink', icon: <Icon.Clock />, title: 'Triage — Zara M.', body: 'Slow-burn low mood over 15 days · added to your triage queue', time: '07:30', unread: true },
  { tone: 'ok', icon: <Icon.CheckCircle />, title: 'Invitation accepted — J. Mensah', body: 'Now sharing “Year 5 — Maple” with you', time: 'Mon' },
  { tone: 'ink', icon: <Icon.Mail />, title: 'Weekly report ready', body: '“Year 5 — Maple · this week” is ready to view', time: 'Mon' },
]

export function Notifications({
  channel = 'all',
  channels = DEFAULT_CHANNELS,
  unread = 3,
  items = DEFAULT_ITEMS,
  onChannel, onMarkAllRead,
}: NotificationsProps) {
  return (
    <AppShell {...chrome('teacher', 'Notifications',
      <span><span className="font-semibold text-coral-text">Home</span> &nbsp;/&nbsp; Notifications</span>)}>
      <PageHeader
        crumb="In-app push + email — the only two channels"
        title="Notifications"
        sub={`${unread} unread`}
        right={<Button variant="ghost" icon={<Icon.CheckCircle />} onClick={onMarkAllRead}>Mark all read</Button>}
      />

      {/* channel tabs */}
      <div className="mb-3.5 flex flex-wrap gap-1.5">
        {channels.map((c) => (
          <button key={c.key} onClick={() => onChannel?.(c.key)}
            className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-[12px] font-semibold [&_svg]:h-[13px] [&_svg]:w-[13px] ${
              c.key === channel ? 'bg-ink text-white' : 'border border-neutral-200 bg-surface text-neutral-600'
            }`}>
            {c.icon}{c.label}
          </button>
        ))}
      </div>

      <Card>
        <CardBody flush>
          {items.map((n, i) => (
            <div key={i} className="flex items-start gap-3 border-b border-neutral-100 px-4 py-3 last:border-0">
              <span className={`grid h-[34px] w-[34px] shrink-0 place-items-center rounded-md [&_svg]:h-[17px] [&_svg]:w-[17px] ${ICON_SQUARE[n.tone]}`}>
                {n.icon}
              </span>
              <div className="flex-1">
                <b className="text-[13px] font-semibold">{n.title}</b>
                <p className="mt-0.5 text-[12px] text-neutral-500">{n.body}</p>
              </div>
              <span className="whitespace-nowrap text-[11px] font-medium text-neutral-400">{n.time}</span>
              {n.unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-coral" />}
            </div>
          ))}
        </CardBody>
      </Card>
    </AppShell>
  )
}
