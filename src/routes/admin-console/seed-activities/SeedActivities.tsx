/**
 * SC-078 — Seed activities (FR-19-04 · US-19-04). REUSES the approved SeedActivities design screen:
 * the composition below follows `design/approved/screens/SeedActivities.tsx` in structure, copy and
 * classes, and is built entirely from the vendored approved primitives (`@design/components`).
 * This file adds ONLY the delta — list / create / edit / retire / re-instate wiring, the
 * loading / empty / error states and the disabled states.
 *
 * The seed set is GLOBAL: every change applies to the seed set available to all schools (scope=seed
 * only). Admin-gated by the router's RequireRole; the BE additionally enforces the manage_seed RBAC
 * permission and its 403 is SURFACED here, never silently dropped.
 *
 * Divergences from the approved screen — LOGGED, not silently reconciled:
 *  (a) No `<AppShell {...chrome('admin', 'Seed content')}>` wrapper. This route renders inside the
 *      app's own routed shell (`src/components/layout/AppShell.tsx`, INFRA-04); wrapping the
 *      approved shell here would nest a second sidebar + topbar. Swapping the app shell for the
 *      approved one is a shell-level change outside this ticket.
 *  (b) The approved table has 3 static columns (Activity / Topic / Age). They are kept, in order;
 *      the delta columns (Type, Actions) are appended — the ticket's API carries `type` and the
 *      DoD requires add/edit/remove controls.
 *  (c) The approved right-hand `Author / edit` button is a preview control with no behaviour; here
 *      it is a live toggle for the author panel (no dead controls). The approved copy says
 *      "Author / edit", so the panel it opens **does both**: a row's `Edit` action opens the same
 *      panel pre-filled in edit mode (`editingId`), and the panel PATCHes instead of POSTing. The
 *      approved label is therefore accurate and is NOT renamed.
 *  (d) The approved `Table` hard-codes `text-left` on every `<th>` and has no per-column alignment
 *      prop, so the delta `Actions` cells are left-aligned too — header and cells agree. A
 *      per-column alignment prop is logged for the design owner (DS-01, finding 7).
 */
import { useCallback, useEffect, useState } from "react"

import {
  Banner,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  Icon,
  Input,
  PageHeader,
  SegmentedControl,
  Select,
  Table,
  Tag,
} from "@design/components"

import {
  ACTIVITY_TYPES,
  AGE_BANDS,
  AGE_LABEL,
  TYPE_LABEL,
  createSeedActivity,
  listSeedActivities,
  reinstateSeedActivity,
  retireSeedActivity,
  seedErrorMessage,
  updateSeedActivity,
  type ActivityType,
  type AgeBand,
  type SeedActivity,
  type SeedActivityInput,
} from "./api"

// Approved cell typography, copied VERBATIM from approved/screens/SeedActivities.tsx (rows array).
const CELL_TITLE = "text-[12.5px] font-semibold" // token-ok: approved value (do-not-restyle)
const CELL_TEXT = "text-[12.5px]" // token-ok: approved value (do-not-restyle)

const FILTER_ACTIVE = "Active only"
const FILTER_ALL = "Include retired"

const EMPTY_DRAFT: SeedActivityInput = { title: "", type: "breathing", age_band: "all", topic: "" }

function draftFrom(a: SeedActivity): SeedActivityInput {
  return { title: a.title, type: a.type, age_band: a.age_band, topic: a.topic ?? "" }
}

/** The type/age-band option lists, shared by the create and edit modes of the author panel. */
function TypeOptions() {
  return (
    <>
      {ACTIVITY_TYPES.map((t) => (
        <option key={t} value={t}>
          {TYPE_LABEL[t]}
        </option>
      ))}
    </>
  )
}
function AgeOptions() {
  return (
    <>
      {AGE_BANDS.map((b) => (
        <option key={b} value={b}>
          {AGE_LABEL[b]}
        </option>
      ))}
    </>
  )
}

