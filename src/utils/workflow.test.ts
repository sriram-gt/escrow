import { describe, expect, it } from 'vitest'
import { JobStatus, type Job } from '../types/escrow'
import { getWorkflowActions } from './workflow'

const client = '0x1111111111111111111111111111111111111111'
const freelancer = '0x2222222222222222222222222222222222222222'
const base: Job = { id: 7, client, freelancer, description: 'Brief', amountWei: 1n, status: JobStatus.OPEN, workCID: '' }

describe('workflow action permissions', () => {
  it('lets a separate connected wallet accept an open client job', () => {
    expect(getWorkflowActions(base, freelancer).canAccept).toBe(true)
    expect(getWorkflowActions(base, client).canAccept).toBe(false)
  })

  it('separates client funding from freelancer submission and client approval', () => {
    expect(getWorkflowActions({ ...base, status: JobStatus.ACCEPTED }, client).canFund).toBe(true)
    expect(getWorkflowActions({ ...base, status: JobStatus.FUNDED }, freelancer).canSubmit).toBe(true)
    expect(getWorkflowActions({ ...base, status: JobStatus.SUBMITTED }, client).canApprove).toBe(true)
  })

  it('requires the arbitrator role for disputed jobs', () => {
    const disputed = { ...base, status: JobStatus.DISPUTED }
    expect(getWorkflowActions(disputed, freelancer, false).canResolve).toBe(false)
    expect(getWorkflowActions(disputed, client, true).canResolve).toBe(true)
  })
})
