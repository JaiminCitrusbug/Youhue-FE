import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CoppaFerpa, Maintenance, NotFound404, PrivacyPolicy, ServerError500, Terms } from "./system"

describe("system pages", () => {
  it("404", () => {
    render(<NotFound404 />)
    expect(screen.getByText("404")).toBeInTheDocument()
    expect(screen.getByText(/page not found/i)).toBeInTheDocument()
  })
  it("500", () => {
    render(<ServerError500 />)
    expect(screen.getByText("500")).toBeInTheDocument()
  })
  it("maintenance", () => {
    render(<Maintenance />)
    expect(screen.getByText(/down for maintenance/i)).toBeInTheDocument()
  })
  it("terms", () => {
    render(<Terms />)
    expect(screen.getByRole("heading", { name: /terms of service/i })).toBeInTheDocument()
  })
  it("privacy policy (SC-009) — no-sale/no-ads posture copy renders", () => {
    render(<PrivacyPolicy />)
    expect(screen.getByRole("heading", { name: /privacy policy/i })).toBeInTheDocument()
    expect(screen.getByText(/never sell, rent, or share student data/i)).toBeInTheDocument()
  })
  it("coppa/ferpa (SC-010) — posture copy renders and the compliance-docs control is real, not dead", () => {
    render(<CoppaFerpa />)
    expect(
      screen.getByRole("heading", { name: /coppa \/ ferpa & data protection/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/school-mediated verifiable parental consent/i)).toBeInTheDocument()
    const link = screen.getByRole("link", { name: /request compliance docs/i })
    expect(link).toHaveAttribute("href", expect.stringMatching(/^mailto:/))
  })
})
