import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { SchoolRegisterApp } from "./index"
import type { RegisterOutcome } from "./api"

// FR-02-01 · SC-026 — behaviour tests for the school self-registration screen. Assertions are on
// what a teacher can see and do (never on classes or pixels), covering the ticket's positive and
// negative acceptance scenarios against the statuses the BUILT backend returns.

const api = vi.hoisted(() => ({ registerSchool: vi.fn() }))
vi.mock("./api", () => ({ registerSchool: api.registerSchool }))

const CREATED: RegisterOutcome = {
  kind: "created",
  school: { school_id: "3f0f6c3e-0000-4000-8000-000000000001", status: "pending" },
}

function renderApp() {
  render(
    <MemoryRouter initialEntries={["/register-school"]}>
      <Routes>
        <Route path="/register-school/*" element={<SchoolRegisterApp />} />
        <Route path="/sign-in" element={<h1>Sign in to Student Wellbeing</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("School name"), "Oakwood Primary")
  await user.type(screen.getByLabelText("Your work email"), "head@oakwood.edu")
  await user.type(screen.getByLabelText("Password"), "Password123")
}

const submitButton = () => screen.getByRole("button", { name: /submit for approval|submitting/i })

describe("SchoolRegisterApp (FR-02-01)", () => {
  beforeEach(() => api.registerSchool.mockReset())
  afterEach(() => vi.restoreAllMocks())

  // --- Scenario 1: register a new school in a pending state ------------------------------------
  it("submits the school details and reports the pending state the server returned", async () => {
    const user = userEvent.setup()
    api.registerSchool.mockResolvedValue(CREATED)
    renderApp()

    await fillForm(user)
    await user.click(submitButton())

    await waitFor(() =>
      expect(api.registerSchool).toHaveBeenCalledWith({
        school_name: "Oakwood Primary",
        registrant_email: "head@oakwood.edu",
        password: "Password123",
      }),
    )
    expect(await screen.findByRole("heading", { name: /registration submitted/i })).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent(/oakwood primary is registered and its status is pending/i)
  })

  it("renders whatever lifecycle status the server reports, not a hardcoded word", async () => {
    const user = userEvent.setup()
    api.registerSchool.mockResolvedValue({ kind: "created", school: { school_id: "s1", status: "awaiting_review" } })
    renderApp()

    await fillForm(user)
    await user.click(submitButton())

    expect(await screen.findByRole("status")).toHaveTextContent(/awaiting_review/i)
  })

  // --- Scenario 2 (NEG): a pending school is not live, so check-ins are not yet available -------
  it("tells the teacher a pending school is not live and cannot run check-ins yet", async () => {
    const user = userEvent.setup()
    api.registerSchool.mockResolvedValue(CREATED)
    renderApp()

    await fillForm(user)
    await user.click(submitButton())

    expect(await screen.findByText(/student check-ins are not yet available/i)).toBeInTheDocument()
    expect(screen.getByText(/approve it before it goes live/i)).toBeInTheDocument()
  })

  // --- Scenario 3 (NEG): a later teacher joins the existing approved school, no duplicate -------
  it("surfaces the 409 duplicate conflict as guidance to join/sign in, and offers a real route", async () => {
    const user = userEvent.setup()
    api.registerSchool.mockResolvedValue({
      kind: "failed",
      reason: "conflict",
      message: "A school with this name is already registered and approved. Sign in, or ask a colleague there to invite you — we won't create a duplicate.",
    })
    renderApp()

    await fillForm(user)
    await user.click(submitButton())

    expect(await screen.findByRole("alert")).toHaveTextContent(/already registered and approved/i)
    expect(screen.queryByRole("heading", { name: /registration submitted/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /go to sign in/i }))
    expect(screen.getByRole("heading", { name: /sign in to student wellbeing/i })).toBeInTheDocument()
  })

  it("surfaces the 403 already-a-member case and routes the teacher to sign in", async () => {
    const user = userEvent.setup()
    api.registerSchool.mockResolvedValue({
      kind: "failed",
      reason: "forbidden",
      message: "This email already belongs to a school. Please sign in instead.",
    })
    renderApp()

    await fillForm(user)
    await user.click(submitButton())

    expect(await screen.findByRole("alert")).toHaveTextContent(/already belongs to a school/i)
    expect(screen.getByRole("button", { name: /go to sign in/i })).toBeInTheDocument()
  })

  // --- server-side validation is the gate: the 422 becomes a real, visible message --------------
  it("surfaces the server's 422 validation rejection and keeps the teacher on the form", async () => {
    const user = userEvent.setup()
    api.registerSchool.mockResolvedValue({
      kind: "failed",
      reason: "invalid",
      message: "Please check the details: a school name is required, the email must be a valid work email, and the password must be at least 8 characters.",
    })
    renderApp()

    // The client only checks that the fields are non-empty; the 8-character minimum (and the
    // RFC-5322 email rule) are the SERVER's gate, so a "short" password reaches it and comes back 422.
    await user.type(screen.getByLabelText("School name"), "Oakwood Primary")
    await user.type(screen.getByLabelText("Your work email"), "head@oakwood.edu")
    await user.type(screen.getByLabelText("Password"), "short")
    await user.click(submitButton())

    expect(await screen.findByRole("alert")).toHaveTextContent(/at least 8 characters/i)
    expect(screen.getByRole("heading", { name: /register your school/i })).toBeInTheDocument()
    // guidance-only failures do NOT offer the sign-in shortcut
    expect(screen.queryByRole("button", { name: /go to sign in/i })).not.toBeInTheDocument()
  })

  it("surfaces the 429 throttle message", async () => {
    const user = userEvent.setup()
    api.registerSchool.mockResolvedValue({
      kind: "failed",
      reason: "throttled",
      message: "Too many attempts. Please wait a moment, then try again.",
    })
    renderApp()

    await fillForm(user)
    await user.click(submitButton())

    expect(await screen.findByRole("alert")).toHaveTextContent(/too many attempts/i)
  })

  it("surfaces a network failure as a generic error instead of failing silently", async () => {
    const user = userEvent.setup()
    api.registerSchool.mockRejectedValue(new Error("offline"))
    renderApp()

    await fillForm(user)
    await user.click(submitButton())

    expect(await screen.findByRole("alert")).toHaveTextContent(/something went wrong/i)
  })

  // --- loading / disabled ------------------------------------------------------------------------
  it("disables submit until the required details are entered", async () => {
    const user = userEvent.setup()
    renderApp()

    expect(submitButton()).toBeDisabled()
    await user.type(screen.getByLabelText("School name"), "Oakwood Primary")
    expect(submitButton()).toBeDisabled()
    await user.type(screen.getByLabelText("Your work email"), "head@oakwood.edu")
    expect(submitButton()).toBeDisabled()
    await user.type(screen.getByLabelText("Password"), "Password123")
    expect(submitButton()).toBeEnabled()
  })

  it("shows a busy state during submit and cannot be submitted twice", async () => {
    const user = userEvent.setup()
    let settle: (o: RegisterOutcome) => void = () => {}
    api.registerSchool.mockReturnValue(
      new Promise<RegisterOutcome>((resolve) => {
        settle = resolve
      }),
    )
    renderApp()

    await fillForm(user)
    await user.click(submitButton())

    expect(await screen.findByRole("status")).toHaveTextContent(/submitting your school for approval/i)
    expect(submitButton()).toBeDisabled()

    await user.click(submitButton())
    expect(api.registerSchool).toHaveBeenCalledTimes(1)

    settle(CREATED)
    expect(await screen.findByRole("heading", { name: /registration submitted/i })).toBeInTheDocument()
  })

  it("clears a previous error when the teacher resubmits", async () => {
    const user = userEvent.setup()
    api.registerSchool
      .mockResolvedValueOnce({ kind: "failed", reason: "throttled", message: "Too many attempts. Please wait a moment, then try again." })
      .mockResolvedValueOnce(CREATED)
    renderApp()

    await fillForm(user)
    await user.click(submitButton())
    expect(await screen.findByRole("alert")).toBeInTheDocument()

    await user.click(submitButton())
    expect(await screen.findByRole("heading", { name: /registration submitted/i })).toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  // --- no preview scaffolding ships --------------------------------------------------------------
  it("ships no dead controls: the footer link routes to sign-in (no href='#')", async () => {
    const user = userEvent.setup()
    renderApp()

    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("href", "/sign-in")
    }
    await user.click(screen.getByRole("link", { name: /back to sign in/i }))
    expect(screen.getByRole("heading", { name: /sign in to student wellbeing/i })).toBeInTheDocument()
  })

  it("does not ship the approved preview's fixture values or its district/trust dropdown", () => {
    renderApp()
    // the approved screen is a static preview: `defaultValue="Maple Primary School"` etc. are fixtures
    expect(screen.getByLabelText("School name")).toHaveValue("")
    expect(screen.getByLabelText("Your work email")).toHaveValue("")
    // the built contract has no district field — a select that is never sent would be a dead control
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
    expect(screen.queryByText(/northwood learning trust/i)).not.toBeInTheDocument()
  })

  it("redirects an unknown sub-path back to the registration screen", () => {
    render(
      <MemoryRouter initialEntries={["/register-school/nope"]}>
        <Routes>
          <Route path="/register-school/*" element={<SchoolRegisterApp />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByRole("heading", { name: /register your school/i })).toBeInTheDocument()
  })
})
