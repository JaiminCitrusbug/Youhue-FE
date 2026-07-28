import { useEffect, useState } from "react"

import {
  Banner, Button, Card, CardBody, CardHeader, EmptyState, Field, Icon, PageHeader, Select,
} from "@design/components"

import { getMyClasses, getClassRoster, type RosterStudent } from "../dashboard/api"
import { ActivitiesApiError, getSeedActivities, runOrAssignActivity, type SeedActivity } from "./api"

const LIST_WIDTH_CLS = "max-w-[660px] space-y-3" // token-ok: approved Design-final-v3 value (do-not-restyle, screens/ActivityRunAssign.tsx:13)

/**
 * SC-046 — Run / assign activity · FR-14-02. COMPOSED from the approved `ActivityRunAssign.tsx`'s
 * Card/CardHeader/CardBody + Run/Assign button structure — mounts inside the real routed
 * `AppShell`, no `PhoneFrame`/nav chrome (same established convention as `dashboard/index.tsx`).
 *
 * Divergences from the approved static mock, logged (never silently reconciled — CLAUDE.md step 3):
 *  - The approved screen shows ONE hardcoded activity card ("Friendship & belonging · ~15 min").
 *    There is no real duration field on the `Activity` model (`title`/`type`/`age_band`/`topic`
 *    only) and no per-activity drill-in screen exists yet (the full library browse UI is explicit
 *    Phase-2 scope) — so this renders the SAME approved Card structure once PER activity in the
 *    real active seed set (`GET /activities/seed`, a minimal-GET-add — see `api.ts`), with the real
 *    `title` as the card title and `type`/`topic` as the hint, never a fabricated duration.
 *  - CLASS SELECTION is not in this ticket's scope, same documented gap `dashboard/index.tsx`
 *    already carries: reuses `GET /classes/mine` and uses the FIRST owned class. A `support`
 *    co-teacher with only shared-scope access sees "no classes yet" here too (same known gap).
 *  - "Assign to a student" has no approved picker UI (the approved screen's two buttons don't wire
 *    to anything real) — composed from the SAME `Field`+`Select` pattern `class-invitations/
 *    index.tsx`'s own class picker already established in this codebase, populated from the real
 *    class roster (`GET /classes/{id}/roster`, FR-10-02's own minimal-GET-add), never a fixture.
 */
export function ActivityRunAssignApp() {
  const [classId, setClassId] = useState<string | null>(null)
  const [noClasses, setNoClasses] = useState(false)
  const [roster, setRoster] = useState<RosterStudent[]>([])
  const [activities, setActivities] = useState<SeedActivity[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [studentChoice, setStudentChoice] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getMyClasses(), getSeedActivities()])
      .then(([classes, seed]) => {
        if (cancelled) return
        setActivities(seed)
        if (classes.length === 0) {
          setNoClasses(true)
          return
        }
        const firstClassId = classes[0].id
        setClassId(firstClassId)
        return getClassRoster(firstClassId).then((students) => {
          if (cancelled) return
          setRoster(students)
        })
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setLoadError(
          e instanceof ActivitiesApiError ? e.message : "Couldn't load activities. Please try again.",
        )
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleRunWithClass(activityId: string) {
    if (!classId) return
    setBusyId(activityId)
    setActionError(null)
    setSuccessMessage(null)
    try {
      const assigned = await runOrAssignActivity(activityId, `class:${classId}`)
      setSuccessMessage(`Ready for the whole class — ${assigned.length} student(s).`)
      setAssigningId(null)
    } catch (e) {
      setActionError(e instanceof ActivitiesApiError ? e.message : "Couldn't run the activity.")
    } finally {
      setBusyId(null)
    }
  }

  async function handleAssignToStudent(activityId: string) {
    const studentId = studentChoice[activityId]
    if (!studentId) return
    setBusyId(activityId)
    setActionError(null)
    setSuccessMessage(null)
    try {
      await runOrAssignActivity(activityId, `student:${studentId}`)
      const name = roster.find((s) => s.id === studentId)?.display_name ?? "the student"
      setSuccessMessage(`Assigned to ${name}.`)
      setAssigningId(null)
    } catch (e) {
      setActionError(e instanceof ActivitiesApiError ? e.message : "Couldn't assign the activity.")
    } finally {
      setBusyId(null)
    }
  }

  if (loadError) {
    return (
      <div role="alert">
        <Banner tone="danger" icon={<Icon.Alert />}>{loadError}</Banner>
      </div>
    )
  }
  if (noClasses) {
    return (
      <EmptyState icon={<Icon.Users />} title="No classes yet">
        Activities will show up here once you own or co-teach a class.
      </EmptyState>
    )
  }
  if (activities === null) return <EmptyState title="Loading activities…" />

  return (
    <>
      <PageHeader crumb="Activities" title="Run or assign" sub="From the seed activity set" />

      {successMessage ? (
        <Banner tone="info" icon={<Icon.Check />}>{successMessage}</Banner>
      ) : null}
      {actionError ? (
        <div role="alert">
          <Banner tone="danger" icon={<Icon.Alert />}>{actionError}</Banner>
        </div>
      ) : null}

      {activities.length === 0 ? (
        <EmptyState icon={<Icon.Book />} title="No activities yet">
          Activities will appear here once the platform seed set has entries.
        </EmptyState>
      ) : (
        <div className={LIST_WIDTH_CLS}>
          {activities.map((activity) => (
            <Card key={activity.id}>
              <CardHeader
                icon={<Icon.Book />}
                title={activity.title}
                hint={activity.topic ?? activity.type}
              />
              <CardBody>
                <div className="mt-1 flex gap-2.5">
                  <Button
                    variant="ink"
                    icon={<Icon.Users />}
                    disabled={busyId === activity.id}
                    onClick={() => void handleRunWithClass(activity.id)}
                  >
                    Run with class
                  </Button>
                  <Button
                    variant="ghost"
                    icon={<Icon.Send />}
                    disabled={busyId === activity.id}
                    onClick={() =>
                      setAssigningId(assigningId === activity.id ? null : activity.id)
                    }
                  >
                    Assign to a student
                  </Button>
                </div>

                {assigningId === activity.id ? (
                  <div className="mt-3.5">
                    <Field label="Student">
                      <Select
                        aria-label="Student"
                        value={studentChoice[activity.id] ?? ""}
                        onChange={(e) =>
                          setStudentChoice((current) => ({
                            ...current,
                            [activity.id]: e.target.value,
                          }))
                        }
                      >
                        <option value="">Choose a student…</option>
                        {roster.map((s) => (
                          <option key={s.id} value={s.id}>{s.display_name}</option>
                        ))}
                      </Select>
                    </Field>
                    <div className="mt-2.5">
                      <Button
                        variant="ink"
                        icon={<Icon.Send />}
                        disabled={busyId === activity.id || !studentChoice[activity.id]}
                        onClick={() => void handleAssignToStudent(activity.id)}
                      >
                        Confirm assignment
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
