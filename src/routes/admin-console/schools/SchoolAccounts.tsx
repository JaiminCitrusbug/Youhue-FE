/**
 * SC-075 — School accounts (FR-19-02 · US-19-02). REUSES the approved design screen: this
 * composition follows `design/approved/screens/SchoolAccounts.tsx` in structure, copy and classes,
 * built entirely from the vendored approved primitives (`@design/components`). It adds ONLY the
 * delta — a real GET-backed list, the search wiring, loading/empty/error states, and routed links
 * into the per-school Trial and Support screens (no dead controls).
 *
 * Divergences from the approved screen — LOGGED, not silently reconciled:
 *  (a) No `<AppShell {...chrome('admin', 'Schools')}>` wrapper — same reasoning FR-19-04/05 already
 *      logged: this route renders inside the app's own routed shell
 *      (`src/components/layout/AppShell.tsx`); wrapping the approved shell here would nest a second
 *      sidebar, and `chrome('admin')` hardcodes a fixture person + dead nav `<a>`s.
 *  (b) The approved tier Select ("All tiers") has no filtering behaviour in the BE contract (the
 *      list endpoint only supports a name search `q`), so it is NOT reproduced as a dead control —
 *      only the real search Input is wired. Fabricating a working tier filter the API cannot
 *      perform would be inventing scope FR-19-02 does not carry.
 *  (c) The approved Table has 3 columns (School / Tier / Status); this ticket's DoD requires routed
 *      navigation into the per-school Trial/Support screens, so a delta 4th `Actions` column is
 *      appended (same pattern FR-19-04's SeedActivities used for its delta columns).
 *  (d) The ticket's one-line API summary is only the PATCH; this screen needs real data to render
 *      (not a dead list), so it also consumes the supporting `GET /admin/schools` this ticket adds
 *      to the BE (see the BE gate doc) — the same kind of supporting-read addition FR-19-05 made.
 */
import { useCallback, useEffect, useState } from "react"

import { Link } from "react-router-dom"

import {
  Button, Card, CardBody, CardHeader, EmptyState, Icon, Input, PageHeader, PersonCell, Table, Tag,
} from "@design/components"

import { adminSchoolErrorMessage, listSchools, type SchoolListItem } from "./api"

// Approved raw value, copied VERBATIM (do-not-restyle). Tailwind has no 180px step.
// Source: design/approved/screens/SchoolAccounts.tsx:15
const SEARCH_WIDTH_CLS = "w-[180px]" // token-ok: approved value (do-not-restyle)

function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return (words[0]?.[0] ?? "").concat(words[1]?.[0] ?? "").toUpperCase() || "?"
}

function tierTag(school: SchoolListItem) {
  return school.tier === "premium" ? (
    <Tag tone="ink">Premium</Tag>
  ) : (
    <Tag tone="mut">Free</Tag>
  )
}

function statusTag(school: SchoolListItem) {
  if (school.status === "active") return <Tag tone="ok" icon={<Icon.Check />}>Active</Tag>
  if (school.status === "pending") return <Tag tone="warn" icon={<Icon.Clock />}>Pending</Tag>
  return <Tag tone="danger" icon={<Icon.Alert />}>Rejected</Tag>
}

export function SchoolAccounts() {
  const [schools, setSchools] = useState<SchoolListItem[]>([])
  const [count, setCount] = useState(0)
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback((query: string) => {
    setLoading(true)
    setError(null)
    listSchools(query)
      .then((res) => {
        setSchools(res.schools)
        setCount(res.count)
        setLoading(false)
      })
      .catch((e) => {
        setError(adminSchoolErrorMessage(e))
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    load(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- explicit search submit, not on every keystroke
  }, [])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    load(q)
  }

  function body() {
    if (loading) return <EmptyState title="Loading schools…" />
    if (error) return <EmptyState icon={<Icon.Alert />} title="Schools could not be loaded">{error}</EmptyState>
    if (schools.length === 0) {
      return (
        <EmptyState icon={<Icon.School />} title="No schools match your search">
          Try a different search, or clear it to see every school.
        </EmptyState>
      )
    }
    return (
      <Table
        head={["School", "Tier", "Status", "Actions"]}
        rows={schools.map((s) => [
          <PersonCell initials={initialsFor(s.name)} name={s.name} />,
          tierTag(s),
          statusTag(s),
          <div className="flex gap-2">
            <Link to={`/app/admin/schools/${s.id}/trial`}>
              <Button type="button" variant="ghost" icon={<Icon.Clock />}>
                Trial
              </Button>
            </Link>
            <Link to={`/app/admin/schools/${s.id}/support`}>
              <Button type="button" variant="ghost" icon={<Icon.Shield />}>
                Support
              </Button>
            </Link>
          </div>,
        ])}
      />
    )
  }

  return (
    <>
      <PageHeader
        crumb="Every school on the platform"
        title="School accounts"
        sub={`${count} total`}
        right={
          <form onSubmit={submitSearch} className="flex items-center gap-2">
            <div className={SEARCH_WIDTH_CLS}>
              <Input
                aria-label="Search schools"
                placeholder="Search schools"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Button type="submit" variant="ghost" icon={<Icon.Search />}>
              Search
            </Button>
          </form>
        }
      />

      <Card>
        <CardHeader
          icon={<Icon.School />}
          title="Schools"
          hint={loading ? undefined : `showing ${schools.length} of ${count}`}
        />
        <CardBody flush>{body()}</CardBody>
      </Card>
    </>
  )
}
