import { JobStatus, type Job } from '../types/escrow'

export interface WorkflowActions {
  canAccept: boolean
  canFund: boolean
  canSubmit: boolean
  canApprove: boolean
  canDispute: boolean
  canResolve: boolean
}

export function getWorkflowActions(job: Job, account: string | null, isArbitrator = false): WorkflowActions {
  const normalized = account?.toLowerCase() ?? null
  const isClient = Boolean(normalized && job.client.toLowerCase() === normalized)
  const isFreelancer = Boolean(normalized && job.freelancer.toLowerCase() === normalized)
  return {
    canAccept: job.status === JobStatus.OPEN && Boolean(normalized) && !isClient,
    canFund: job.status === JobStatus.ACCEPTED && isClient,
    canSubmit: job.status === JobStatus.FUNDED && isFreelancer,
    canApprove: job.status === JobStatus.SUBMITTED && isClient,
    canDispute: job.status === JobStatus.SUBMITTED && (isClient || isFreelancer),
    canResolve: job.status === JobStatus.DISPUTED && isArbitrator,
  }
}
