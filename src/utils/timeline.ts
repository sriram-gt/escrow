import { JobStatus } from '../types/escrow'

export type TimelineState = 'complete' | 'current' | 'upcoming'

function getCompletedThrough(status?: JobStatus) {
  if (status === undefined || status === JobStatus.RELEASED) return 4
  if (status === JobStatus.REFUNDED || status === JobStatus.DISPUTED) return 3
  return status === JobStatus.OPEN ? 0 : status === JobStatus.ACCEPTED ? 1 : status === JobStatus.FUNDED ? 2 : 3
}

function getCurrentIndex(status?: JobStatus) {
  if (status === undefined || status === JobStatus.RELEASED) return 4
  if (status === JobStatus.DISPUTED || status === JobStatus.REFUNDED) return null
  return status === JobStatus.OPEN ? 0 : status === JobStatus.ACCEPTED ? 1 : status === JobStatus.FUNDED ? 2 : 3
}

export function getNextAction(status?: JobStatus) {
  if (status === undefined) return 'Follow each milestone from creation through release.'
  if (status === JobStatus.OPEN) return 'Freelancer next: accept the open brief.'
  if (status === JobStatus.ACCEPTED) return 'Client next: fund the exact agreed amount.'
  if (status === JobStatus.FUNDED) return 'Freelancer next: submit completed work.'
  if (status === JobStatus.SUBMITTED) return 'Client next: review the submission and release payment, or raise a dispute.'
  if (status === JobStatus.DISPUTED) return 'Arbitrator next: resolve the dispute.'
  if (status === JobStatus.REFUNDED) return 'Agreement complete: the client has been refunded.'
  return 'Agreement complete: payment has been released.'
}

export function getTimelineModel(status?: JobStatus) {
  return {
    completedThrough: getCompletedThrough(status),
    currentIndex: getCurrentIndex(status),
    disputeState: status === JobStatus.DISPUTED ? 'current' as TimelineState : status === JobStatus.REFUNDED ? 'complete' as TimelineState : 'upcoming' as TimelineState,
    refundState: status === JobStatus.REFUNDED ? 'current' as TimelineState : 'upcoming' as TimelineState,
    nextAction: getNextAction(status),
  }
}