export function SeedActivities() {
  const [activities, setActivities] = useState<SeedActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [showRetired, setShowRetired] = useState(false)

  // One author panel serves both modes: `editingId === null` authors a new activity, otherwise it
  // edits that activity. This is what makes the approved "Author / edit" label true.
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<SeedActivityInput>(EMPTY_DRAFT)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      setActivities(await listSeedActivities(showRetired))
      setError(null)
    } catch (e) {
      setError(seedErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [showRetired])

  useEffect(() => {
    void reload()
  }, [reload])

  // Run a mutation, surface any error, and re-sync the list from the server (authoritative order).
  async function run(action: () => Promise<unknown>, onDone?: () => void) {
    setBusy(true)
    setError(null)
    try {
      await action()
      onDone?.()
      await reload()
    } catch (e) {
      setError(seedErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  function closePanel() {
    setPanelOpen(false)
    setEditingId(null)
    setDraft(EMPTY_DRAFT)
  }

  function openAuthor() {
    setEditingId(null)
    setDraft(EMPTY_DRAFT)
    setPanelOpen(true)
    setError(null)
  }

  function openEdit(a: SeedActivity) {
    setEditingId(a.id)
    setDraft(draftFrom(a))
    setPanelOpen(true)
    setError(null)
  }

  function submitPanel() {
    const payload: SeedActivityInput = { ...draft, title: draft.title.trim(), topic: draft.topic.trim() }
    const id = editingId
    void run(() => (id === null ? createSeedActivity(payload) : updateSeedActivity(id, payload)), closePanel)
  }

  const canSave = draft.title.trim().length > 0 && !busy

  const viewRow = (a: SeedActivity) => [
    <span className="flex items-center gap-2">
      <b className={CELL_TITLE}>{a.title}</b>
      {a.active ? null : (
        <Tag tone="mut" icon={<Icon.Minus />}>
          Retired
        </Tag>
      )}
    </span>,
    <span className={CELL_TEXT}>{a.topic || "—"}</span>,
    <span className={CELL_TEXT}>{AGE_LABEL[a.age_band]}</span>,
    <span className={CELL_TEXT}>{TYPE_LABEL[a.type]}</span>,
    // Left-aligned, matching the approved Table's left-aligned <th> — see divergence (d).
    <div className="flex gap-2">
      <Button
        type="button"
        variant="ghost"
        icon={<Icon.Pencil />}
        disabled={busy}
        aria-label={`Edit ${a.title}`}
        onClick={() => openEdit(a)}
      >
        Edit
      </Button>
      {a.active ? (
        <Button
          type="button"
          variant="danger"
          icon={<Icon.Trash />}
          disabled={busy}
          aria-label={`Retire ${a.title}`}
          onClick={() => run(() => retireSeedActivity(a.id))}
        >
          Retire
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          icon={<Icon.Refresh />}
          disabled={busy}
          aria-label={`Reinstate ${a.title}`}
          onClick={() => run(() => reinstateSeedActivity(a.id))}
        >
          Reinstate
        </Button>
      )}
    </div>,
  ]

  /**
   * The list body must never assert something the data does not support:
   *  - a failed load says so (the red Banner carries the detail) — never "no seed activities yet";
   *  - with the `Active only` filter on, an empty page means "none ACTIVE", not "none at all"
   *    (retire is a soft deactivate), so it offers the way back to the unfiltered view;
   *  - only the unfiltered view (`Include retired`) can claim the seed set is genuinely empty.
   */
  function listBody() {
    if (loading) return <EmptyState title="Loading seed activities…" />
    if (error)
      return <EmptyState icon={<Icon.Alert />} title="Seed activities could not be loaded" />
    if (activities.length > 0)
      return (
        <Table
          head={["Activity", "Topic", "Age", "Type", "Actions"]}
          rows={activities.map((a) => viewRow(a))}
        />
      )
    if (showRetired)
      return (
        <EmptyState icon={<Icon.Book />} title="No seed activities yet">
          Add the first one — the seed set is available to every school.
        </EmptyState>
      )
    return (
      <EmptyState
        icon={<Icon.Book />}
        title="No active seed activities"
        action={
          <Button
            type="button"
            variant="ghost"
            icon={<Icon.Refresh />}
            onClick={() => setShowRetired(true)}
          >
            Show retired activities
          </Button>
        }
      >
        Retired activities are hidden by this filter. Show them to re-instate one, or author a new
        activity for every school.
      </EmptyState>
    )
  }

  return (
    <>
      <PageHeader
        crumb="Platform default activity library"
        title="Seed activities"
        sub="Shipped to every new school"
        right={
          <>
            <SegmentedControl
              options={[FILTER_ACTIVE, FILTER_ALL]}
              value={showRetired ? FILTER_ALL : FILTER_ACTIVE}
              onChange={(v) => setShowRetired(v === FILTER_ALL)}
            />
            <Button
              type="button"
              variant="ink"
              icon={panelOpen ? <Icon.X /> : <Icon.Pencil />}
              onClick={() => (panelOpen ? closePanel() : openAuthor())}
            >
              {panelOpen ? "Close" : "Author / edit"}
            </Button>
          </>
        }
      />

      {error ? (
        <div role="alert">
          <Banner tone="danger" icon={<Icon.Alert />}>
            {error}
          </Banner>
        </div>
      ) : null}

      {panelOpen ? (
        <div className="mb-4">
          <Card>
            <CardHeader
              icon={editingId === null ? <Icon.Plus /> : <Icon.Pencil />}
              title={editingId === null ? "New seed activity" : "Edit seed activity"}
              hint={editingId === null ? "added to every school" : "applies to every school"}
            />
            <CardBody>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  submitPanel()
                }}
              >
                <Field label="Activity">
                  <Input
                    aria-label="Activity"
                    value={draft.title}
                    autoFocus
                    placeholder="e.g. Box breathing"
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Type">
                    <Select
                      aria-label="Type"
                      value={draft.type}
                      onChange={(e) => setDraft({ ...draft, type: e.target.value as ActivityType })}
                    >
                      <TypeOptions />
                    </Select>
                  </Field>
                  <Field label="Age band">
                    <Select
                      aria-label="Age band"
                      value={draft.age_band}
                      onChange={(e) => setDraft({ ...draft, age_band: e.target.value as AgeBand })}
                    >
                      <AgeOptions />
                    </Select>
                  </Field>
                </div>
                <Field label="Topic">
                  <Input
                    aria-label="Topic"
                    value={draft.topic}
                    placeholder="e.g. Healthy habits"
                    onChange={(e) => setDraft({ ...draft, topic: e.target.value })}
                  />
                </Field>
                <div className="mt-4 flex gap-2.5">
                  <Button type="submit" variant="ink" icon={<Icon.Check />} disabled={!canSave}>
                    {editingId === null
                      ? busy
                        ? "Adding…"
                        : "Add activity"
                      : busy
                        ? "Saving…"
                        : "Save changes"}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader icon={<Icon.Book />} title="Seed activities" hint="age band = suitable years" />
        <CardBody flush>{listBody()}</CardBody>
      </Card>
    </>
  )
}
