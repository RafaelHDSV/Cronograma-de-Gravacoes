export function sessionNotesText(notes?: string): string {
  return notes?.trim() ?? ''
}

export function hasSessionNotes(notes?: string): boolean {
  return sessionNotesText(notes).length > 0
}
