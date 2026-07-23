/** SC-012 — 500 Something went wrong. Presentational. */
import { SystemPage, Button, Icon } from '../components'

export function ServerError500() {
  return (
    <SystemPage code="500" title="Something went wrong">
      <p className="mb-5">We hit an unexpected error. Please try again.</p>
      <div className="flex justify-center gap-2.5">
        <Button variant="ink" icon={<Icon.ArrowRight />}>Retry</Button>
        <Button variant="ghost" icon={<Icon.Grid />}>Home</Button>
      </div>
    </SystemPage>
  )
}
