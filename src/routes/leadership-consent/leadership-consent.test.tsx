import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { LeadershipConsentApp } from "./index"

const api = vi.hoisted(() => ({ recordConsent: vi.fn() }))
vi.mock("./api", () => ({ recordConsent: api.recordConsent }))

async function fillAndConfirm(user: ReturnType<typeof userEvent.setup>, id: string) {
  await user.type(screen.getByLabelText(/student id/i), id)
  await user.click(screen.getByRole("checkbox", { name: /confirm/i }))
}

describe("LeadershipConsentApp (FR-20-06 · SC-088)", () => {
  beforeEach(() => api.recordConsent.mockReset())
  afterEach(() => vi.restoreAllMocks())

  it("renders the attestation copy", () => {
    render(<LeadershipConsentApp />)
    expect(screen.getByRole("heading", { name: /parental-consent attestation/i })).toBeInTheDocument()
    expect(screen.getByText(/school-mediated; no parent-facing screen/i)).toBeInTheDocument()
  })

  it("disables Record consent until an id is entered AND confirmed", async () => {
    const user = userEvent.setup()
    render(<LeadershipConsentApp />)
    const submit = screen.getByRole("button", { name: /record consent/i })
    expect(submit).toBeDisabled()

    await user.type(screen.getByLabelText(/student id/i), "stu-1")
    expect(submit).toBeDisabled() // id alone is not enough — attestation must be confirmed too

    await user.click(screen.getByRole("checkbox", { name: /confirm/i }))
    expect(submit).toBeEnabled()
  })

  it("records consent, shows it in the session table, and clears the form", async () => {
    const user = userEvent.setup()
    api.recordConsent.mockResolvedValue({ status: "verified" })
    render(<LeadershipConsentApp />)

    await fillAndConfirm(user, "stu-42")
    await user.click(screen.getByRole("button", { name: /record consent/i }))

    await waitFor(() => expect(api.recordConsent).toHaveBeenCalledWith("stu-42"))
    expect(await screen.findByText("Recorded")).toBeInTheDocument()
    expect(screen.getByText("stu-42")).toBeInTheDocument()
    expect(screen.getByLabelText(/student id/i)).toHaveValue("")
    expect(screen.getByRole("checkbox", { name: /confirm/i })).not.toBeChecked()
  })

  it("surfaces a generic error and keeps the form filled in on failure", async () => {
    const user = userEvent.setup()
    api.recordConsent.mockRejectedValue(new Error("You don't have permission to record consent for this student."))
    render(<LeadershipConsentApp />)

    await fillAndConfirm(user, "stu-9")
    await user.click(screen.getByRole("button", { name: /record consent/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/permission/i)
    expect(screen.queryByText("Recorded")).not.toBeInTheDocument()
  })

  it("replaces a prior capture for the same student rather than duplicating the row", async () => {
    const user = userEvent.setup()
    api.recordConsent.mockResolvedValue({ status: "verified" })
    render(<LeadershipConsentApp />)

    await fillAndConfirm(user, "stu-7")
    await user.click(screen.getByRole("button", { name: /record consent/i }))
    await screen.findByText("Recorded")

    await fillAndConfirm(user, "stu-7")
    await user.click(screen.getByRole("button", { name: /record consent/i }))
    await waitFor(() => expect(api.recordConsent).toHaveBeenCalledTimes(2))

    expect(screen.getAllByText("stu-7")).toHaveLength(1)
  })
})
