import { hasSessionNotes, sessionNotesText } from '../lib/sessionNotes'
import { IconNote } from './SessionIcons'
import { Tooltip } from './Tooltip'

interface Props {
  notes?: string
}

export function SessionNoteIndicator({ notes }: Props) {
  if (!hasSessionNotes(notes)) return null
  const text = sessionNotesText(notes)
  return (
    <Tooltip label={text} multiline>
      <span className="session-note-indicator" tabIndex={0} aria-label={`Observação: ${text}`}>
        <IconNote />
      </span>
    </Tooltip>
  )
}
