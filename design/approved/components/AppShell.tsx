/**
 * AppShell — the authenticated staff shell (SC-089): role sidebar + topbar + content slot.
 * Presentational only: pass nav items, the active label, the signed-in person, breadcrumb, and children.
 * Topbar order is bell THEN profile (owner-approved). Coral marks the active nav item.
 * `dark` renders the internal-admin console sidebar.
 */
import * as React from 'react'
import { Badge } from './primitives'

export interface NavItem {
  key: string
  label: string
  icon: React.ReactNode
  badge?: React.ReactNode
  section?: boolean // renders as an uppercase group label instead of a link
}
export interface Person { initials: string; name: string; role: string }

export function Sidebar({ brand, nav, active, person, dark = false }: {
  brand: React.ReactNode; nav: NavItem[]; active?: string; person: Person; dark?: boolean
}) {
  return (
    <aside className={`flex w-[210px] shrink-0 flex-col border-r p-3.5 ${dark ? 'border-[#20242E] bg-[#12141A]' : 'border-neutral-200 bg-surface'}`}>
      <div className="flex items-center gap-2.5 px-1.5 pb-3.5">{brand}</div>
      <nav className="flex flex-col gap-0.5">
        {nav.map((it) =>
          it.section ? (
            <div key={it.key} className="px-2.5 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">{it.label}</div>
          ) : (
            <a key={it.key}
              className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium [&>svg]:h-[17px] [&>svg]:w-[17px] ${
                active === it.label
                  ? 'bg-coral-50 font-semibold text-coral-600 shadow-[inset_3px_0_0_theme(colors.coral.DEFAULT)] [&>svg]:text-coral-600'
                  : dark
                    ? 'text-[#9AA4B2] hover:bg-[#1B1F29] hover:text-white [&>svg]:text-neutral-400'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800 [&>svg]:text-neutral-400'
              }`}>
              {it.icon}<span>{it.label}</span>{it.badge && <Badge>{it.badge}</Badge>}
            </a>
          )
        )}
      </nav>
      <div className={`mt-auto flex items-center gap-2.5 border-t pt-3 ${dark ? 'border-[#20242E]' : 'border-neutral-200'}`}>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-ink-100 text-[11px] font-bold text-ink-700">{person.initials}</span>
        <div className={`text-[11.5px] font-semibold leading-tight ${dark ? 'text-white' : ''}`}>{person.name}<span className="block text-[10.5px] font-medium text-neutral-500">{person.role}</span></div>
      </div>
    </aside>
  )
}

export function Topbar({ crumb, person, bellIcon }: { crumb?: React.ReactNode; person: Person; bellIcon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-neutral-200 bg-surface px-5 py-2.5">
      {crumb && <div className="text-[13px] text-neutral-500">{crumb}</div>}
      {/* bell first, profile far-right (owner-approved) */}
      <button className="relative ml-auto grid h-[34px] w-[34px] place-items-center rounded-md border border-neutral-200 bg-surface text-neutral-500">
        {bellIcon}
        <span className="absolute right-2 top-[7px] h-[7px] w-[7px] rounded-full border-2 border-white bg-status-danger" />
      </button>
      <div className="flex items-center gap-2.5">
        <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-ink-100 text-[12px] font-bold text-ink-700">{person.initials}</span>
        <div className="text-[12px] font-semibold leading-tight">{person.name}<span className="block text-[11px] font-medium text-neutral-500">{person.role}</span></div>
      </div>
    </div>
  )
}

export function AppShell({ brand, nav, active, person, crumb, bellIcon, dark, children }: {
  brand: React.ReactNode; nav: NavItem[]; active?: string; person: Person
  crumb?: React.ReactNode; bellIcon: React.ReactNode; dark?: boolean; children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar brand={brand} nav={nav} active={active} person={person} dark={dark} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar crumb={crumb} person={person} bellIcon={bellIcon} />
        <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
      </div>
    </div>
  )
}

/** Page header used at the top of a content area. */
export function PageHeader({ crumb, title, sub, right }: { crumb?: string; title: React.ReactNode; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-2.5">
      <div>
        {crumb && <div className="mb-0.5 text-[11px] text-neutral-500">{crumb}</div>}
        <h3 className="flex items-center gap-3 text-[19px] font-extrabold tracking-tighter">{title}</h3>
        {sub && <div className="mt-0.5 text-[12px] text-neutral-500">{sub}</div>}
      </div>
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  )
}
