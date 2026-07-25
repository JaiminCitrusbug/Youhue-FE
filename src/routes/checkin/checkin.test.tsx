import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { CheckInApiError } from "./api"
import { CheckInApp } from "./index"

// Behaviour tests for the real check-in container (FR-04-01, SC-023), composed from the approved
// primitives on the approved screens' structure/copy/classes — mood select then a SEPARATE
// reflection step, real API submit, every response shape handled (201/403/409/422).

const api = vi.hoisted(() => ({ getCheckInConfig: vi.fn(), submitCheckIn: vi.fn() }))
vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>()
  return { ...actual, getCheckInConfig: api.getCheckInConfig, submitCheckIn: api.submitCheckIn }
})

function renderApp(entry = "/student") {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/student/*" element={<CheckInApp />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("CheckInApp (FR-04-01 · SC-023)", () => {
  beforeEach(() => {
    api.getCheckInConfig.mockReset()
    api.submitCheckIn.mockReset()
    api.getCheckInConfig.mockResolvedValue({
      mode: "rich", mood_set: [0, 1, 2, 3, 4, 5], read_aloud: false,
    })
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("Continue is disabled until a mood is picked, then advances to the reflection step", async () => {
    const user = userEvent.setup()
    renderApp()

    expect(await screen.findByText(/how are you/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: /good/i }))
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled()
    await user.click(screen.getByRole("button", { name: /continue/i }))

    expect(await screen.findByText(/want to say/i)).toBeInTheDocument()
    expect(screen.getByText(/feeling/i)).toHaveTextContent("Good")
  })

  it("only shows the age-appropriate mood set (config-driven, not every face)", async () => {
    api.getCheckInConfig.mockResolvedValue({ mode: "simple", mood_set: [1, 3, 5], read_aloud: true })
    renderApp()

    await screen.findByText(/how are you/i)
    expect(screen.getByRole("button", { name: /sad/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /ok/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /great/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /angry/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /worried/i })).not.toBeInTheDocument()
  })

  // ---- FR-04-03 — read_aloud: simplified-mode students hear each mood spoken on tap -------------

  it("read_aloud=true speaks the tapped mood's label and shows the read-aloud footnote", async () => {
    const speak = vi.fn()
    // jsdom implements neither of these Web Speech API globals — stub both (the utterance
    // constructor just needs to carry `.text` through, matching the real DOM shape's field name).
    vi.stubGlobal("speechSynthesis", { speak, cancel: vi.fn() })
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      vi.fn().mockImplementation((text: string) => ({ text })),
    )
    api.getCheckInConfig.mockResolvedValue({ mode: "simple", mood_set: [1, 3, 5], read_aloud: true })
    const user = userEvent.setup()
    renderApp()

    expect(await screen.findByText(/hear each one read aloud/i)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /great/i }))

    expect(speak).toHaveBeenCalledTimes(1)
    expect((speak.mock.calls[0][0] as SpeechSynthesisUtterance).text).toBe("Great")
  })

  it("read_aloud=false does not speak and hides the read-aloud footnote", async () => {
    const speak = vi.fn()
    // jsdom implements neither of these Web Speech API globals — stub both (the utterance
    // constructor just needs to carry `.text` through, matching the real DOM shape's field name).
    vi.stubGlobal("speechSynthesis", { speak, cancel: vi.fn() })
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      vi.fn().mockImplementation((text: string) => ({ text })),
    )
    api.getCheckInConfig.mockResolvedValue({
      mode: "rich", mood_set: [0, 1, 2, 3, 4, 5], read_aloud: false,
    })
    const user = userEvent.setup()
    renderApp()

    await screen.findByText(/how are you/i)
    expect(screen.queryByText(/hear each one read aloud/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /good/i }))

    expect(speak).not.toHaveBeenCalled()
  })

  it("Skip submits with no reflection and shows the success confirmation", async () => {
    const user = userEvent.setup()
    api.submitCheckIn.mockResolvedValue({ checkin_id: "c1", activity_offer: null })
    renderApp()

    await user.click(await screen.findByRole("button", { name: /good/i }))
    await user.click(screen.getByRole("button", { name: /continue/i }))
    await user.click(await screen.findByRole("button", { name: /^skip$/i }))

    await waitFor(() => expect(api.submitCheckIn).toHaveBeenCalledWith(4, undefined))
    expect(await screen.findByText(/check-in for today is saved/i)).toBeInTheDocument()
  })

  it("Done submits with the typed reflection", async () => {
    const user = userEvent.setup()
    api.submitCheckIn.mockResolvedValue({ checkin_id: "c2", activity_offer: null })
    renderApp()

    await user.click(await screen.findByRole("button", { name: /good/i }))
    await user.click(screen.getByRole("button", { name: /continue/i }))
    await user.type(await screen.findByRole("textbox", { name: /reflection/i }), "a fine day")
    await user.click(screen.getByRole("button", { name: /^done$/i }))

    await waitFor(() => expect(api.submitCheckIn).toHaveBeenCalledWith(4, "a fine day"))
    expect(await screen.findByText(/check-in for today is saved/i)).toBeInTheDocument()
  })

  it("a required-reflection 422 reveals the required state, hides Skip, and keeps the real message", async () => {
    const user = userEvent.setup()
    api.submitCheckIn.mockRejectedValue(
      new CheckInApiError(422, "A reflection is required before this check-in can be completed"),
    )
    renderApp()

    await user.click(await screen.findByRole("button", { name: /good/i }))
    await user.click(screen.getByRole("button", { name: /continue/i }))
    await user.click(await screen.findByRole("button", { name: /^skip$/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/reflection is required/i)
    expect(screen.getByText("Required")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^skip$/i })).not.toBeInTheDocument()
  })

  it("a 409 duplicate-day submission shows the real message and does not navigate away", async () => {
    const user = userEvent.setup()
    api.submitCheckIn.mockRejectedValue(new CheckInApiError(409, "You already checked in today"))
    renderApp()

    await user.click(await screen.findByRole("button", { name: /good/i }))
    await user.click(screen.getByRole("button", { name: /continue/i }))
    await user.click(await screen.findByRole("button", { name: /^skip$/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/already checked in today/i)
    expect(screen.queryByText(/check-in for today is saved/i)).not.toBeInTheDocument()
  })

  it("a 403 outside-the-window failure on config load surfaces the real message, not a generic one", async () => {
    api.getCheckInConfig.mockRejectedValue(new CheckInApiError(403, "check-in is not open right now"))
    renderApp()

    expect(await screen.findByRole("alert")).toHaveTextContent(/not open right now/i)
  })

  it("visiting /student/reflection directly (no mood chosen yet) redirects back to mood-select", async () => {
    renderApp("/student/reflection")
    expect(await screen.findByText(/how are you/i)).toBeInTheDocument()
  })

  it("Back from the reflection step returns to mood-select with the choice preserved", async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(await screen.findByRole("button", { name: /good/i }))
    await user.click(screen.getByRole("button", { name: /continue/i }))
    await screen.findByText(/want to say/i)

    await user.click(screen.getByRole("button", { name: /back/i }))
    expect(await screen.findByText(/how are you/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /good/i })).toHaveAttribute("aria-pressed", "true")
  })
})
