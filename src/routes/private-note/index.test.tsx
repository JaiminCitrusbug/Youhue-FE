import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as noteApi from "./api"
import type { FlagStudent } from "./api"
import { PrivateNoteApp } from "./index"

// FR-13-05 · SC-041 — Private supportive note. NEG gate (the ticket's whole point) is a BE-side
// guarantee (tested in `tests/test_private_notes.py`); these are the FE behaviour tests: real
// send, real cancel, real errors, never a fabricated default message.

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>()
  return { ...actual, getFlagStudent: vi.fn(), sendNote: vi.fn() }
})

const getFlagStudentMock = vi.mocked(noteApi.getFlagStudent)
const sendNoteMock = vi.mocked(noteApi.sendNote)

const TARGET: FlagStudent = { student_id: "s1", student_name: "Liam O." }

function renderAtFlag(flagId = "f1", state?: { wording?: string }) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: `/app/flags/${flagId}/note`, state }]}>
      <Routes>
        <Route path="/app/flags/:flagId/note" element={<PrivateNoteApp />} />
        <Route path="/app/flags/:flagId/guidance" element={<h1>Guidance page</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("PrivateNote screen (FR-13-05 · SC-041)", () => {
  beforeEach(() => {
    getFlagStudentMock.mockReset()
    sendNoteMock.mockReset()
  })

  it("Scenario 1: resolves the real student and sends a private note", async () => {
    getFlagStudentMock.mockResolvedValue(TARGET)
    sendNoteMock.mockResolvedValue({ note_id: "n1" })
    renderAtFlag("f1", { wording: "Hi Liam, checking in." })

    expect(await screen.findByText("Send a private note to Liam O.")).toBeInTheDocument()
    expect(screen.getByText("Private — only Liam sees this")).toBeInTheDocument()
    const textarea = screen.getByRole("textbox", { name: /message/i })
    expect(textarea).toHaveValue("Hi Liam, checking in.")

    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: /send privately/i }))

    expect(await screen.findByText("Guidance page")).toBeInTheDocument()
    expect(sendNoteMock).toHaveBeenCalledWith("s1", "Hi Liam, checking in.")
  })

  it("starts with an empty message when reached with no wording state — never a fabricated default", async () => {
    getFlagStudentMock.mockResolvedValue(TARGET)
    renderAtFlag("f1", undefined)
    await screen.findByText("Send a private note to Liam O.")
    const textarea = screen.getByRole("textbox", { name: /message/i })
    expect(textarea).toHaveValue("")
  })

  it("cancel navigates back to guidance without sending", async () => {
    getFlagStudentMock.mockResolvedValue(TARGET)
    renderAtFlag("f1", { wording: "draft" })
    await screen.findByText("Send a private note to Liam O.")

    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: /cancel/i }))

    expect(await screen.findByText("Guidance page")).toBeInTheDocument()
    expect(sendNoteMock).not.toHaveBeenCalled()
  })

  it("surfaces a load failure (never silently dropped)", async () => {
    getFlagStudentMock.mockRejectedValue(new Error("request failed: 403"))
    renderAtFlag()
    expect(await screen.findByText(/could not be opened/i)).toBeInTheDocument()
  })

  it("surfaces a send failure and stays on the form so the teacher can retry", async () => {
    getFlagStudentMock.mockResolvedValue(TARGET)
    sendNoteMock.mockRejectedValue(new Error("request failed: 500"))
    renderAtFlag("f1", { wording: "draft" })
    await screen.findByText("Send a private note to Liam O.")

    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: /send privately/i }))

    expect(await screen.findByText(/could not send this note/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /send privately/i })).toBeEnabled()
  })

  it("the send control is disabled while the message is empty, never a dead-but-clickable control", async () => {
    getFlagStudentMock.mockResolvedValue(TARGET)
    renderAtFlag("f1", undefined)
    await screen.findByText("Send a private note to Liam O.")
    expect(screen.getByRole("button", { name: /send privately/i })).toBeDisabled()
  })
})
