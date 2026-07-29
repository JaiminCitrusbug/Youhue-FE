import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { StudentSignInApp } from "./index"
import type { RosterListResponse, StudentSignInResponse } from "./api"

// Behaviour tests for the student sign-in screens, composed from the approved primitives
// (@design/components) on the approved screens' structure/copy/classes. FR-01-02's own roster
// endpoint (GET /auth/student/roster) is mocked here — the real roster now drives the picker,
// never a hardcoded fixture (closes DEF-007).

const api = vi.hoisted(() => ({ studentSignIn: vi.fn(), getStudentRoster: vi.fn() }))
vi.mock("./api", () => ({ studentSignIn: api.studentSignIn, getStudentRoster: api.getStudentRoster }))

const auth = vi.hoisted(() => ({ refresh: vi.fn() }))
vi.mock("../../app/AuthContext", () => ({ useAuth: () => ({ refresh: auth.refresh }) }))

const OK: StudentSignInResponse = { session_token: "st", student_id: "id", age_band: "8-10" }
const ROSTER: RosterListResponse = {
  students: [
    { id: "s-amy", display_name: "Amy K" },
    { id: "s-ben", display_name: "Ben O" },
  ],
}

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

async function goToWhoWithCode(user: ReturnType<typeof userEvent.setup>, code = "map123") {
  await user.type(screen.getByRole("textbox", { name: /class or school code/i }), code)
  await user.click(screen.getByRole("button", { name: /continue/i }))
  await screen.findByText(/who are you/i)
}

describe("StudentSignInApp (FR-01-02)", () => {
  beforeEach(() => {
    api.studentSignIn.mockReset()
    api.getStudentRoster.mockReset()
    api.getStudentRoster.mockResolvedValue(ROSTER)
    auth.refresh.mockReset()
  })
  afterEach(() => vi.restoreAllMocks())

  it("Continue is disabled until a code is typed", async () => {
    const user = userEvent.setup()
    renderApp("/student/sign-in")

    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled()

    await user.type(screen.getByRole("textbox", { name: /class or school code/i }), "m")
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled()
  })

  it("ships no dead controls: the footer links route (no href='#')", () => {
    renderApp("/student/sign-in")
    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("href", "/terms")
    }
    expect(screen.getAllByRole("link").length).toBeGreaterThan(0)
  })

  it("fetches the REAL roster for the entered code, never a fixture", async () => {
    const user = userEvent.setup()
    renderApp("/student/sign-in")
    await goToWhoWithCode(user, "map123")

    await waitFor(() =>
      expect(api.getStudentRoster).toHaveBeenCalledWith({ school_or_class_code: "MAP123" }),
    )
    expect(screen.getByRole("button", { name: /amy k/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /ben o/i })).toBeInTheDocument()
  })

  it("signs in with a class/school code + REAL name selection, then lands on the daily check-in", async () => {
    const user = userEvent.setup()
    api.studentSignIn.mockResolvedValue(OK)
    renderApp("/student/sign-in")
    await goToWhoWithCode(user, "map123")

    await user.click(screen.getByRole("button", { name: /ben o/i }))
    await user.click(screen.getByRole("button", { name: /that's me/i }))

    await waitFor(() =>
      expect(api.studentSignIn).toHaveBeenCalledWith({ school_or_class_code: "MAP123", student_id: "s-ben" }),
    )
    expect(auth.refresh).toHaveBeenCalled()
    expect(await screen.findByText(/daily check-in/i)).toBeInTheDocument()
  })

  it("surfaces a real error and an empty picker when the roster fetch fails — never a fake fallback", async () => {
    const user = userEvent.setup()
    api.getStudentRoster.mockRejectedValue(new Error("That code didn't work — ask your teacher."))
    renderApp("/student/sign-in")
    await goToWhoWithCode(user, "bad")

    expect(await screen.findByRole("alert")).toHaveTextContent(/didn't work/i)
    expect(screen.getByText(/no students found/i)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /that's me/i })).not.toBeInTheDocument()
  })

  it("surfaces a genuinely empty roster distinctly (no crash, no fake names)", async () => {
    const user = userEvent.setup()
    api.getStudentRoster.mockResolvedValue({ students: [] })
    renderApp("/student/sign-in")
    await goToWhoWithCode(user, "empty1")

    expect(screen.getByText(/no students found/i)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /that's me/i })).not.toBeInTheDocument()
  })

  it("surfaces a sign-in error and stays on the sign-in surface", async () => {
    const user = userEvent.setup()
    api.studentSignIn.mockRejectedValue(new Error("That code didn't work — ask your teacher."))
    renderApp("/student/sign-in")
    await goToWhoWithCode(user, "bad")

    await user.click(screen.getByRole("button", { name: /that's me/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/didn't work/i)
    expect(screen.queryByText(/daily check-in/i)).not.toBeInTheDocument()
  })

  it("surfaces a busy state while the sign-in is in flight and disables a double submit", async () => {
    const user = userEvent.setup()
    let settle: (r: StudentSignInResponse) => void = () => {}
    api.studentSignIn.mockReturnValue(
      new Promise<StudentSignInResponse>((resolve) => {
        settle = resolve
      }),
    )
    renderApp("/student/sign-in")
    await goToWhoWithCode(user)
    await user.click(screen.getByRole("button", { name: /that's me/i }))
    expect(await screen.findByRole("status")).toHaveTextContent(/signing you in/i)

    expect(screen.getByRole("button", { name: /that's me/i })).toBeDisabled()
    await user.click(screen.getByRole("button", { name: /that's me/i }))
    expect(api.studentSignIn).toHaveBeenCalledTimes(1)

    settle(OK)
    await waitFor(() => expect(auth.refresh).toHaveBeenCalled())
  })

  it("offers the QR method, and can switch back to typing a code", async () => {
    const user = userEvent.setup()
    renderApp("/student/sign-in")
    await user.click(screen.getByRole("button", { name: /scan a qr code instead/i }))
    expect(screen.getByText(/scan your class qr/i)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /type a code instead/i }))
    expect(screen.getByRole("heading", { name: /enter your class code/i })).toBeInTheDocument()
  })

  it("adopts a scanned QR deep-link (?qr=), fetches the roster BY QR, and signs in with the qr_token", async () => {
    const user = userEvent.setup()
    api.studentSignIn.mockResolvedValue(OK)
    renderApp("/student/sign-in?qr=QRTOK")

    expect(await screen.findByText(/who are you/i)).toBeInTheDocument()
    await waitFor(() => expect(api.getStudentRoster).toHaveBeenCalledWith({ qr_token: "QRTOK" }))
    await user.click(screen.getByRole("button", { name: /amy k/i }))
    await user.click(screen.getByRole("button", { name: /that's me/i }))

    await waitFor(() =>
      expect(api.studentSignIn).toHaveBeenCalledWith({ qr_token: "QRTOK", student_id: "s-amy" }),
    )
  })

  it("reads the REAL class names aloud when supported", async () => {
    const user = userEvent.setup()
    const speak = vi.fn()
    vi.stubGlobal("speechSynthesis", { cancel: vi.fn(), speak })
    vi.stubGlobal("SpeechSynthesisUtterance", class {
      constructor(public text: string) {}
    })
    renderApp("/student/sign-in")
    await goToWhoWithCode(user)
    await user.click(screen.getByRole("button", { name: /read names aloud/i }))
    expect(speak).toHaveBeenCalledTimes(2)
  })
})
