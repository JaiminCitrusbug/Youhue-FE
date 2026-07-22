import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import App from "./App"

describe("App", () => {
  it("mounts the router (unknown root path -> 404) without crashing", async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText(/page not found/i)).toBeInTheDocument())
  })
})
