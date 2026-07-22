import { describe, expect, it } from "vitest"

import { effectiveRole } from "./roles"

describe("effectiveRole", () => {
  it("maps an admin-kind session to the admin role (it carries no StaffRole)", () => {
    expect(
      effectiveRole({ subject_id: "1", kind: "admin", role: null, school_id: null }),
    ).toBe("admin")
  })

  it("uses the backend StaffRole for a staff session", () => {
    expect(
      effectiveRole({ subject_id: "1", kind: "staff", role: "leadership", school_id: "s" }),
    ).toBe("leadership")
  })

  it("returns null when there is no user", () => {
    expect(effectiveRole(null)).toBeNull()
  })
})
