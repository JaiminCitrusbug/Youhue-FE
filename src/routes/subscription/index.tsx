/**
 * SC-085 — Subscription (FR-17-01, FR-17-04, FR-17-06). REUSES
 * `design/approved/screens/Subscription.tsx`'s structure/classes for the header + KV row
 * (tier/trial) and the pricing Card (Card/CardHeader/CardBody/Table), composed from
 * `@design/components`.
 *
 * Divergence from the approved screen — LOGGED, not silently reconciled: the approved preview
 * shows only a static pricing table + hardcoded "Premium (trial)" / "24 days left" KVs, with no
 * feature-list UI at all. This ticket's actual DoD is the entitlement engine + "the Subscription
 * screen that lists exactly what each tier includes" — so the feature list below is new UI built
 * from the SAME primitive set (Card/CardHeader/CardBody), not copied from any approved markup
 * (none exists for it).
 *
 * FR-17-04 addition (GATE G-11): when the resolved tier is Free, render the "buy Premium to
 * unlock" prompt the approved screen's header button gestures at (`Icon.ArrowUp` "Upgrade to
 * Premium") — as an informational `Banner`, not a button: FR-17-06 (the quote-based
 * upgrade/pricing flow this button would need to route to) never adds an in-platform "become
 * paid" action either (billing is external/quote-based, by design) — so the banner stays
 * informational, never a dead control routing nowhere. `GET /entitlements` (FR-17-01, unmodified
 * by this ticket) carries no "was this school ever Premium" flag, so the prompt is phrased to be
 * literally true for every Free-tier school whether or not it has retained Premium data ("any
 * Premium data you've created" — an empty set for a school that never had any).
 *
 * FR-17-06 addition — the pricing Card below reuses the approved screen's exact structure
 * (`Card` > `CardHeader icon={<Icon.Card />}` > `CardBody flush` > `Table`) and its closing
 * "No in-platform card entry" line, but deliberately does NOT reproduce the approved preview's
 * hardcoded `$4.00` / `$3.25` / `$2.50` / `$2.00` per-student figures: the ticket's own Do-NOT
 * forbids hard-coding ratified price numbers (pending client ratification, BRD Appendix A) — the
 * Table renders the MODEL from `GET /api/v1/pricing` (per-student/year, cheaper at higher
 * volumes, by quote, no tax at launch) instead of any dollar amount. No card-entry form is
 * rendered anywhere on this screen, ever (NEG — no PCI surface).
 */
import { useCallback, useEffect, useState } from "react"

import { AppShell, Banner, Card, CardBody, CardHeader, chrome, Icon, KV, PageHeader, Table } from "@design/components"

import { useAuth } from "../../app/AuthContext"
import {
  EntitlementsApiError,
  FEATURE_LABELS,
  getEntitlements,
  getPricing,
  PricingApiError,
  type EntitlementsResponse,
  type PricingResponse,
} from "./api"

const crumb = <span>Leadership{"  /  "}Subscription</span>

export function SubscriptionApp() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ""

  const [data, setData] = useState<EntitlementsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // FR-17-06 — independent of entitlements: the pricing model is platform-wide, not scoped to
  // this school, so it loads on its own (never gated on `schoolId`).
  const [pricing, setPricing] = useState<PricingResponse | null>(null)
  const [pricingLoading, setPricingLoading] = useState(true)
  const [pricingError, setPricingError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!schoolId) return
    setLoading(true)
    setError(null)
    getEntitlements(schoolId)
      .then(setData)
      .catch((e: unknown) => {
        setError(e instanceof EntitlementsApiError ? e.message : "Couldn't load your plan. Please try again.")
      })
      .finally(() => setLoading(false))
  }, [schoolId])

  const loadPricing = useCallback(() => {
    setPricingLoading(true)
    setPricingError(null)
    getPricing()
      .then(setPricing)
      .catch((e: unknown) => {
        setPricingError(e instanceof PricingApiError ? e.message : "Couldn't load pricing. Please try again.")
      })
      .finally(() => setPricingLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    loadPricing()
  }, [loadPricing])

  return (
    <AppShell {...chrome("leadership", "Subscription", crumb)}>
      <PageHeader
        crumb="Plan & static pricing · billing is quote-based, not card entry"
        title="Subscription & pricing"
      />

      {error && (
        <Banner tone="danger" icon={<Icon.Alert />}>
          {error}
        </Banner>
      )}

      {loading ? (
        <p className="text-[13px] text-neutral-500"> {/* token-ok: text-[13px]/text-neutral-500 muted-meta scale already used platform-wide (e.g. district-approvals CELL_TEXT_CLS) */}
          Loading…
        </p>
      ) : data ? (
        <>
          {data.tier === "free" && (
            <Banner tone="info" icon={<Icon.Lock />}>
              Buy Premium to unlock advanced features — any Premium data you&apos;ve created stays
              safe and read-only until you upgrade.
            </Banner>
          )}

          <div className="mb-4 grid grid-cols-1 gap-3">
            <KV label="Tier">{data.tier === "premium" ? "Premium" : "Free"}</KV>
          </div>

          <Card className="mb-4">
            <CardHeader
              icon={<Icon.Check />}
              title={data.tier === "premium" ? "Everything in your Premium plan" : "Everything in your Free plan"}
              hint={`${data.features.length} feature${data.features.length === 1 ? "" : "s"}`}
            />
            <CardBody>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {data.features.map((key) => (
                  <li key={key} className="flex items-center gap-2 text-[13px] text-neutral-700"> {/* token-ok: text-[13px] muted-meta scale already used platform-wide */}
                    <Icon.Check className="h-4 w-4 shrink-0 text-status-ok" />
                    {FEATURE_LABELS[key] ?? key}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </>
      ) : null}

      {pricingError && (
        <Banner tone="danger" icon={<Icon.Alert />}>
          {pricingError}
        </Banner>
      )}

      {pricingLoading ? (
        <p className="text-[13px] text-neutral-500"> {/* token-ok: text-[13px]/text-neutral-500 muted-meta scale already used platform-wide (e.g. district-approvals CELL_TEXT_CLS) */}
          Loading…
        </p>
      ) : pricing ? (
        <Card>
          <CardHeader icon={<Icon.Card />} title="Pricing" hint="per student · per year" />
          <CardBody flush>
            <Table
              head={["Model", "Details"]}
              rows={[
                [<>Per student, per year</>, <>Cheaper at higher volumes</>],
                [<>By quote</>, <>{pricing.by_quote ? "Yes — no self-service card entry" : "—"}</>],
                [<>Tax</>, <>{pricing.tax}</>],
              ]}
            />
          </CardBody>
        </Card>
      ) : null}

      <p className="mt-3 text-[12px] text-neutral-500">No in-platform card entry — billing is quote-based.</p> {/* token-ok: approved value (do-not-restyle, screens/Subscription.tsx:38) */}
    </AppShell>
  )
}
