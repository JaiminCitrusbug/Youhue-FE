import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as api from "./api"
import type { SchoolSettings } from "./api"
import { ConcernWords } from "./ConcernWords"

vi.mock("../../app/AuthContext", () => ({
  useAuth: () => ({
    user: { subject_id: "u1", kind: "staff", role: "leadership", school_id: "sch1" },
    loading: false,
    refresh: vi.fn(),
    signOut: vi.fn(),
  }),
}))

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>()
  return { ...actual, getSettings: vi.fn(), updateConcernWords: vi.fn() }
})

const getMock = vi.mocked(api.getSettings)
const updateMock = vi.mocked(api.updateConcernWords)

const BASE_SETTINGS: SchoolSettings = {
  concern_words: { platform_defaults: ["hurt", "unsafe"], school_additions: ["kms"] },
  alert_routing: [],
  access_window: null,
}

describe("ConcernWords screen (FR-16-02 · SC-060)", () => {
  beforeEach(() => {
    getMock.mockReset().mockResolvedValue({ settings: BASE_SETTINGS })
    updateMock.mockReset()
  })

  it("shows locked platform defaults and removable school additions", async () => {
    render(<ConcernWords />)
    expect(await screen.findByText("hurt")).toBeInTheDocument()
    expect(screen.getByText("unsafe")).toBeInTheDocument()
    expect(screen.getByText("kms")).toBeInTheDocument()
    // only the addition has a remove control
    expect(screen.getAllByRole("button", { name: /remove/i })).toHaveLength(1)
  })

  it("adding a word via Enter stages it locally, then Save persists it", async () => {
    updateMock.mockResolvedValue({
      settings: {
        ...BASE_SETTINGS,
        concern_words: { platform_defaults: ["hurt", "unsafe"], school_additions: ["kms", "hate school"] },
      },
    })
    const user = userEvent.setup()
    render(<ConcernWords />)
    await screen.findByText("kms")

    const input = screen.getByPlaceholderText(/type a word/i)
    await user.type(input, "hate school{Enter}")
    expect(screen.getByText("hate school")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /^save$/i }))
    await waitFor(() => expect(updateMock).toHaveBeenCalledWith("sch1", ["kms", "hate school"]))
  })

  it("removing an addition takes it off the staged list", async () => {
    const user = userEvent.setup()
    render(<ConcernWords />)
    await screen.findByText("kms")

    await user.click(screen.getByRole("button", { name: /remove/i }))
    expect(screen.queryByText("kms")).not.toBeInTheDocument()
  })

  it("Reset to default clears staged additions without calling the API", async () => {
    const user = userEvent.setup()
    render(<ConcernWords />)
    await screen.findByText("kms")

    await user.click(screen.getByRole("button", { name: /reset to default/i }))
    expect(screen.queryByText("kms")).not.toBeInTheDocument()
    expect(updateMock).not.toHaveBeenCalled()
  })

  it("surfaces a save failure (never silently dropped)", async () => {
    updateMock.mockRejectedValue(new Error("request failed: 422"))
    const user = userEvent.setup()
    render(<ConcernWords />)
    await screen.findByText("kms")

    await user.click(screen.getByRole("button", { name: /^save$/i }))
    expect(await screen.findByText(/isn't valid/i)).toBeInTheDocument()
  })

  it("surfaces a load failure (never silently dropped)", async () => {
    getMock.mockReset().mockRejectedValue(new Error("request failed: 500"))
    render(<ConcernWords />)
    expect(await screen.findByText(/could not be loaded/i)).toBeInTheDocument()
  })
})
