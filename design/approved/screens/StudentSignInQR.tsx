/**
 * SC-022 — Student sign-in · scan QR  ·  FR-01-02  ·  US-01-02
 * Presentational only. In-app camera OR the device camera app; name-pick is always available too.
 */
import { PhoneFrame } from '../components'

const BackIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
)
const KeyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x={3} y={6} width={18} height={12} rx={2} /><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" />
  </svg>
)
const QrGlyph = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3M20 14v6M14 20h3" />
  </svg>
)

export interface StudentSignInQRProps {
  onBack?: () => void
  onTypeCode?: () => void
}

export function StudentSignInQR({ onBack, onTypeCode }: StudentSignInQRProps) {
  return (
    <PhoneFrame>
      <div className="flex items-center gap-2.5 pb-0.5 pt-1.5">
        <button onClick={onBack} className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-neutral-200 bg-surface text-neutral-600">
          <BackIcon className="h-[18px] w-[18px]" />
        </button>
        <div className="text-[12px] font-semibold text-neutral-500">Scan to sign in<b className="block text-[14px] font-bold text-neutral-900">Scan your class QR</b></div>
      </div>

      <div className="relative mx-auto my-3.5 grid h-[214px] w-[214px] place-items-center overflow-hidden rounded-3xl bg-neutral-900">
        <span className="absolute left-3.5 top-3.5 h-[34px] w-[34px] rounded-lg border-[3px] border-b-0 border-r-0 border-white" />
        <span className="absolute right-3.5 top-3.5 h-[34px] w-[34px] rounded-lg border-[3px] border-b-0 border-l-0 border-white" />
        <span className="absolute bottom-3.5 left-3.5 h-[34px] w-[34px] rounded-lg border-[3px] border-r-0 border-t-0 border-white" />
        <span className="absolute bottom-3.5 right-3.5 h-[34px] w-[34px] rounded-lg border-[3px] border-l-0 border-t-0 border-white" />
        <QrGlyph className="h-[120px] w-[120px] text-white opacity-90" />
        <span className="absolute left-5 right-5 top-[60%] h-0.5 bg-coral shadow-pop" />
      </div>

      <p className="mt-3.5 text-center text-[13.5px] text-neutral-500">
        Point at the QR code your teacher shows.<br />You can use this camera or your device&apos;s camera app.
      </p>

      <div className="mt-auto flex flex-col gap-2.5 pt-2">
        <button onClick={onTypeCode} className="flex items-center justify-center gap-2 rounded-[14px] border border-neutral-200 bg-surface py-3 text-[14px] font-semibold text-neutral-700 hover:bg-neutral-50">
          <KeyIcon className="h-[18px] w-[18px]" />Type a code instead
        </button>
      </div>

      <div className="flex justify-center gap-3.5 pt-2 text-[11px] font-medium text-neutral-400">
        <a href="#" className="text-neutral-400">Privacy</a>
        <a href="#" className="text-neutral-400">Help</a>
      </div>
    </PhoneFrame>
  )
}
