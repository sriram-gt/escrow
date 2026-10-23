import { AlertTriangle, Check, Circle, Clock3, FileCheck2, ShieldAlert, WalletCards } from 'lucide-react'
import { JobStatus } from '../types/escrow'
import { formatStatus } from '../utils/format'

const iconMap = {
  [JobStatus.OPEN]: Circle,
  [JobStatus.ACCEPTED]: WalletCards,
  [JobStatus.FUNDED]: ShieldAlert,
  [JobStatus.SUBMITTED]: FileCheck2,
  [JobStatus.DISPUTED]: AlertTriangle,
  [JobStatus.RELEASED]: Check,
  [JobStatus.REFUNDED]: Clock3,
}

export function StatusBadge({ status, small = false }: { status: JobStatus; small?: boolean }) {
  const Icon = iconMap[status] ?? Circle
  return <span className={`status-badge status-${status} ${small ? 'status-small' : ''}`}><Icon size={small ? 12 : 14} aria-hidden="true" />{formatStatus(status)}</span>
}
