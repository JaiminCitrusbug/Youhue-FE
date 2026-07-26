import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as api from "./api"
import type { NotificationItem } from "./api"
import { Notifications } from "./Notifications"

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>()
  return { ...actual, listNotifications: vi.fn() }
})

const listMock = vi.mocked(api.listNotifications)

const DELIVERED: NotificationItem = {
  id: "n1", type: "invite_accepted", payload: { reason: "J. Mensah accepted your invite" },
  created_at: "2026-01-01T08:00:00Z",
  deliveries: [{ channel: "in_app", status: "delivered" }, { channel: "email", status: "sent" }],
}
const FAILED: NotificationItem = {
  id: "n2", type: "risk_alert", payload: { reason: "concern word: hurt", band: "immediate" },
  created_at: "2026-01-01T08:47:00Z",
  deliveries: [{ channel: "in_app", status: "delivered" }, { channel: "email", status: "failed" }],
}
const RETRYING: NotificationItem = {
  id: "n3", type: "risk_alert", payload: null, created_at: "2026-01-01T08:50:00Z",
  deliveries: [{ channel: "in_app", status: "delivered" }, { channel: "email", status: "retrying" }],
}

describe("Notifications screen (FR-18-03 · SC-054)", () => {
  beforeEach(() => {
    listMock.mockReset()
  })

  it("renders the feed with delivery-appropriate copy", async () => {
    listMock.mockResolvedValue([DELIVERED])
    render(<Notifications />)
    expect(await screen.findByText("invite_accepted")).toBeInTheDocument()
    expect(screen.getByText(/mensah accepted/i)).toBeInTheDocument()
  })

  it("surfaces a FAILED email delivery — never a silent gap (ticket DoD)", async () => {
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
    listMock.mockResolvedValue([DELIVERED])
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
})
