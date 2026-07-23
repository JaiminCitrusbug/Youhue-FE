import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { DefaultWordListsApp } from "./index"

const api = vi.hoisted(() => ({
  getDefaultConcernWords: vi.fn(),
  saveDefaultConcernWords: vi.fn(),
}))
vi.mock("./api", () => ({
  getDefaultConcernWords: api.getDefaultConcernWords,
  saveDefaultConcernWords: api.saveDefaultConcernWords,
}))

function resp(words: string[]) {
  return { words, count: words.length, is_default: true }
}

async function addWord(user: ReturnType<typeof userEvent.setup>, word: string) {
  await user.type(screen.getByLabelText(/add a default word/i), word)
  await user.click(screen.getByRole("button", { name: /^add$/i }))
}

// Render and wait for the on-mount GET to settle into the editor (the add field appears only once the
// current default has loaded — a failed/never-completed load never shows it).
async function renderLoaded() {
  render(<DefaultWordListsApp />)
  await screen.findByLabelText(/add a default word/i)
}

describe("DefaultWordListsApp (FR-19-05 · SC-079)", () => {
  beforeEach(() => {
    api.getDefaultConcernWords.mockReset()
    api.saveDefaultConcernWords.mockReset()
    // Default: the platform default is seeded-but-empty (a real, safe state). Individual tests
    // override this to load a populated list or to fail the load.
    api.getDefaultConcernWords.mockResolvedValue(resp([]))
  })
  afterEach(() => vi.restoreAllMocks())

  it("loads the current default on mount and renders it as the working set (Blocker 1)", async () => {
    api.getDefaultConcernWords.mockResolvedValue(resp(["hurt", "scared"]))
    render(<DefaultWordListsApp />)
    // a loading state is shown first, then the persisted list as chips — NOT an empty editor
    expect(screen.getByRole("status")).toHaveTextContent(/loading/i)
    expect(await screen.findByText("hurt")).toBeInTheDocument()
    expect(screen.getByText("scared")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /default concern-word lists/i })).toBeInTheDocument()
  })

  it("withholds the editor and offers retry when the load fails — never a silent empty editor (Blocker 1)", async () => {
    const user = userEvent.setup()
    api.getDefaultConcernWords.mockRejectedValueOnce(new Error("boom"))
    render(<DefaultWordListsApp />)

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t load/i)
    // the destructive surface is not reachable after a failed read
    expect(screen.queryByLabelText(/add a default word/i)).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^save$/i })).not.toBeInTheDocument()

    // retry re-reads and recovers into the editor
    api.getDefaultConcernWords.mockResolvedValue(resp(["alone"]))
    await user.click(screen.getByRole("button", { name: /retry/i }))
    expect(await screen.findByText("alone")).toBeInTheDocument()
  })

  it("shows the empty state only when the default is genuinely unseeded", async () => {
    await renderLoaded()
    expect(screen.getByText(/no default words yet/i)).toBeInTheDocument()
  })

  it("Add is disabled until a non-blank word is typed", async () => {
    const user = userEvent.setup()
    await renderLoaded()
    expect(screen.getByRole("button", { name: /^add$/i })).toBeDisabled()
    await user.type(screen.getByLabelText(/add a default word/i), "   ")
    expect(screen.getByRole("button", { name: /^add$/i })).toBeDisabled()
    await user.type(screen.getByLabelText(/add a default word/i), "hurt")
    expect(screen.getByRole("button", { name: /^add$/i })).toBeEnabled()
  })

  it("adds a word as a removable chip and clears the input", async () => {
    const user = userEvent.setup()
    await renderLoaded()
    await addWord(user, "scared")
    expect(screen.getByText("scared")).toBeInTheDocument()
    expect(screen.getByLabelText(/add a default word/i)).toHaveValue("")
    expect(screen.getByRole("button", { name: /^save$/i })).toBeEnabled()
  })

  it("adds via Enter (form submit)", async () => {
    const user = userEvent.setup()
    await renderLoaded()
    await user.type(screen.getByLabelText(/add a default word/i), "alone{Enter}")
    expect(screen.getByText("alone")).toBeInTheDocument()
  })

  it("ignores a case-insensitive duplicate", async () => {
    const user = userEvent.setup()
    await renderLoaded()
    await addWord(user, "Alone")
    await addWord(user, "alone")
    expect(screen.getAllByText(/alone/i)).toHaveLength(1)
  })

  it("removes a word via its chip remove control", async () => {
    const user = userEvent.setup()
    await renderLoaded()
    await addWord(user, "hungry")
    await user.click(screen.getByRole("button", { name: /^remove$/i }))
    expect(screen.queryByText("hungry")).not.toBeInTheDocument()
  })

  // Minor 4 — the approved `Chip` gives every remove button aria-label="remove", so with several chips
  // on screen nothing else proves the RIGHT one is removed. This asserts it explicitly.
  it("removes the RIGHT chip when several are on screen, leaving the others", async () => {
    const user = userEvent.setup()
    api.getDefaultConcernWords.mockResolvedValue(resp(["hurt", "scared", "alone"]))
    render(<DefaultWordListsApp />)
    await screen.findByText("scared")

    const removeButtons = screen.getAllByRole("button", { name: /^remove$/i })
    expect(removeButtons).toHaveLength(3)
    // remove the MIDDLE chip ("scared")
    await user.click(removeButtons[1])

    expect(screen.queryByText("scared")).not.toBeInTheDocument()
    expect(screen.getByText("hurt")).toBeInTheDocument()
    expect(screen.getByText("alone")).toBeInTheDocument()
  })

  it("saves the full set, adopts the BE-normalized list, and confirms the count", async () => {
    const user = userEvent.setup()
    api.saveDefaultConcernWords.mockResolvedValue(resp(["alone", "hopeless"]))
    await renderLoaded()
    await addWord(user, "  Alone ")
    await addWord(user, "HOPELESS")
    await user.click(screen.getByRole("button", { name: /^save$/i }))

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
    api.saveDefaultConcernWords.mockResolvedValue(resp(["alone"]))
    await renderLoaded()
    await addWord(user, "alone")
    await user.click(screen.getByRole("button", { name: /^save$/i }))
    expect(await screen.findByRole("status")).toHaveTextContent(/1 default word now apply/i)
  })

  it("surfaces a generic error when the save is forbidden (403) and shows no confirmation", async () => {
    const user = userEvent.setup()
    api.saveDefaultConcernWords.mockRejectedValue(
      new Error("You don't have permission to edit the default word list."),
    )
    await renderLoaded()
    await addWord(user, "hurt")
    await user.click(screen.getByRole("button", { name: /^save$/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/permission/i)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("clears a prior confirmation when the set is edited again", async () => {
    const user = userEvent.setup()
    api.saveDefaultConcernWords.mockResolvedValue(resp(["hurt"]))
    await renderLoaded()
    await addWord(user, "hurt")
    await user.click(screen.getByRole("button", { name: /^save$/i }))
    expect(await screen.findByRole("status")).toBeInTheDocument()

    await addWord(user, "scared")
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  // Blocker 1 (guard half) — the one destructive save the UI can otherwise do silently is a PUT of an
  // empty set (clears the default for every non-overriding school). It must require explicit confirm.
  it("never PUTs an empty set silently — the first Save only asks to confirm, a second click commits", async () => {
    const user = userEvent.setup()
    api.saveDefaultConcernWords.mockResolvedValue(resp([]))
    await renderLoaded() // seeded-empty, nothing added

    await user.click(screen.getByRole("button", { name: /^save$/i }))
    // no write yet — instead a clear, destructive-intent confirmation is shown
    expect(api.saveDefaultConcernWords).not.toHaveBeenCalled()
    expect(screen.getByRole("alert")).toHaveTextContent(/clears the entire default list/i)

    // an explicit confirmation is what finally sends the empty replace
    await user.click(screen.getByRole("button", { name: /confirm.*empty list/i }))
    await waitFor(() => expect(api.saveDefaultConcernWords).toHaveBeenCalledWith([]))
  })

  it("lets the admin cancel the empty-list confirmation without saving", async () => {
    const user = userEvent.setup()
    await renderLoaded()
    await user.click(screen.getByRole("button", { name: /^save$/i }))
    expect(screen.getByRole("alert")).toHaveTextContent(/clears the entire default list/i)

    await user.click(screen.getByRole("button", { name: /cancel/i }))
    expect(screen.queryByText(/clears the entire default list/i)).not.toBeInTheDocument()
    expect(api.saveDefaultConcernWords).not.toHaveBeenCalled()
  })
})
