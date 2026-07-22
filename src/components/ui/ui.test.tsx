import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { AuthCard, AuthField, Banner, Button, Divider, Icon, Input, Logo } from "./index"

describe("reused UI primitives", () => {
  it("renders each Button variant and fires onClick", async () => {
    const onClick = vi.fn()
    const { rerender } = render(
      <Button variant="ink" block icon={<span data-testid="ic" />} onClick={onClick}>
        Go
      </Button>,
    )
    const btn = screen.getByRole("button", { name: /go/i })
    expect(screen.getByTestId("ic")).toBeInTheDocument()
    btn.click()
    expect(onClick).toHaveBeenCalled()
    for (const v of ["coral", "ghost", "danger"] as const) {
      rerender(<Button variant={v}>x</Button>)
      expect(screen.getByRole("button", { name: "x" })).toBeInTheDocument()
    }
  })

  it("renders an Input that accepts props", () => {
    render(<Input placeholder="email" type="email" />)
    expect(screen.getByPlaceholderText("email")).toHaveAttribute("type", "email")
  })

  it("renders AuthCard with a sub + footer, and without a sub", () => {
    const { rerender } = render(
      <AuthCard title="T" sub="S" footer={<a href="#">f</a>}>
        <p>body</p>
      </AuthCard>,
    )
    expect(screen.getByRole("heading", { name: "T" })).toBeInTheDocument()
    expect(screen.getByText("S")).toBeInTheDocument()
    expect(screen.getByText("f")).toBeInTheDocument()
    rerender(
      <AuthCard title="T2">
        <p>b</p>
      </AuthCard>,
    )
    expect(screen.getByRole("heading", { name: "T2" })).toBeInTheDocument()
  })

  it("renders AuthField, Divider, Banner tones, Icon and Logo variants", () => {
    render(
      <>
        <AuthField label="Email">
          <Input />
        </AuthField>
        <Divider />
        <Banner tone="info" icon={<Icon.Mail />}>
          info
        </Banner>
        <Banner tone="warn">warn</Banner>
        <Banner tone="danger">danger</Banner>
        <Logo wordmark="Brand" />
        <Logo dark />
      </>,
    )
    expect(screen.getByText("Email")).toBeInTheDocument()
    expect(screen.getByText("or")).toBeInTheDocument()
    expect(screen.getByText("info")).toBeInTheDocument()
    expect(screen.getByText("Brand")).toBeInTheDocument()
  })
})
