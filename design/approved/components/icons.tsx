/**
 * Icons — thin stroke set (currentColor), sized by the consuming component.
 * Presentational. Add more as screens need them; keep the 1.8 stroke + round joins for consistency.
 */
import * as React from 'react'

const S = (p: React.ReactNode) => (props: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={props.className}>{p}</svg>
)

export const Icon = {
  Grid: S(<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />),
  Alert: S(<path d="M12 4l8 14H4l8-14zM12 10v4M12 17h.01" />),
  Users: S(<path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />),
  Layers: S(<path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5" />),
  Book: S(<path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5zM18 3v16" />),
  Report: S(<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />),
  Cog: S(<><circle cx="12" cy="12" r="3" /><path d="M19.4 13a7.6 7.6 0 0 0 0-2l1.7-1.3-1.7-3-2 .8a7.6 7.6 0 0 0-1.7-1l-.3-2.1H9.6l-.3 2.1a7.6 7.6 0 0 0-1.7 1l-2-.8-1.7 3L5.6 11a7.6 7.6 0 0 0 0 2l-1.7 1.3 1.7 3 2-.8a7.6 7.6 0 0 0 1.7 1l.3 2.1h3.8l.3-2.1a7.6 7.6 0 0 0 1.7-1l2 .8 1.7-3z" /></>),
  Bell: S(<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />),
  Heart: S(<path d="M20.8 6.6a4.5 4.5 0 0 0-7.6-2A4.5 4.5 0 0 0 3.2 6.6C2.5 9.9 6 13 12 17c6-4 9.5-7.1 8.8-10.4z" />),
  Check: S(<path d="M20 6L9 17l-5-5" />),
  Flag: S(<path d="M5 21V4M5 4h11l-2 4 2 4H5" />),
  Clock: S(<><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>),
  Eye: S(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>),
  Pie: S(<><path d="M12 3v9l7 4" /><path d="M21 12a9 9 0 1 1-9-9" /></>),
  ChevronRight: S(<path d="M9 6l6 6-6 6" />),
  ArrowUp: S(<path d="M12 19V5M6 11l6-6 6 6" />),
  ArrowDown: S(<path d="M12 5v14M18 13l-6 6-6-6" />),
  Minus: S(<path d="M5 12h14" />),
  ArrowRight: S(<path d="M5 12h14M13 6l6 6-6 6" />),
  Pencil: S(<path d="M12 20h9M4 20l1-4 11-11 3 3L8 19l-4 1z" />),
  Mail: S(<><path d="M3 5h18v14H3z" /><path d="M3 6l9 7 9-7" /></>),
  Link: S(<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />),
  Send: S(<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />),
  Message: S(<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-5.2A8 8 0 1 1 21 12z" />),
  CheckCircle: S(<><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></>),
  Lock: S(<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>),
  Shield: S(<path d="M12 3l8 3v6c0 4.5-3 7.5-8 9-5-1.5-8-4.5-8-9V6z" />),
  Sparkles: S(<path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" />),
  Plus: S(<path d="M12 5v14M5 12h14" />),
  Download: S(<path d="M12 3v12M8 11l4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />),
  Upload: S(<path d="M12 15V3M8 7l4-4 4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />),
  Trash: S(<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13" />),
  Search: S(<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></>),
  Calendar: S(<><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>),
  ChevronDown: S(<path d="M6 9l6 6 6-6" />),
  ArrowLeft: S(<path d="M19 12H5M11 6l-6 6 6 6" />),
  Building: S(<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M14 21V9h4a2 2 0 0 1 2 2v10M7 7h.01M7 11h.01M7 15h.01" />),
  School: S(<path d="M3 9l9-5 9 5-9 5zM7 11v5c0 1 2 2 5 2s5-1 5-2v-5" />),
  Card: S(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></>),
  File: S(<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6" />),
  Home: S(<path d="M3 11l9-8 9 8M5 10v10h14V10" />),
  Refresh: S(<path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" />),
  X: S(<path d="M18 6L6 18M6 6l12 12" />),
  Chart: S(<path d="M4 20V10M10 20V4M16 20v-7" />),
  Clipboard: S(<><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V3h6v1M9 10h6M9 14h6" /></>),
  Play: S(<path d="M6 4l14 8-14 8z" />),
  Sound: S(<path d="M11 5L6 9H3v6h3l5 4zM16 9a3 3 0 0 1 0 6M19 6a7 7 0 0 1 0 12" />),
  Qr: S(<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3M20 14v6M14 20h3" />),
  Fire: S(<path d="M12 3c1 3-1 4-2 6a4 4 0 108 0c0-1-.5-2-1-3 2 1 4 3.5 4 7a7 7 0 11-14 0c0-4 3-5 5-7z" />),
  Info: S(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>),
}
