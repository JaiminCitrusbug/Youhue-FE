import { Link } from "react-router-dom"

import { Icon } from "@design/components"

import { KeyboardIcon } from "./CodeScreen"

/**
 * SC-022 — Student sign-in · scan QR (FR-01-02 · US-01-02).
 *
 * COMPOSED from the approved primitives (`@design/components`), mirroring the structure, copy and
 * classes of `design/approved/screens/StudentSignInQR.tsx` EXACTLY — minus the preview-only
 * `PhoneFrame` bezel (the surface is full-bleed, owned by ./index) and minus the `href="#"` footer
 * placeholders (real routed links here). Every px/size is the approved design's own value.
 */

const HEAD_ROW = "flex items-center gap-2.5 pb-0.5 pt-1.5"
const BACK_BTN = "grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-neutral-200 bg-surface text-neutral-600" // token-ok: approved Design-final-v3 value (do-not-restyle)
const BACK_ICON = "h-[18px] w-[18px]" // token-ok: approved Design-final-v3 value (do-not-restyle)
const HEAD_KICKER = "text-[12px] font-semibold text-neutral-500" // token-ok: approved Design-final-v3 value (do-not-restyle)
const HEAD_TITLE = "block text-[14px] font-bold text-neutral-900" // token-ok: approved Design-final-v3 value (do-not-restyle)
const VIEWFINDER = "relative mx-auto my-3.5 grid h-[214px] w-[214px] place-items-center overflow-hidden rounded-3xl bg-neutral-900" // token-ok: approved Design-final-v3 value (do-not-restyle)
const CORNER = "absolute h-[34px] w-[34px] rounded-lg border-[3px] border-white" // token-ok: approved Design-final-v3 value (do-not-restyle)
const CORNER_TL = "left-3.5 top-3.5 border-b-0 border-r-0"
const CORNER_TR = "right-3.5 top-3.5 border-b-0 border-l-0"
const CORNER_BL = "bottom-3.5 left-3.5 border-r-0 border-t-0"
const CORNER_BR = "bottom-3.5 right-3.5 border-l-0 border-t-0"
const VIEWFINDER_GLYPH = "h-[120px] w-[120px] text-white opacity-90" // token-ok: approved Design-final-v3 value (do-not-restyle)
const SCANLINE = "absolute left-5 right-5 top-[60%] h-0.5 bg-coral shadow-pop" // token-ok: approved Design-final-v3 value (do-not-restyle)
const LEAD = "mt-3.5 text-center text-[13.5px] text-neutral-500" // token-ok: approved Design-final-v3 value (do-not-restyle)
const ACTIONS = "mt-auto flex flex-col gap-2.5 pt-2"
const GHOST = "flex items-center justify-center gap-2 rounded-[14px] border border-neutral-200 bg-surface py-3 text-[14px] font-semibold text-neutral-700 hover:bg-neutral-50" // token-ok: approved Design-final-v3 value (do-not-restyle)
const GHOST_ICON = "h-[18px] w-[18px]" // token-ok: approved Design-final-v3 value (do-not-restyle)
const FOOT = "flex justify-center gap-3.5 pt-2 text-[11px] font-medium text-neutral-400" // token-ok: approved Design-final-v3 value (do-not-restyle)

export interface QRScreenProps {
  onBack: () => void
  onTypeCode: () => void
}

export function QRScreen({ onBack, onTypeCode }: QRScreenProps) {
  return (
    <>
      <div className={HEAD_ROW}>
        <button type="button" onClick={onBack} aria-label="Back" className={BACK_BTN}>
          <Icon.ArrowLeft className={BACK_ICON} />
        </button>
        <div className={HEAD_KICKER}>
          Scan to sign in
          <b className={HEAD_TITLE}>Scan your class QR</b>
        </div>
      </div>

      <div className={VIEWFINDER}>
        <span className={`${CORNER} ${CORNER_TL}`} />
        <span className={`${CORNER} ${CORNER_TR}`} />
        <span className={`${CORNER} ${CORNER_BL}`} />
        <span className={`${CORNER} ${CORNER_BR}`} />
        <Icon.Qr className={VIEWFINDER_GLYPH} />
        <span className={SCANLINE} />
      </div>

      <p className={LEAD}>
        Point at the QR code your teacher shows.
        <br />
        You can use this camera or your device&apos;s camera app.
      </p>

      <div className={ACTIONS}>
        <button type="button" onClick={onTypeCode} className={GHOST}>
          <KeyboardIcon className={GHOST_ICON} />
          Type a code instead
        </button>
      </div>

      {/* Real routed links — the approved preview's `href="#"` placeholders never ship. */}
      <div className={FOOT}>
        <Link to="/terms" className="text-neutral-400">
          Privacy
        </Link>
        <Link to="/terms" className="text-neutral-400">
          Help
        </Link>
      </div>
    </>
  )
}
