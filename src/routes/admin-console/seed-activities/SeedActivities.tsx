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
 *      it is a live toggle for the author panel (no dead controls).
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

/** The type/age-band option lists, shared by the create and edit forms. */
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

  const [creating, setCreating] = useState(false)
  const [newDraft, setNewDraft] = useState<SeedActivityInput>(EMPTY_DRAFT)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<SeedActivityInput>(EMPTY_DRAFT)

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

  function submitCreate() {
    void run(
      () => createSeedActivity({ ...newDraft, title: newDraft.title.trim(), topic: newDraft.topic.trim() }),
      () => {
        setNewDraft(EMPTY_DRAFT)
        setCreating(false)
      },
    )
  }

  function startEdit(a: SeedActivity) {
    setEditingId(a.id)
    setEditDraft(draftFrom(a))
    setError(null)
  }

  function submitEdit(id: string) {
    void run(
      () => updateSeedActivity(id, { ...editDraft, title: editDraft.title.trim(), topic: editDraft.topic.trim() }),
      () => setEditingId(null),
    )
  }

  const canCreate = newDraft.title.trim().length > 0 && !busy
  const canSaveEdit = editDraft.title.trim().length > 0 && !busy

  const editRow = (a: SeedActivity) => [
    <Input
      aria-label="Edit activity title"
      value={editDraft.title}
      onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
    />,
    <Input
      aria-label="Edit activity topic"
      value={editDraft.topic}
      onChange={(e) => setEditDraft({ ...editDraft, topic: e.target.value })}
    />,
    <Select
      aria-label="Edit activity age band"
      value={editDraft.age_band}
      onChange={(e) => setEditDraft({ ...editDraft, age_band: e.target.value as AgeBand })}
    >
      <AgeOptions />
    </Select>,
    <Select
      aria-label="Edit activity type"
      value={editDraft.type}
      onChange={(e) => setEditDraft({ ...editDraft, type: e.target.value as ActivityType })}
    >
      <TypeOptions />
    </Select>,
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="ink"
        icon={<Icon.Check />}
        disabled={!canSaveEdit}
        onClick={() => submitEdit(a.id)}
      >
        Save
      </Button>
      <Button type="button" variant="ghost" icon={<Icon.X />} onClick={() => setEditingId(null)}>
        Cancel
      </Button>
    </div>,
  ]

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
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="ghost"
        icon={<Icon.Pencil />}
        disabled={busy}
        aria-label={`Edit ${a.title}`}
        onClick={() => startEdit(a)}
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
              icon={creating ? <Icon.X /> : <Icon.Pencil />}
              onClick={() => {
                setCreating((v) => !v)
                setNewDraft(EMPTY_DRAFT)
              }}
            >
              {creating ? "Close" : "Author / edit"}
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

      {creating ? (
        <div className="mb-4">
          <Card>
            <CardHeader icon={<Icon.Plus />} title="New seed activity" hint="added to every school" />
            <CardBody>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  submitCreate()
                }}
              >
                <Field label="Activity">
                  <Input
                    aria-label="Activity"
                    value={newDraft.title}
                    autoFocus
                    placeholder="e.g. Box breathing"
                    onChange={(e) => setNewDraft({ ...newDraft, title: e.target.value })}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Type">
                    <Select
                      aria-label="Type"
                      value={newDraft.type}
                      onChange={(e) => setNewDraft({ ...newDraft, type: e.target.value as ActivityType })}
                    >
                      <TypeOptions />
                    </Select>
                  </Field>
                  <Field label="Age band">
                    <Select
                      aria-label="Age band"
                      value={newDraft.age_band}
                      onChange={(e) => setNewDraft({ ...newDraft, age_band: e.target.value as AgeBand })}
                    >
                      <AgeOptions />
                    </Select>
                  </Field>
                </div>
                <Field label="Topic">
                  <Input
                    aria-label="Topic"
                    value={newDraft.topic}
                    placeholder="e.g. Healthy habits"
                    onChange={(e) => setNewDraft({ ...newDraft, topic: e.target.value })}
                  />
                </Field>
                <div className="mt-4 flex gap-2.5">
                  <Button type="submit" variant="ink" icon={<Icon.Check />} disabled={!canCreate}>
                    {busy ? "Adding…" : "Add activity"}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader icon={<Icon.Book />} title="Seed activities" hint="age band = suitable years" />
        <CardBody flush>
          {loading ? (
            <EmptyState title="Loading seed activities…" />
          ) : activities.length === 0 ? (
            <EmptyState icon={<Icon.Book />} title="No seed activities yet">
              Add the first one — the seed set is available to every school.
            </EmptyState>
          ) : (
            <Table
              head={["Activity", "Topic", "Age", "Type", "Actions"]}
              rows={activities.map((a) => (editingId === a.id ? editRow(a) : viewRow(a)))}
            />
          )}
        </CardBody>
      </Card>
    </>
  )
}
