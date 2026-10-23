import type { TransactionReceipt } from 'ethers'

export type EthereumAddress = string
export type JobId = bigint
export type Wei = bigint

/** Exact numeric values of the deployed contract's JobStatus enum. */
export enum EscrowJobStatus {
  Open = 0,
  Accepted = 1,
  Funded = 2,
  Submitted = 3,
  Disputed = 4,
  Released = 5,
  Refunded = 6,
}

/** Compatibility name used by the existing UI. */
export enum JobStatus {
  OPEN = EscrowJobStatus.Open,
  ACCEPTED = EscrowJobStatus.Accepted,
  FUNDED = EscrowJobStatus.Funded,
  SUBMITTED = EscrowJobStatus.Submitted,
  DISPUTED = EscrowJobStatus.Disputed,
  RELEASED = EscrowJobStatus.Released,
  REFUNDED = EscrowJobStatus.Refunded,
}

export const EscrowJobStatusLabel: Record<EscrowJobStatus, string> = {
  [EscrowJobStatus.Open]: 'Open',
  [EscrowJobStatus.Accepted]: 'Accepted',
  [EscrowJobStatus.Funded]: 'Funded',
  [EscrowJobStatus.Submitted]: 'Work submitted',
  [EscrowJobStatus.Disputed]: 'Disputed',
  [EscrowJobStatus.Released]: 'Released',
  [EscrowJobStatus.Refunded]: 'Refunded',
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  [JobStatus.OPEN]: 'Open',
  [JobStatus.ACCEPTED]: 'Accepted',
  [JobStatus.FUNDED]: 'Funded',
  [JobStatus.SUBMITTED]: 'Submitted',
  [JobStatus.DISPUTED]: 'Disputed',
  [JobStatus.RELEASED]: 'Released',
  [JobStatus.REFUNDED]: 'Refunded',
}

export const CONTRACT_ADDRESS = '0xe9E9C73036Dc81710c270B4A6a303622a87f8d06' as const
export const NETWORK = {
  chainId: 11_155_111,
  chainIdHex: '0xaa36a7',
  name: 'Sepolia',
  explorer: 'https://sepolia.etherscan.io',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
} as const
export const CONTRACT_EXPLORER_URL = `${NETWORK.explorer}/address/${CONTRACT_ADDRESS}`

export interface WalletState {
  address: string | null
  chainId: number | null
  isConnecting: boolean
  error: string | null
  sessionId: number
}

export type TransactionPhase = 'ready' | 'wallet' | 'submitted' | 'confirming' | 'confirmed' | 'failed'

export interface TransactionState {
  phase: TransactionPhase
  hash?: string
  error?: string
}

export interface EscrowJob {
  id: JobId
  client: EthereumAddress
  freelancer: EthereumAddress
  budgetWei: Wei
  description: string
  workSubmission: string
  status: EscrowJobStatus
  disputeRaised: boolean
}

/** Shape consumed by the existing React pages. */
export interface Job {
  id: number
  client: EthereumAddress
  freelancer: EthereumAddress
  description: string
  amountWei: Wei
  status: JobStatus
  workCID: string
  createdAt?: bigint
  disputeRaised?: boolean
  lastActionTxHash?: string
  releaseTxHash?: string
  refundTxHash?: string
}

export interface ReleaseBalanceSnapshot {
  beforeWei: bigint
  afterWei: bigint
  deltaWei: bigint
  blockNumber: number
}

export interface EscrowJobInput {
  description: string
  /** Human-entered ETH amount. It is converted with ethers.parseEther. */
  budgetEth: string
}

export interface EscrowEventBase {
  name: string
  transactionHash: string
  blockNumber: number
  logIndex: number
}

export interface JobCreatedEvent extends EscrowEventBase {
  name: 'JobCreated'
  jobId: JobId
  client: EthereumAddress
  amountWei: Wei
  description: string
}

export interface JobAcceptedEvent extends EscrowEventBase {
  name: 'JobAccepted'
  jobId: JobId
  freelancer: EthereumAddress
}

export interface JobFundedEvent extends EscrowEventBase {
  name: 'JobFunded'
  jobId: JobId
  funder: EthereumAddress
  amountWei: Wei
}

export interface WorkSubmittedEvent extends EscrowEventBase {
  name: 'WorkSubmitted'
  jobId: JobId
  freelancer: EthereumAddress
  work: string
}

export interface DisputeRaisedEvent extends EscrowEventBase {
  name: 'DisputeRaised'
  jobId: JobId
  raisedBy: EthereumAddress
}

export interface PaymentReleasedEvent extends EscrowEventBase {
  name: 'PaymentReleased'
  jobId: JobId
  freelancer: EthereumAddress
  amountWei: Wei
}

export interface JobRefundedEvent extends EscrowEventBase {
  name: 'JobRefunded'
  jobId: JobId
  client: EthereumAddress
  amountWei: Wei
}

export interface RoleEvent extends EscrowEventBase {
  name: 'RoleGranted' | 'RoleRevoked'
  role: string
  account: EthereumAddress
  sender: EthereumAddress
}

export interface PauseEvent extends EscrowEventBase {
  name: 'Paused' | 'Unpaused'
  account: EthereumAddress
}

export type EscrowEvent =
  | JobCreatedEvent
  | JobAcceptedEvent
  | JobFundedEvent
  | WorkSubmittedEvent
  | DisputeRaisedEvent
  | PaymentReleasedEvent
  | JobRefundedEvent
  | RoleEvent
  | PauseEvent

export interface EscrowTransactionResult {
  hash: string
  receipt: TransactionReceipt
  events: EscrowEvent[]
}

export function toEscrowJobStatus(value: bigint | number): EscrowJobStatus {
  const numericValue = typeof value === 'bigint' ? Number(value) : value

  if (
    !Number.isSafeInteger(numericValue) ||
    !Object.prototype.hasOwnProperty.call(EscrowJobStatusLabel, numericValue)
  ) {
    throw new Error(`Unknown escrow job status: ${value.toString()}`)
  }

  return numericValue as EscrowJobStatus
}
