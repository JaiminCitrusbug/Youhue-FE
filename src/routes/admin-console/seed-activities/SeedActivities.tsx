import { useCallback, useEffect, useState } from "react"

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
import {
  Card,
  CardBody,
  CardHeader,
  Field,
  GhostButton,
  InkButton,
  PageHeader,
  RetiredBadge,
  Select,
  TextInput,
} from "./frame"
import { Icon } from "./icons"

// SC-078 · FR-19-04 — Seed activities (admin console). The internal team maintains the platform
// default activity set (list / create / edit / retire / re-instate); the set is GLOBAL, so every
// change applies to the seed set available to all schools. Componentized from the approved screen
// (Youhue-DESIGN/approved/screens/SeedActivities.tsx) on the shared theme; wiring calls the
// FR-19-01 admin router. Admin-gated by the router's RequireRole; an admin whose role does not
// permit seed maintenance is denied 403 by the BE and the error is SURFACED here (never dropped).

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

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        crumb="Platform default activity library"
        title="Seed activities"
        sub="Shipped to every new school"
        right={
          <InkButton
            type="button"
            icon={creating ? <Icon.Close /> : <Icon.Plus />}
            onClick={() => {
              setCreating((v) => !v)
              setNewDraft(EMPTY_DRAFT)
            }}
          >
            {creating ? "Close" : "New activity"}
          </InkButton>
        }
      />

      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-md border border-status-danger bg-status-dangerBg px-4 py-2.5 text-sm font-semibold text-status-danger"
        >
          {error}
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
                <div className="flex flex-wrap gap-3">
                  <Field label="Activity" htmlFor="new-title">
                    <TextInput
                      id="new-title"
                      value={newDraft.title}
                      autoFocus
                      placeholder="e.g. Box breathing"
                      onChange={(e) => setNewDraft({ ...newDraft, title: e.target.value })}
                    />
                  </Field>
                  <Field label="Type" htmlFor="new-type">
                    <Select
                      id="new-type"
                      value={newDraft.type}
                      onChange={(e) => setNewDraft({ ...newDraft, type: e.target.value as ActivityType })}
                    >
                      <TypeOptions />
                    </Select>
                  </Field>
                  <Field label="Age band" htmlFor="new-age">
                    <Select
                      id="new-age"
                      value={newDraft.age_band}
                      onChange={(e) => setNewDraft({ ...newDraft, age_band: e.target.value as AgeBand })}
                    >
                      <AgeOptions />
                    </Select>
                  </Field>
                  <Field label="Topic" htmlFor="new-topic">
                    <TextInput
                      id="new-topic"
                      value={newDraft.topic}
                      placeholder="e.g. Healthy habits"
                      onChange={(e) => setNewDraft({ ...newDraft, topic: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="mt-3 flex justify-end">
                  <InkButton type="submit" disabled={!canCreate} icon={<Icon.Check />}>
                    {busy ? "Adding…" : "Add activity"}
                  </InkButton>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader icon={<Icon.Book />} title="Seed activities" hint="age band = suitable years" />
        <CardBody flush>
          <div className="flex items-center justify-end gap-2 border-b border-neutral-200 px-4 py-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-neutral-600">
              <input
                type="checkbox"
                checked={showRetired}
                onChange={(e) => setShowRetired(e.target.checked)}
                className="accent-coral"
              />
              Show retired
            </label>
          </div>

          {loading ? (
            <p className="px-4 py-8 text-center text-sm text-neutral-500">Loading…</p>
          ) : activities.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-neutral-500">
              No seed activities yet. Add the first one for every school.
            </p>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-neutral-200 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  <th className="px-4 py-2">Activity</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Topic</th>
                  <th className="px-4 py-2">Age</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {activities.map((a) =>
                  editingId === a.id ? (
                    <tr key={a.id} className="bg-neutral-50 align-top">
                      <td className="px-4 py-2">
                        <TextInput
                          aria-label="Edit activity title"
                          value={editDraft.title}
                          onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Select
                          aria-label="Edit activity type"
                          value={editDraft.type}
                          onChange={(e) => setEditDraft({ ...editDraft, type: e.target.value as ActivityType })}
                        >
                          <TypeOptions />
                        </Select>
                      </td>
                      <td className="px-4 py-2">
                        <TextInput
                          aria-label="Edit activity topic"
                          value={editDraft.topic}
                          onChange={(e) => setEditDraft({ ...editDraft, topic: e.target.value })}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Select
                          aria-label="Edit activity age band"
                          value={editDraft.age_band}
                          onChange={(e) => setEditDraft({ ...editDraft, age_band: e.target.value as AgeBand })}
                        >
                          <AgeOptions />
                        </Select>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-2">
                          <GhostButton
                            type="button"
                            icon={<Icon.Check />}
                            disabled={!canSaveEdit}
                            onClick={() => submitEdit(a.id)}
                          >
                            Save
                          </GhostButton>
                          <GhostButton type="button" icon={<Icon.Close />} onClick={() => setEditingId(null)}>
                            Cancel
                          </GhostButton>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={a.id} className={a.active ? "" : "opacity-60"}>
                      <td className="px-4 py-2.5 text-sm font-semibold text-neutral-900">
                        <span className="flex items-center gap-2">
                          {a.title}
                          {a.active ? null : <RetiredBadge />}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-neutral-600">{TYPE_LABEL[a.type]}</td>
                      <td className="px-4 py-2.5 text-sm text-neutral-600">{a.topic || "—"}</td>
                      <td className="px-4 py-2.5 text-sm text-neutral-600">{AGE_LABEL[a.age_band]}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-2">
                          <GhostButton
                            type="button"
                            icon={<Icon.Pencil />}
                            disabled={busy}
                            aria-label={`Edit ${a.title}`}
                            onClick={() => startEdit(a)}
                          >
                            Edit
                          </GhostButton>
                          {a.active ? (
                            <GhostButton
                              type="button"
                              tone="danger"
                              icon={<Icon.Trash />}
                              disabled={busy}
                              aria-label={`Retire ${a.title}`}
                              onClick={() => run(() => retireSeedActivity(a.id))}
                            >
                              Retire
                            </GhostButton>
                          ) : (
                            <GhostButton
                              type="button"
                              icon={<Icon.Undo />}
                              disabled={busy}
                              aria-label={`Reinstate ${a.title}`}
                              onClick={() => run(() => reinstateSeedActivity(a.id))}
                            >
                              Reinstate
                            </GhostButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
