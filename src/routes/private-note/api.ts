import { api } from "../../api/client"

// FR-13-05 · SC-041 — a teacher's quiet, private, supportive note to a student, reached from the
// guided-response screen's "Use & send a private note" action.
//
// GET /api/v1/flags/{id}/student — resolves the flag this action is responding to into the real
// student it belongs to (id + display name); guided-response itself only carries `flagId`.
// POST /api/v1/students/{id}/notes — sends the note. 201 `{ note_id }`; private to the intended
// student and the sender only (NEG gate — never public, never visible to peers or other staff).

export interface FlagStudent {
  student_id: string
  student_name: string
}

export async function getFlagStudent(flagId: string): Promise<FlagStudent> {
  return api<FlagStudent>(`/flags/${flagId}/student`)
}

export interface NoteResult {
  note_id: string
}

export async function sendNote(studentId: string, body: string): Promise<NoteResult> {
  return api<NoteResult>(`/students/${studentId}/notes`, {
    method: "POST",
    body: JSON.stringify({ body }),
  })
}
