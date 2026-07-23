/**
 * Role chrome presets — the per-role sidebar nav + signed-in person, so every screen
 * shares one nav definition. Use `chrome(role, active, crumb)` and spread into <AppShell>.
 */
import * as React from 'react'
import { Icon } from './icons'
import { Logo } from './Logo'
import type { NavItem, Person } from './AppShell'

export const teacherNav: NavItem[] = [
  { key: 'dash', label: 'Dashboard', icon: <Icon.Grid /> },
  { key: 'alerts', label: 'Alerts & triage', icon: <Icon.Alert />, badge: 3 },
  { key: 'roster', label: 'Roster', icon: <Icon.Users /> },
  { key: 'groups', label: 'Groups', icon: <Icon.Layers /> },
  { key: 'checkins', label: 'Check-ins', icon: <Icon.Clock /> },
  { key: 'activities', label: 'Activities', icon: <Icon.Book /> },
  { key: 'reports', label: 'Reports', icon: <Icon.Report /> },
  { key: 'notifs', label: 'Notifications', icon: <Icon.Bell /> },
  { key: 'sep', label: 'School', icon: null, section: true },
  { key: 'settings', label: 'Settings', icon: <Icon.Cog /> },
]

export const leadershipNav: NavItem[] = [
  { key: 'ov', label: 'Overview', icon: <Icon.Grid /> },
  { key: 'staff', label: 'Staff', icon: <Icon.Users /> },
  { key: 'act', label: 'Activities', icon: <Icon.Book /> },
  { key: 'rep', label: 'Reports', icon: <Icon.Report /> },
  { key: 'sep', label: 'School', icon: null, section: true },
  { key: 'cw', label: 'Concern words', icon: <Icon.Flag /> },
  { key: 'ar', label: 'Alert routing', icon: <Icon.Alert /> },
  { key: 'cal', label: 'Calendar & window', icon: <Icon.Clock /> },
  { key: 'sub', label: 'Subscription', icon: <Icon.Report /> },
  { key: 'ed', label: 'Export & delete', icon: <Icon.Book /> },
  { key: 'con', label: 'Consent', icon: <Icon.Check /> },
  { key: 'set', label: 'Settings', icon: <Icon.Cog /> },
]

export const districtNav: NavItem[] = [
  { key: 'ov', label: 'Overview', icon: <Icon.Grid /> },
  { key: 'ap', label: 'Approvals', icon: <Icon.Check /> },
  { key: 'sep', label: 'Account', icon: null, section: true },
  { key: 'set', label: 'Settings', icon: <Icon.Cog /> },
]

export const adminNav: NavItem[] = [
  { key: 'dash', label: 'Dashboard', icon: <Icon.Grid /> },
  { key: 'sch', label: 'Schools', icon: <Icon.Users /> },
  { key: 'tr', label: 'Trials', icon: <Icon.Clock /> },
  { key: 'sup', label: 'Support', icon: <Icon.Flag /> },
  { key: 'seed', label: 'Seed content', icon: <Icon.Book /> },
  { key: 'wl', label: 'Word lists', icon: <Icon.Alert /> },
  { key: 'aud', label: 'Audit log', icon: <Icon.Report /> },
  { key: 'sep', label: '', icon: null, section: true },
  { key: 'prof', label: 'Profile', icon: <Icon.Cog /> },
]

type Role = 'teacher' | 'leadership' | 'district' | 'admin'
const NAV: Record<Role, NavItem[]> = { teacher: teacherNav, leadership: leadershipNav, district: districtNav, admin: adminNav }
const PERSON: Record<Role, Person> = {
  teacher: { initials: 'RO', name: 'R. Okafor', role: 'Teacher' },
  leadership: { initials: 'JM', name: 'J. Mensah', role: 'Head of Wellbeing' },
  district: { initials: 'DA', name: 'D. Adeyemi', role: 'Trust lead' },
  admin: { initials: 'TN', name: 'T. Ng', role: 'Internal admin' },
}

/** Spread into <AppShell {...chrome('teacher','Roster','Roster / Import')}>…</AppShell>. */
export function chrome(role: Role, active: string, crumb?: React.ReactNode) {
  return {
    brand: <Logo wordmark={role === 'admin' ? 'Console' : 'Wellbeing'} sub={role === 'admin' ? 'Internal admin' : role[0].toUpperCase() + role.slice(1)} dark={role === 'admin'} />,
    nav: NAV[role],
    active,
    person: PERSON[role],
    bellIcon: <Icon.Bell className="h-4 w-4" />,
    crumb,
    dark: role === 'admin',
  }
}
