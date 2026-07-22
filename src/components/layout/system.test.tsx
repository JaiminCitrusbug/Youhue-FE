import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Maintenance, NotFound404, ServerError500, Terms } from "./system"

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
})
