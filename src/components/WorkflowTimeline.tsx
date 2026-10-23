import { Check, CircleDollarSign, FileCheck2, Gavel, Link2, Plus, UserRound } from 'lucide-react'
import { formatDate } from '../utils/format'
import { JobStatus } from '../types/escrow'
import { getNextAction, getTimelineModel, type TimelineState } from '../utils/timeline'

const steps = [
  { key: 'created', icon: Plus, label: 'Job Created', copy: 'The client publishes the brief and agreed amount.', owner: 'Client' },
  { key: 'accepted', icon: UserRound, label: 'Job Accepted', copy: 'A freelancer commits to the open job.', owner: 'Freelancer' },
  { key: 'funded', icon: CircleDollarSign, label: 'Escrow Funded', copy: 'The exact ETH budget is locked in escrow.', owner: 'Client' },
  { key: 'submitted', icon: FileCheck2, label: 'Work Submitted', copy: 'A work reference is ready for review.', owner: 'Freelancer' },
  { key: 'released', icon: Check, label: 'Payment Released', copy: 'The confirmed release closes the agreement.', owner: 'Client / contract' },
] as const

function explorerUrl(hash: string) {
  return `https://sepolia.etherscan.io/tx/${hash}`
}

export function WorkflowTimeline({ status, compact = false, transactionHash, refundHash, createdAt }: { status?: JobStatus; compact?: boolean; transactionHash?: string; refundHash?: string; createdAt?: bigint }) {
  const { completedThrough, currentIndex, disputeState, refundState } = getTimelineModel(status)
  const finalLabel = status === JobStatus.REFUNDED ? 'Payment Released' : steps[4].label
  const finalCopy = status === JobStatus.REFUNDED ? 'The release branch was not selected; escrow returned to the client after resolution.' : steps[4].copy
  const finalTransactionHash = status === JobStatus.REFUNDED ? undefined : transactionHash
  const createdTimestamp = createdAt !== undefined ? formatDate(createdAt) : undefined

  const getStepState = (index: number): TimelineState => currentIndex === index ? 'current' : index <= completedThrough ? 'complete' : 'upcoming'

  return <div className={`workflow-timeline ${compact ? 'workflow-compact' : ''}`} aria-label="Escrow workflow">
    <div className="workflow-steps" role="list">
      {steps.map((step, index) => {
        const Icon = step.icon
        const state = getStepState(index)
        const isFinal = index === steps.length - 1
        const href = isFinal ? finalTransactionHash : undefined
        const label = isFinal ? finalLabel : step.label
        return <div className={`workflow-step is-${state}`} key={step.key} role="listitem" aria-current={state === 'current' ? 'step' : undefined}>
          <div className="workflow-marker" aria-hidden="true">
            <div className="workflow-icon">{state === 'complete' ? <Check size={16} /> : <Icon size={16} />}</div>
            {!isFinal && <div className="workflow-line" />}
          </div>
          <div className="workflow-step-copy">
            <div className="workflow-step-heading"><strong>{label}</strong><span className="workflow-step-state">{state}</span></div>
            {!compact && <><p>{isFinal ? finalCopy : step.copy}</p><span className="workflow-owner">{step.owner}</span>{index === 0 && createdTimestamp && <time className="workflow-time">{createdTimestamp}</time>}{href && <a className="workflow-tx" href={explorerUrl(href)} target="_blank" rel="noreferrer"><Link2 size={12} /> View payment transaction</a>}</>}
          </div>
        </div>
      })}
    </div>
    {!compact && <>
      <section className={`workflow-outcomes ${disputeState === 'current' || refundState === 'current' ? 'workflow-outcomes-active' : ''}`} aria-label="Alternative outcomes">
        <div className="workflow-outcomes-heading"><Gavel size={15} /><div><strong>Alternative outcomes</strong><span>Available after work is submitted.</span></div></div>
        <div className="workflow-outcome-list" role="list">
          <div className={`workflow-outcome is-${disputeState}`} role="listitem" aria-current={disputeState === 'current' ? 'step' : undefined}><span className="workflow-outcome-icon"><Gavel size={14} /></span><div><strong>Disputed</strong><p>{status === JobStatus.DISPUTED ? 'Waiting for an authorized arbitrator to resolve the review.' : 'Either party can request authorized resolution.'}</p></div><span className="workflow-step-state">{disputeState}</span></div>
          <div className={`workflow-outcome is-${refundState}`} role="listitem" aria-current={refundState === 'current' ? 'step' : undefined}><span className="workflow-outcome-icon"><CircleDollarSign size={14} /></span><div><strong>Refunded</strong><p>The client receives escrow after a resolution in their favor.</p>{refundHash && <a className="workflow-tx" href={explorerUrl(refundHash)} target="_blank" rel="noreferrer"><Link2 size={12} /> View refund transaction</a>}</div><span className="workflow-step-state">{refundState}</span></div>
        </div>
      </section>
      <div className="workflow-next-action"><span>Next action</span><strong>{getNextAction(status)}</strong></div>
    </>}
  </div>
}
