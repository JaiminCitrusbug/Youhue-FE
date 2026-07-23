# Component API — how to write a screen (READ FIRST)

You translate an already-approved **preview screen** into a **React + Tailwind presentational component**.
The visual/content truth is the preview HTML — match it. **Presentational only**: props in, markup out; no data
fetching, no business logic, no API calls, no `useState` for anything but trivial local UI. Use **real content**
from the preview (never lorem). Import everything from the shared library — **never hardcode a colour/size**.

## File convention
- One file per screen: `approved/screens/<PascalCaseName>.tsx`, exporting `export function <Name>() { … }`.
- Start each file with a header comment: `/** SC-0xx — Title · FR-xx-xx · US-xx-xx. Presentational. */`
- Import: `import { … } from '../components'` (barrel). Types come from there too.

## Staff screens — use the shell
```tsx
import { AppShell, chrome, PageHeader, Card, CardHeader, CardBody, Table, Tag, Button, Icon } from '../components'
export function RosterList() {
  return (
    <AppShell {...chrome('teacher', 'Roster', <>Roster</>)}>
      <PageHeader title="Students" right={<Button variant="ghost" icon={<Icon.Users/>}>Re-import</Button>} />
      <Card>
        <CardHeader icon={<Icon.Users/>} title="Students" />
        <CardBody flush>
          <Table head={['Name','Age band','Status']} rows={[
            [<>Aisha K.</>, <>8–11</>, <Tag tone="ok" icon={<Icon.Check/>}>Active</Tag>],
          ]}/>
        </CardBody>
      </Card>
    </AppShell>
  )
}
```
`chrome(role, activeLabel, crumb?)` gives the sidebar + topbar. Roles + their `active` labels:
- `teacher`: Dashboard, Alerts & triage, Roster, Groups, Check-ins, Activities, Reports, Notifications, Settings
- `leadership`: Overview, Staff, Activities, Reports, Concern words, Alert routing, Calendar & window, Subscription, Export & delete, Consent, Settings
- `district`: Overview, Approvals, Settings
- `admin`: Dashboard, Schools, Trials, Support, Seed content, Word lists, Audit log, Profile  (dark sidebar — automatic)

## Non-shell frames
- Auth (pre-login): `AuthCard({title, sub?, children, footer?})` + `AuthField`, `Divider`, `Input`, `Button`. SSO logos: not in the kit — use `Button variant="ghost"` with a small inline `<svg>` if needed, else a labelled ghost button.
- Email: `EmailFrame({from,to,when,subject,children})` + `EmailCTA`.
- System pages: `SystemPage({code?, title, children})`.
- Legal: `LegalPage({title, updated, children})` with `<h4>`/`<p>` inside.
- Student (mobile): `PhoneFrame({children, tabs?})` — coral canvas. Compose with `MoodFace`, `Button`, `Icon`. Student-screen-specific bits (code boxes, name grid, QR viewfinder, breathing, mood calendar) may be built inline with Tailwind utilities bound to theme tokens (`bg-coral`, `text-coral`, `border-neutral-200`, `bg-coral-50`, `rounded-xl`, etc.) — no raw hex.

## Library surface (import from '../components')
- Layout/shell: `AppShell`, `Sidebar`, `Topbar`, `PageHeader`, `chrome`, `Logo`, `PhoneFrame`, `NavItem`, `Person`
- Frames: `AuthCard`, `AuthField`, `Divider`, `EmailFrame`, `EmailCTA`, `SystemPage`, `LegalPage`
- Data: `Card`, `CardHeader`, `CardBody`, `StatTile`, `KV`, `Table`, `PersonCell`
- Feedback: `Timeline` (entries:{time,who,event,tone?'system'|'gap'|'acted'}), `EmptyState`, `Chip`, `SegmentedControl`, `SectionLabel`
- Primitives: `Button` (variant ink|coral|ghost|danger, block, icon), `Tag` (tone danger|warn|ok|mut|ink|coral, icon), `Trend` (dir up|down|flat, dotColor), `Avatar`, `Badge`, `Banner` (tone info|warn|danger, icon), `Toggle` (on)
- Forms: `Field`, `Input`, `Textarea`, `Select`
- Mood: `MoodFace` (mood, size), `MoodDot` (mood, label)
- Charts: `MoodDonut` (data:{great,good,ok,worried,sad,angry}, centerLabel, centerSub) + `MoodLegend`, `MiniBars` (bars:[{label,value 0..1,muted?}])
- Icons: `Icon.*` — Grid, Alert, Users, Layers, Book, Report, Cog, Bell, Heart, Check, Flag, Clock, Eye, Pie, ChevronRight, ArrowUp, ArrowDown, Minus, ArrowRight, Pencil. (Need another? use a nearby one; don't invent hex.)

## Rules
- Status is always icon + label + colour (use `Tag`/`Banner` — never colour alone).
- Displayed figures are rendered from the markup you write (illustrative real values from the preview) — never compute a formula.
- Keep it typed and simple; a reviewer should map the TSX 1:1 to the preview. Reference exemplars already in
  `approved/screens/`: `ClassDashboard.tsx` (SC-027) and `StudentCheckIn.tsx` (SC-023).
