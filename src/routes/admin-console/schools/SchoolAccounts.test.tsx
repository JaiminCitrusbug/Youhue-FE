import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as api from "./api"
import type { SchoolListItem } from "./api"
import { SchoolAccounts } from "./SchoolAccounts"

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>()
  return { ...actual, listSchools: vi.fn() }
})

const listMock = vi.mocked(api.listSchools)

const OAKFIELD: SchoolListItem = { id: "s1", name: "Oakfield Primary", tier: "premium", status: "active" }
const RIVERSIDE: SchoolListItem = { id: "s2", name: "Riverside", tier: "free", status: "pending" }

function renderScreen() {
  return render(
    <MemoryRouter>
      <SchoolAccounts />
    </MemoryRouter>,
  )
}

describe("SchoolAccounts screen (FR-19-02 · SC-075)", () => {
  beforeEach(() => {
    listMock.mockReset().mockResolvedValue({ schools: [OAKFIELD, RIVERSIDE], count: 2 })
  })

  it("lists every school on mount", async () => {
    renderScreen()
    expect(await screen.findByText("Oakfield Primary")).toBeInTheDocument()
    expect(screen.getByText("Riverside")).toBeInTheDocument()
    expect(listMock).toHaveBeenCalledWith("")
  })

  it("shows tier and status as tags (icon + label, never colour alone)", async () => {
    renderScreen()
    await screen.findByText("Oakfield Primary")
    expect(screen.getByText("Premium")).toBeInTheDocument()
    expect(screen.getByText("Free")).toBeInTheDocument()
    expect(screen.getByText("Active")).toBeInTheDocument()
    expect(screen.getByText("Pending")).toBeInTheDocument()
  })

  it("searching re-queries with the typed text", async () => {
    const user = userEvent.setup()
    renderScreen()
    await screen.findByText("Oakfield Primary")

    await user.type(screen.getByLabelText(/search schools/i), "river")
    await user.click(screen.getByRole("button", { name: /^search$/i }))

    await waitFor(() => expect(listMock).toHaveBeenLastCalledWith("river"))
  })

  it("routes to the per-school Trial and Support screens (real navigation, no dead controls)", async () => {
    renderScreen()
    await screen.findByText("Oakfield Primary")

    const trialLinks = screen.getAllByRole("link", { name: /trial/i })
    const supportLinks = screen.getAllByRole("link", { name: /support/i })
    expect(trialLinks[0]).toHaveAttribute("href", "/app/admin/schools/s1/trial")
    expect(supportLinks[0]).toHaveAttribute("href", "/app/admin/schools/s1/support")
  })

  it("surfaces a load failure (never silently dropped)", async () => {
    listMock.mockReset().mockRejectedValue(new Error("request failed: 500"))
    renderScreen()
    expect(await screen.findByText(/schools could not be loaded/i)).toBeInTheDocument()
  })

  it("shows a genuine empty state when a search matches nothing", async () => {
    listMock.mockResolvedValue({ schools: [], count: 0 })
    renderScreen()
    expect(await screen.findByText(/no schools match your search/i)).toBeInTheDocument()
  })
})
