import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { DefaultWordListsApp } from "./index"

const api = vi.hoisted(() => ({ saveDefaultConcernWords: vi.fn() }))
vi.mock("./api", () => ({ saveDefaultConcernWords: api.saveDefaultConcernWords }))

async function addWord(user: ReturnType<typeof userEvent.setup>, word: string) {
  await user.type(screen.getByLabelText(/add a default word/i), word)
  await user.click(screen.getByRole("button", { name: /^add$/i }))
}

describe("DefaultWordListsApp (FR-19-05 · SC-079)", () => {
  beforeEach(() => api.saveDefaultConcernWords.mockReset())
  afterEach(() => vi.restoreAllMocks())

  it("opens on an empty working set with Save disabled (no read endpoint)", () => {
    render(<DefaultWordListsApp />)
    expect(screen.getByRole("heading", { name: /default concern-word lists/i })).toBeInTheDocument()
    expect(screen.getByText(/no default words yet/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled()
  })

  it("Add is disabled until a non-blank word is typed", async () => {
    const user = userEvent.setup()
    render(<DefaultWordListsApp />)
    expect(screen.getByRole("button", { name: /^add$/i })).toBeDisabled()
    await user.type(screen.getByLabelText(/add a default word/i), "   ")
    expect(screen.getByRole("button", { name: /^add$/i })).toBeDisabled()
    await user.type(screen.getByLabelText(/add a default word/i), "hurt")
    expect(screen.getByRole("button", { name: /^add$/i })).toBeEnabled()
  })

  it("adds a word as a removable chip and clears the input", async () => {
    const user = userEvent.setup()
    render(<DefaultWordListsApp />)
    await addWord(user, "scared")
    expect(screen.getByText("scared")).toBeInTheDocument()
    expect(screen.getByLabelText(/add a default word/i)).toHaveValue("")
    expect(screen.getByRole("button", { name: /save/i })).toBeEnabled()
  })

  it("adds via Enter (form submit)", async () => {
    const user = userEvent.setup()
    render(<DefaultWordListsApp />)
    await user.type(screen.getByLabelText(/add a default word/i), "alone{Enter}")
    expect(screen.getByText("alone")).toBeInTheDocument()
  })

  it("ignores a case-insensitive duplicate", async () => {
    const user = userEvent.setup()
    render(<DefaultWordListsApp />)
    await addWord(user, "Alone")
    await addWord(user, "alone")
    expect(screen.getAllByText(/alone/i)).toHaveLength(1)
  })

  it("removes a word via its chip remove control", async () => {
    const user = userEvent.setup()
    render(<DefaultWordListsApp />)
    await addWord(user, "hungry")
    await user.click(screen.getByRole("button", { name: /remove hungry/i }))
    expect(screen.queryByText("hungry")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled()
  })

  it("saves the full set, adopts the BE-normalized list, and confirms the count", async () => {
    const user = userEvent.setup()
    api.saveDefaultConcernWords.mockResolvedValue({
      words: ["alone", "hopeless"],
      count: 2,
      is_default: true,
    })
    render(<DefaultWordListsApp />)
    await addWord(user, "  Alone ")
    await addWord(user, "HOPELESS")
    await user.click(screen.getByRole("button", { name: /save/i }))

    // the screen trims each entry before adding; the BE remains the authoritative normalizer
    await waitFor(() =>
      expect(api.saveDefaultConcernWords).toHaveBeenCalledWith(["Alone", "HOPELESS"]),
    )
    // adopts the normalized list returned by the BE
    expect(await screen.findByText("alone")).toBeInTheDocument()
    expect(screen.getByText("hopeless")).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent(/2 default words now apply/i)
  })

  it("uses the singular in the confirmation for a single word", async () => {
    const user = userEvent.setup()
    api.saveDefaultConcernWords.mockResolvedValue({ words: ["alone"], count: 1, is_default: true })
    render(<DefaultWordListsApp />)
    await addWord(user, "alone")
    await user.click(screen.getByRole("button", { name: /save/i }))
    expect(await screen.findByRole("status")).toHaveTextContent(/1 default word now apply/i)
  })

  it("surfaces a generic error when the save is forbidden (403) and shows no confirmation", async () => {
    const user = userEvent.setup()
    api.saveDefaultConcernWords.mockRejectedValue(
      new Error("You don't have permission to edit the default word list."),
    )
    render(<DefaultWordListsApp />)
    await addWord(user, "hurt")
    await user.click(screen.getByRole("button", { name: /save/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/permission/i)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("clears a prior confirmation when the set is edited again", async () => {
    const user = userEvent.setup()
    api.saveDefaultConcernWords.mockResolvedValue({ words: ["hurt"], count: 1, is_default: true })
    render(<DefaultWordListsApp />)
    await addWord(user, "hurt")
    await user.click(screen.getByRole("button", { name: /save/i }))
    expect(await screen.findByRole("status")).toBeInTheDocument()

    await addWord(user, "scared")
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })
})
