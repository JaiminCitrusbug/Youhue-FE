/**
 * SC-085 — Subscription (FR-17-01). REUSES `design/approved/screens/Subscription.tsx`'s
 * structure/classes for the header + KV row (tier/trial), composed from `@design/components`.
 *
 * Divergence from the approved screen — LOGGED, not silently reconciled: the approved preview
 * shows only a static pricing table + hardcoded "Premium (trial)" / "24 days left" KVs, with no
 * feature-list UI at all. This ticket's actual DoD is the entitlement engine + "the Subscription
 * screen that lists exactly what each tier includes" — so the feature list below is new UI built
 * from the SAME primitive set (Card/CardHeader/CardBody), not copied from any approved markup
 * (none exists for it). The static pricing table and "Upgrade to Premium" button are NOT built
 * here — Premium enablement (FR-17-03/04) and pricing/billing are explicitly other tickets; this
 * screen only renders what `GET /entitlements` actually returns (`{tier, features[]}`).
 */
import { useCallback, useEffect, useState } from "react"

import { AppShell, Banner, Card, CardBody, CardHeader, chrome, Icon, KV, PageHeader } from "@design/components"

import { useAuth } from "../../app/AuthContext"
import { EntitlementsApiError, FEATURE_LABELS, getEntitlements, type EntitlementsResponse } from "./api"

const crumb = <span>Leadership{"  /  "}Subscription</span>

export function SubscriptionApp() {
  const { user } = useAuth()
  const schoolId = user?.school_id ?? ""

  const [data, setData] = useState<EntitlementsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    load()
  }, [load])

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
          <div className="mb-4 grid grid-cols-1 gap-3">
            <KV label="Tier">{data.tier === "premium" ? "Premium" : "Free"}</KV>
          </div>

          <Card>
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

      <p className="mt-3 text-[12px] text-neutral-500">No in-platform card entry — billing is quote-based.</p> {/* token-ok: approved value (do-not-restyle, screens/Subscription.tsx:38) */}
    </AppShell>
  )
}
