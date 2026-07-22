import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { StudentSignInApp } from "./index"
import type { StudentSignInResponse } from "./api"

const api = vi.hoisted(() => ({ studentSignIn: vi.fn() }))
vi.mock("./api", () => ({ studentSignIn: api.studentSignIn }))

const auth = vi.hoisted(() => ({ refresh: vi.fn() }))
vi.mock("../../app/AuthContext", () => ({ useAuth: () => ({ refresh: auth.refresh }) }))

const OK: StudentSignInResponse = { session_token: "st", student_id: "id", age_band: "8-10" }

function renderApp(entry: string) {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/student/sign-in/*" element={<StudentSignInApp />} />
        <Route path="/student" element={<h1>Daily check-in</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("StudentSignInApp (FR-01-02)", () => {
  beforeEach(() => {
    api.studentSignIn.mockReset()
    auth.refresh.mockReset()
  })
  afterEach(() => vi.restoreAllMocks())

  it("Continue is disabled until a code is typed", () => {
    renderApp("/student/sign-in")
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled()
  })

  it("signs in with a class/school code + name selection, then lands on the daily check-in", async () => {
    const user = userEvent.setup()
    api.studentSignIn.mockResolvedValue(OK)
    renderApp("/student/sign-in")

    await user.type(screen.getByRole("textbox", { name: /class or school code/i }), "map123")
    await user.click(screen.getByRole("button", { name: /continue/i }))

    expect(screen.getByText(/who are you/i)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /liam/i }))
    await user.click(screen.getByRole("button", { name: /that's me/i }))

    await waitFor(() =>
      expect(api.studentSignIn).toHaveBeenCalledWith({ school_or_class_code: "MAP123", student_id: "s-liam" }),
    )
    expect(auth.refresh).toHaveBeenCalled()
    expect(await screen.findByText(/daily check-in/i)).toBeInTheDocument()
  })

  it("surfaces a sign-in error and stays on the sign-in surface", async () => {
    const user = userEvent.setup()
    api.studentSignIn.mockRejectedValue(new Error("That code didn't work — ask your teacher."))
    renderApp("/student/sign-in")

    await user.type(screen.getByRole("textbox", { name: /class or school code/i }), "bad")
    await user.click(screen.getByRole("button", { name: /continue/i }))
    await user.click(screen.getByRole("button", { name: /that's me/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/didn't work/i)
    expect(screen.queryByText(/daily check-in/i)).not.toBeInTheDocument()
  })

  it("offers the QR method, and can switch back to typing a code", async () => {
    const user = userEvent.setup()
    renderApp("/student/sign-in")
    await user.click(screen.getByRole("button", { name: /scan a qr code instead/i }))
    expect(screen.getByText(/scan your class qr/i)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /type a code instead/i }))
    expect(screen.getByRole("heading", { name: /enter your class code/i })).toBeInTheDocument()
  })

  it("adopts a scanned QR deep-link (?qr=) and signs in with the qr_token, not a code", async () => {
    const user = userEvent.setup()
    api.studentSignIn.mockResolvedValue(OK)
    renderApp("/student/sign-in?qr=QRTOK")

    expect(await screen.findByText(/who are you/i)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /that's me/i }))

    await waitFor(() =>
      expect(api.studentSignIn).toHaveBeenCalledWith({ qr_token: "QRTOK", student_id: "s-aisha" }),
    )
  })

  it("reads the class names aloud when supported", async () => {
    const user = userEvent.setup()
    const speak = vi.fn()
    vi.stubGlobal("speechSynthesis", { cancel: vi.fn(), speak })
    vi.stubGlobal("SpeechSynthesisUtterance", class {
      constructor(public text: string) {}
    })
    renderApp("/student/sign-in/who")
    await user.click(screen.getByRole("button", { name: /read names aloud/i }))
    expect(speak).toHaveBeenCalledTimes(6)
  })
})
