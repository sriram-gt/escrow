import { JobStatus, type Job } from '../types/escrow'

const STORAGE_PREFIX = 'escrow-marketplace.local-archive.v1'
export const LOCAL_ARCHIVE_CHANGED_EVENT = 'escrow-marketplace:local-archive-changed'

function normalizedWallet(address: string | null | undefined): string | null {
  if (typeof address !== 'string' || address.trim().length === 0) return null
  return address.trim().toLowerCase()
}

function storageKey(address: string): string {
  return `${STORAGE_PREFIX}:${address.toLowerCase()}`
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function parseArchivedIds(raw: string | null): Set<number> {
  if (!raw) return new Set()
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()

    const ids = new Set<number>()
    for (const value of parsed) {
      const id = typeof value === 'number'
        ? value
        : typeof value === 'string' && /^\d+$/.test(value)
          ? Number(value)
          : Number.NaN
      if (Number.isSafeInteger(id) && id >= 0) ids.add(id)
    }
    return ids
  } catch {
    return new Set()
  }
}

function notifyChanged(address: string): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent(LOCAL_ARCHIVE_CHANGED_EVENT, { detail: { address } }))
  } catch {
    // Storage remains authoritative when custom events are unavailable.
  }
}

function isZeroAddress(address: string): boolean {
  return /^0x0{40}$/i.test(address)
}

/**
 * Only an OPEN job created by this wallet, with no assigned freelancer or
 * submitted work, can be hidden locally. OPEN is the pre-acceptance state in
 * the deployed lifecycle, so it has not entered escrow funding yet.
 */
export function canArchiveJob(job: Job | null | undefined, address: string | null | undefined): boolean {
  const wallet = normalizedWallet(address)
  if (!job || !wallet) return false
  return job.status === JobStatus.OPEN
    && job.client.toLowerCase() === wallet
    && isZeroAddress(job.freelancer)
    && job.workCID.trim().length === 0
    && job.disputeRaised !== true
}

export function getArchivedJobIds(address: string | null | undefined): Set<number> {
  const wallet = normalizedWallet(address)
  const storage = getStorage()
  if (!wallet || !storage) return new Set()
  try {
    return parseArchivedIds(storage.getItem(storageKey(wallet)))
  } catch {
    return new Set()
  }
}

export function isJobArchived(jobId: number, address: string | null | undefined): boolean {
  return getArchivedJobIds(address).has(jobId)
}

function writeArchivedIds(address: string, ids: Set<number>): void {
  const storage = getStorage()
  if (!storage) throw new Error('Local archive storage is unavailable in this browser.')
  try {
    storage.setItem(storageKey(address), JSON.stringify([...ids].sort((left, right) => left - right)))
  } catch {
    throw new Error('This browser did not allow the local archive to be saved.')
  }
}

export function archiveJobForWallet(job: Job, address: string): void {
  const wallet = normalizedWallet(address)
  if (!wallet || !canArchiveJob(job, wallet)) {
    throw new Error('Only your own unfunded OPEN job can be archived locally.')
  }
  const ids = getArchivedJobIds(wallet)
  ids.add(job.id)
  writeArchivedIds(wallet, ids)
  notifyChanged(wallet)
}

export function restoreJobForWallet(job: Job, address: string): void {
  const wallet = normalizedWallet(address)
  if (!wallet || job.client.toLowerCase() !== wallet) {
    throw new Error('Only the job owner can restore this local archive.')
  }
  const ids = getArchivedJobIds(wallet)
  ids.delete(job.id)
  writeArchivedIds(wallet, ids)
  notifyChanged(wallet)
}

export function subscribeToLocalArchiveChanges(callback: (address: string | null) => void): () => void {
  if (typeof window === 'undefined') return () => undefined
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<{ address?: unknown }>).detail
    callback(typeof detail?.address === 'string' ? detail.address : null)
  }
  window.addEventListener(LOCAL_ARCHIVE_CHANGED_EVENT, handler)
  return () => window.removeEventListener(LOCAL_ARCHIVE_CHANGED_EVENT, handler)
}
