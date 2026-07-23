/** Logo — the ink square + coral heart mark, with an optional wordmark. Presentational. */
import { Icon } from './icons'

export function Logo({ wordmark, sub, dark = false, size = 30 }: { wordmark?: string; sub?: string; dark?: boolean; size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`grid place-items-center rounded-md ${dark ? 'bg-black' : 'bg-ink'}`} style={{ width: size, height: size }}>
        <Icon.Heart className="h-4 w-4 text-coral" />
      </span>
      {wordmark && (
        <span className={`text-sm font-extrabold tracking-tight ${dark ? 'text-white' : ''}`}>
          {wordmark}
          {sub && <span className="block text-[9.5px] font-semibold uppercase tracking-wider text-neutral-400">{sub}</span>}
        </span>
      )}
    </div>
  )
}
