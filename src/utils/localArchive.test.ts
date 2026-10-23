import { beforeEach, describe, expect, it } from 'vitest'
import { JobStatus, type Job } from '../types/escrow'
import { archiveJobForWallet, canArchiveJob, getArchivedJobIds, restoreJobForWallet } from './localArchive'

const client = '0x1111111111111111111111111111111111111111'
const otherWallet = '0x2222222222222222222222222222222222222222'
const zeroAddress = '0x0000000000000000000000000000000000000000'
const openJob: Job = { id: 19, client, freelancer: zeroAddress, description: 'Brief', amountWei: 1n, status: JobStatus.OPEN, workCID: '' }

beforeEach(() => localStorage.clear())

describe('wallet-scoped local job archives', () => {
  it('only permits the owner to archive an unfunded OPEN lifecycle record', () => {
    expect(canArchiveJob(openJob, client)).toBe(true)
    expect(canArchiveJob(openJob, otherWallet)).toBe(false)
    for (const status of [JobStatus.ACCEPTED, JobStatus.FUNDED, JobStatus.SUBMITTED, JobStatus.DISPUTED, JobStatus.RELEASED, JobStatus.REFUNDED]) {
      expect(canArchiveJob({ ...openJob, status }, client)).toBe(false)
    }
  })

  it('keeps archives separate per wallet and tolerates malformed storage', () => {
    localStorage.setItem('escrow-marketplace.local-archive.v1:0x1111111111111111111111111111111111111111', '{bad json')
    expect(() => getArchivedJobIds(client)).not.toThrow()
    expect(getArchivedJobIds(client).size).toBe(0)

    archiveJobForWallet(openJob, client)
    expect(getArchivedJobIds(client)).toEqual(new Set([19]))
    expect(getArchivedJobIds(otherWallet)).toEqual(new Set())
    restoreJobForWallet(openJob, client)
    expect(getArchivedJobIds(client)).toEqual(new Set())
  })
})
