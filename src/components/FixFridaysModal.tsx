import type { FridayFixChange } from '../lib/scheduleDates'
import type { Person } from '../lib/types'
import { ScheduleFixModal } from './ScheduleFixModal'

export type { FridayFixChange }

interface Props {
  open: boolean
  changes: FridayFixChange[]
  personIndex: Map<string, Person>
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function FixFridaysModal(props: Props) {
  return (
    <ScheduleFixModal
      {...props}
      title="Corrigir sextas"
      description="Migração única: sessões agendadas em sexta serão deslocadas em cascata (dias úteis seg–qui). Gravações já concluídas em sexta não serão alteradas."
      emptyMessage="Nenhuma sessão agendada em sexta para corrigir."
      confirmLabel="Confirmar migração"
    />
  )
}
