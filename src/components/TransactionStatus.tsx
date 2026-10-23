import { CheckCircle2, ExternalLink, LoaderCircle, XCircle } from 'lucide-react'
import type { TransactionState } from '../types/escrow'

export function TransactionStatus({ state, explorerUrl }: { state: TransactionState; explorerUrl?: string }) {
  if (state.phase === 'ready') return null
  const pending = ['wallet', 'submitted', 'confirming'].includes(state.phase)
  return <div className={`transaction-status ${state.phase}`} role="status" aria-busy={pending}>
    {pending && <LoaderCircle className="spin" size={18} />}{state.phase === 'confirmed' && <CheckCircle2 size={18} />}{state.phase === 'failed' && <XCircle size={18} />}
    <div><strong>{state.phase === 'wallet' ? 'Approve in your wallet' : state.phase === 'submitted' ? 'Transaction submitted' : state.phase === 'confirming' ? 'Waiting for confirmation' : state.phase === 'confirmed' ? 'Transaction confirmed' : 'Transaction failed'}</strong>{state.error && <span>{state.error}</span>}{state.hash && explorerUrl && <a href={explorerUrl} target="_blank" rel="noreferrer">View transaction <ExternalLink size={13} /></a>}</div>
  </div>
}
