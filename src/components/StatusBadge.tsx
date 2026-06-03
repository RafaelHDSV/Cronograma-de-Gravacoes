import type { SessionStatus } from '../lib/types'
import { STATUS_LABEL } from '../lib/schedule'

export function StatusBadge({ status }: { status: SessionStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>
}
