import { formatEther } from 'ethers'
import type { JobStatus } from '../types/escrow'
import { JOB_STATUS_LABELS } from '../types/escrow'

export function shortenAddress(address?: string | null, start = 6, end = 4) {
  if (!address) return 'Not assigned'
  return `${address.slice(0, start)}…${address.slice(-end)}`
}

export function formatEth(amountWei: bigint, maximumFractionDigits = 4) {
  const value = Number(formatEther(amountWei))
  return `${value.toLocaleString('en-US', { maximumFractionDigits })} ETH`
}

export function formatEthNumber(amountWei: bigint, maximumFractionDigits = 4) {
  return Number(formatEther(amountWei)).toLocaleString('en-US', { maximumFractionDigits })
}

export function formatStatus(status: JobStatus) {
  return JOB_STATUS_LABELS[status] ?? 'Unknown'
}

export function formatDate(timestamp?: bigint) {
  if (!timestamp) return 'Timestamp not exposed'
  return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function isValidCid(value: string) {
  return /^(ipfs:\/\/)?[a-zA-Z0-9][a-zA-Z0-9._-]{10,}$/.test(value.trim())
}

export function ipfsGatewayUrl(value: string) {
  const trimmed = value.trim()
  if (!isValidCid(trimmed)) return null
  const cid = trimmed.replace(/^ipfs:\/\//, '')
  const runtimeMeta = import.meta as unknown as { env?: { VITE_IPFS_GATEWAY_URL?: string } }
  const gateway = runtimeMeta.env?.VITE_IPFS_GATEWAY_URL?.trim() || 'https://ipfs.io/ipfs'
  if (!/^https:\/\/[a-zA-Z0-9.-]+(?:\/.*)?$/.test(gateway)) return null
  return `${gateway.replace(/\/$/, '')}/${encodeURIComponent(cid)}`
}
