import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as api from "./api"
import type { NotificationItem } from "./api"
import { Notifications } from "./Notifications"

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>()
  return { ...actual, listNotifications: vi.fn(), markAllRead: vi.fn() }
})

const listMock = vi.mocked(api.listNotifications)
const markAllReadMock = vi.mocked(api.markAllRead)

const READ: NotificationItem = {
  id: "n1", type: "invite_accepted", payload: { reason: "J. Mensah accepted your invite" },
  created_at: "2026-01-01T08:00:00Z", read_at: "2026-01-01T09:00:00Z",
  deliveries: [{ channel: "in_app", status: "delivered" }, { channel: "email", status: "sent" }],
}
const FAILED: NotificationItem = {
  id: "n2", type: "risk_alert", payload: { reason: "concern word: hurt", band: "immediate" },
  created_at: "2026-01-01T08:47:00Z", read_at: null,
  deliveries: [{ channel: "in_app", status: "delivered" }, { channel: "email", status: "failed" }],
}
const RETRYING: NotificationItem = {
  id: "n3", type: "risk_alert", payload: null, created_at: "2026-01-01T08:50:00Z", read_at: null,
  deliveries: [{ channel: "in_app", status: "delivered" }, { channel: "email", status: "retrying" }],
}

describe("Notifications screen (FR-18-01/FR-18-03 · SC-054)", () => {
  beforeEach(() => {
    listMock.mockReset()
    markAllReadMock.mockReset()
  })

  it("renders the feed with delivery-appropriate copy", async () => {
    listMock.mockResolvedValue([READ])
    render(<Notifications />)
    expect(await screen.findByText("invite_accepted")).toBeInTheDocument()
    expect(screen.getByText(/mensah accepted/i)).toBeInTheDocument()
  })

  it("surfaces a FAILED email delivery — never a silent gap (FR-18-03 DoD)", async () => {
    listMock.mockResolvedValue([FAILED])
    render(<Notifications />)
    expect(await screen.findByText(/delivery failed/i)).toBeInTheDocument()
  })

  it("surfaces a RETRYING email delivery", async () => {
    listMock.mockResolvedValue([RETRYING])
    render(<Notifications />)
    expect(await screen.findByText(/retrying delivery/i)).toBeInTheDocument()
  })

  it("a cleanly delivered notification shows no failure/retry badge", async () => {
    listMock.mockResolvedValue([READ])
    render(<Notifications />)
    await screen.findByText("invite_accepted")
    expect(screen.queryByText(/delivery failed/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/retrying delivery/i)).not.toBeInTheDocument()
  })

  it("shows a distinct empty state, never a broken table", async () => {
    listMock.mockResolvedValue([])
    render(<Notifications />)
    expect(await screen.findByText(/nothing here yet/i)).toBeInTheDocument()
  })

  it("surfaces a load failure (never silently dropped)", async () => {
    listMock.mockRejectedValue(new Error("request failed: 500"))
    render(<Notifications />)
    expect(await screen.findByText(/could not be loaded/i)).toBeInTheDocument()
  })

  // --- FR-18-01: unread state, channel tabs, mark-all-read (SC-054's onChannel/onMarkAllRead,
  // deferred by FR-18-03, wired for real here) -----------------------------------------------------

  it("shows the unread count derived from the real read_at, not an invented flag", async () => {
    listMock.mockResolvedValue([READ, FAILED])
    render(<Notifications />)
    await screen.findByText("invite_accepted")
    expect(screen.getByText("1 unread")).toBeInTheDocument()
  })

  it("channel tabs: Alerts shows only alert-type items", async () => {
    listMock.mockResolvedValue([READ, FAILED])
    const user = userEvent.setup()
    render(<Notifications />)
    await screen.findByText("invite_accepted")
    expect(screen.getByText("risk_alert")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /alerts/i }))
    expect(screen.queryByText("invite_accepted")).not.toBeInTheDocument()
    expect(screen.getByText("risk_alert")).toBeInTheDocument()
  })

  it("channel tabs: Email log excludes alert-type items", async () => {
    listMock.mockResolvedValue([READ, FAILED])
    const user = userEvent.setup()
    render(<Notifications />)
    await screen.findByText("invite_accepted")

    await user.click(screen.getByRole("button", { name: /email log/i }))
    expect(screen.getByText("invite_accepted")).toBeInTheDocument()
    expect(screen.queryByText("risk_alert")).not.toBeInTheDocument()
  })

  it("channel tabs: All shows everything again", async () => {
    listMock.mockResolvedValue([READ, FAILED])
    const user = userEvent.setup()
    render(<Notifications />)
    await screen.findByText("invite_accepted")
    await user.click(screen.getByRole("button", { name: /alerts/i }))
    expect(screen.queryByText("invite_accepted")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "All" }))
    expect(screen.getByText("invite_accepted")).toBeInTheDocument()
    expect(screen.getByText("risk_alert")).toBeInTheDocument()
  })

  it("mark all read calls the real endpoint and clears the unread count", async () => {
    listMock.mockResolvedValue([FAILED])
    markAllReadMock.mockResolvedValue({ marked: 1 })
    const user = userEvent.setup()
    render(<Notifications />)
    await screen.findByText("risk_alert")
    expect(screen.getByText("1 unread")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /mark all read/i }))
    await waitFor(() => expect(markAllReadMock).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.getByText("0 unread")).toBeInTheDocument())
  })

  it("mark all read is disabled with nothing unread — a real disabled state, not a dead control", async () => {
    listMock.mockResolvedValue([READ])
    render(<Notifications />)
    await screen.findByText("invite_accepted")
    expect(screen.getByRole("button", { name: /mark all read/i })).toBeDisabled()
  })

  it("a mark-all-read failure is surfaced, never silently dropped", async () => {
    listMock.mockResolvedValue([FAILED])
    markAllReadMock.mockRejectedValue(new Error("request failed: 500"))
    const user = userEvent.setup()
    render(<Notifications />)
    await screen.findByText("risk_alert")
    await user.click(screen.getByRole("button", { name: /mark all read/i }))
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument()
    // the failed call must not have silently marked it read anyway
    expect(screen.getByText("1 unread")).toBeInTheDocument()
  })
})
