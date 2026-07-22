import { describe, expect, it } from "vitest"

import { resolveSchoolCode } from "./session"

describe("resolveSchoolCode", () => {
  it("prefers an explicit ?school= on the sign-in URL", () => {
    expect(resolveSchoolCode("r.okafor@maple-primary.sch.uk", "?school=MAPLE01")).toBe("MAPLE01")
  })

  it("falls back to the school email domain", () => {
    expect(resolveSchoolCode("r.okafor@maple-primary.sch.uk", "")).toBe("maple-primary.sch.uk")
  })

  it("is empty when there is neither a param nor an @", () => {
    expect(resolveSchoolCode("", "")).toBe("")
  })
})
