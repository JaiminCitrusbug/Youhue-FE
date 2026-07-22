import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ErrorBoundary } from "./ErrorBoundary"

function Boom(): never {
  throw new Error("boom")
}

describe("ErrorBoundary", () => {
  it("shows the 500 surface when a child throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )
    expect(screen.getByText("500")).toBeInTheDocument()
  })

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>all good</div>
      </ErrorBoundary>,
    )
    expect(screen.getByText("all good")).toBeInTheDocument()
  })
})
