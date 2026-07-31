import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as api from "./api"
import { EntitlementsApiError, PricingApiError, type EntitlementsResponse, type PricingResponse } from "./api"
import { SubscriptionApp } from "./index"

vi.mock("../../app/AuthContext", () => ({
  useAuth: () => ({
    user: { subject_id: "u1", kind: "staff", role: "leadership", school_id: "sch1" },
    loading: false,
    refresh: vi.fn(),
    signOut: vi.fn(),
  }),
}))

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>()
  return { ...actual, getEntitlements: vi.fn(), getPricing: vi.fn() }
})

const getMock = vi.mocked(api.getEntitlements)
const pricingMock = vi.mocked(api.getPricing)

const FREE: EntitlementsResponse = {
  tier: "free",
  features: ["daily_checkins", "colleague_invites"],
}

const PREMIUM: EntitlementsResponse = {
  tier: "premium",
  features: ["daily_checkins", "colleague_invites", "ai_analysis", "roster_sync"],
}

const PRICING: PricingResponse = {
  model: "per_student_per_year",
  by_quote: true,
  tax: "none at launch",
}

describe("SubscriptionApp (FR-17-01 · SC-085)", () => {
  beforeEach(() => {
    getMock.mockReset()
    pricingMock.mockReset()
    // default: every entitlements-focused test also needs pricing to resolve so it isn't
    // exercising the (separately-tested) pricing error path incidentally.
    pricingMock.mockResolvedValue(PRICING)
  })

  it("renders the Free tier and its real feature list, human-readable labels", async () => {
    getMock.mockResolvedValue(FREE)
    render(<SubscriptionApp />)
    expect(await screen.findByText("Free")).toBeInTheDocument()
    expect(screen.getByText("Daily check-ins")).toBeInTheDocument()
    expect(screen.getByText("Colleague invites")).toBeInTheDocument()
    // never renders a Premium-only feature label when the tier is free
    expect(screen.queryByText("AI analysis")).not.toBeInTheDocument()
  })

  it("renders the Premium tier with both the Free set and the advanced set", async () => {
    getMock.mockResolvedValue(PREMIUM)
    render(<SubscriptionApp />)
    expect(await screen.findByText("Premium")).toBeInTheDocument()
    expect(screen.getByText("Daily check-ins")).toBeInTheDocument()
    expect(screen.getByText("AI analysis")).toBeInTheDocument()
    expect(screen.getByText("Roster sync")).toBeInTheDocument()
  })

  // ---- FR-17-04 (GATE G-11): Free-tier "buy Premium to unlock" prompt --------------------------

  it("renders the 'buy Premium to unlock' prompt on the Free tier (retained-data upgrade prompt)", async () => {
    getMock.mockResolvedValue(FREE)
    render(<SubscriptionApp />)
    await screen.findByText("Free")
    expect(screen.getByText(/buy premium to unlock/i)).toBeInTheDocument()
    expect(screen.getByText(/read-only until you upgrade/i)).toBeInTheDocument()
  })

  it("never renders the upgrade prompt on the Premium tier", async () => {
    getMock.mockResolvedValue(PREMIUM)
    render(<SubscriptionApp />)
    await screen.findByText("Premium")
    expect(screen.queryByText(/buy premium to unlock/i)).not.toBeInTheDocument()
  })

  it("renders an unmapped feature key verbatim rather than dropping it silently", async () => {
    getMock.mockResolvedValue({ tier: "free", features: ["some_future_feature"] })
    render(<SubscriptionApp />)
    expect(await screen.findByText("some_future_feature")).toBeInTheDocument()
  })

  it("surfaces a load failure (never silently dropped)", async () => {
    getMock.mockRejectedValue(new EntitlementsApiError(500, "Couldn't load your plan. Please try again."))
    render(<SubscriptionApp />)
    expect(await screen.findByText(/couldn't load your plan/i)).toBeInTheDocument()
  })
})

// ---- FR-17-06: informational pricing model (GET /api/v1/pricing) --------------------------------

describe("SubscriptionApp pricing section (FR-17-06 · SC-085)", () => {
  beforeEach(() => {
    getMock.mockReset()
    pricingMock.mockReset()
    getMock.mockResolvedValue(FREE)
  })

  it("presents the pricing model — per student/year, cheaper at higher volumes, by quote, no tax at launch", async () => {
    pricingMock.mockResolvedValue(PRICING)
    render(<SubscriptionApp />)
    expect(await screen.findByText("Per student, per year")).toBeInTheDocument()
    expect(screen.getByText("Cheaper at higher volumes")).toBeInTheDocument()
    expect(screen.getByText("By quote")).toBeInTheDocument()
    expect(screen.getByText(/no self-service card entry/i)).toBeInTheDocument()
    expect(screen.getByText("none at launch")).toBeInTheDocument()
  })

  // NEG (ticket Do-NOT): never a hard-coded ratified per-student price number.
  it("never renders a ratified dollar price anywhere on the screen", async () => {
    pricingMock.mockResolvedValue(PRICING)
    const { container } = render(<SubscriptionApp />)
    await screen.findByText("Per student, per year")
    expect(container.textContent).not.toMatch(/\$\d/)
  })

  // NEG (ticket Scenario 2 / GATE — no PCI surface): no in-platform card entry anywhere.
  it("renders no card-entry form or input anywhere on the screen", async () => {
    pricingMock.mockResolvedValue(PRICING)
    const { container } = render(<SubscriptionApp />)
    await screen.findByText("Per student, per year")
    expect(container.querySelectorAll("input, form")).toHaveLength(0)
  })

  it("surfaces a pricing load failure without blocking the entitlements section (never silently dropped)", async () => {
    pricingMock.mockRejectedValue(new PricingApiError(500, "Couldn't load pricing. Please try again."))
    render(<SubscriptionApp />)
    expect(await screen.findByText(/couldn't load pricing/i)).toBeInTheDocument()
    // the (independently-loaded) entitlements section still renders normally
    expect(await screen.findByText("Free")).toBeInTheDocument()
  })
})
