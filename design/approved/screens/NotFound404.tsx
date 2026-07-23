/** SC-011 — 404 Page not found. Presentational. */
import { SystemPage, Button, Icon } from '../components'

export function NotFound404() {
  return (
    <SystemPage code="404" title="Page not found">
      <p className="mb-5">The page you&rsquo;re looking for isn&rsquo;t here.</p>
      <Button variant="ink" icon={<Icon.Grid />}>Back to sign in</Button>
    </SystemPage>
  )
}
