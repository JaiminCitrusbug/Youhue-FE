import { describe, expect, it } from "vitest"

import { indexedDbStore } from "./offlineStore"

// jsdom (this project's test environment) does not implement IndexedDB, so these tests exercise
// the real `indexedDbStore` adapter's "unavailable" path — the same path a very old browser or a
// privacy mode with IndexedDB disabled would hit in production. `index.tsx`'s orchestration logic
// (the part with actual business behavior) is tested against an in-memory fake in
// `checkin.test.tsx`, not this thin adapter.

describe("indexedDbStore (FR-04-06)", () => {
  it("save() rejects clearly when IndexedDB is unavailable, rather than an unhandled ReferenceError", async () => {
    await expect(
      indexedDbStore.save({ clientEntryId: "x", moodValue: 3, reflectionText: "" }),
    ).rejects.toThrow(/IndexedDB is not available/)
  })

  it("get() rejects clearly when IndexedDB is unavailable", async () => {
    await expect(indexedDbStore.get()).rejects.toThrow(/IndexedDB is not available/)
  })

  it("clear() rejects clearly when IndexedDB is unavailable", async () => {
    await expect(indexedDbStore.clear()).rejects.toThrow(/IndexedDB is not available/)
  })
})
