import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as guidanceApi from "./api"
import type { Guidance } from "./api"
import { GuidedResponseApp } from "./index"

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>()
  return { ...actual, getGuidance: vi.fn() }
})

const getMock = vi.mocked(guidanceApi.getGuidance)

const GUIDANCE: Guidance = {
  suggested_wording: '"Hi, I noticed something in their check-in stood out to you — I just wanted to check in. How are you doing, really?"',
  next_steps: [
    "Find a quiet, low-pressure moment to check in — not in front of peers.",
    "Listen first; you don't need to have all the answers.",
    "Let your school's designated safeguarding lead know what you noticed.",
  ],
  links: [{ label: "School safeguarding steps" }, { label: "When and how to escalate" }],
}

function renderAtFlag(flagId = "f1") {
  return render(
    <MemoryRouter initialEntries={[`/app/flags/${flagId}/guidance`]}>
      <Routes>
        <Route path="/app/flags/:flagId/guidance" element={<GuidedResponseApp />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("GuidedResponse screen (FR-13-04 · SC-040)", () => {
  beforeEach(() => {
    getMock.mockReset()
  })

  it("Scenario 1: offers suggested wording, next steps and useful links when opened", async () => {
    getMock.mockResolvedValue(GUIDANCE)
    renderAtFlag()
    expect(await screen.findByText(GUIDANCE.suggested_wording)).toBeInTheDocument()
    for (const step of GUIDANCE.next_steps) {
      expect(screen.getByText(step)).toBeInTheDocument()
    }
    expect(screen.getByText("School safeguarding steps")).toBeInTheDocument()
    expect(screen.getByText("When and how to escalate")).toBeInTheDocument()
  })

  it("Scenario 2: the suggestions are advisory only — adapt is a real local action, never a gate", async () => {
    getMock.mockResolvedValue(GUIDANCE)
    renderAtFlag()
    await screen.findByText(GUIDANCE.suggested_wording)

    // "use" — the send control exists but is a real, disabled stand-in (FR-13-05 not yet built),
    // never a forced/required step.
    const useButton = screen.getByRole("button", { name: /use & send a private note/i })
    expect(useButton).toBeDisabled()

    // "adapt" — a genuine, working local action: toggles the wording into an editable field.
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: /adapt wording/i }))
    const textarea = screen.getByRole("textbox", { name: /adapt the suggested wording/i })
    expect(textarea).toHaveValue(GUIDANCE.suggested_wording)
    await user.type(textarea, " Adjusted.")
    expect(textarea).toHaveValue(`${GUIDANCE.suggested_wording} Adjusted.`)

    // "ignore" — nothing on the screen requires acting on any suggestion at all; there is no
    // required/gate field anywhere in the rendered guidance.
    expect(screen.queryByText(/required/i)).not.toBeInTheDocument()
  })

  it("surfaces a load failure (never silently dropped)", async () => {
    getMock.mockRejectedValue(new Error("request failed: 500"))
    renderAtFlag()
    expect(await screen.findByText(/could not be loaded/i)).toBeInTheDocument()
  })

  it("the not-yet-built intervention log control is a real disabled stand-in, not a dead link", async () => {
    getMock.mockResolvedValue(GUIDANCE)
    renderAtFlag()
    await screen.findByText(GUIDANCE.suggested_wording)
    expect(screen.getByRole("button", { name: /log this response/i })).toBeDisabled()
  })

  it("useful links render as plain rows, never a dead href=\"#\" anchor", async () => {
    getMock.mockResolvedValue(GUIDANCE)
    renderAtFlag()
    await screen.findByText(GUIDANCE.suggested_wording)
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })
})
