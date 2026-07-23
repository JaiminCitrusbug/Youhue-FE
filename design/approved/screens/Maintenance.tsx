/** SC-013 — Maintenance. Presentational. */
import { SystemPage, Icon } from '../components'

export function Maintenance() {
  return (
    <SystemPage code={<Icon.Cog className="mx-auto h-14 w-14" />} title="We're doing maintenance">
      <p>Back shortly — maintenance is scheduled outside school hours so check-ins aren&rsquo;t disrupted.</p>
    </SystemPage>
  )
}
