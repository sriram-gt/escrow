import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  ZeroAddress,
  getAddress,
  isAddress,
  type ContractRunner,
  type EventLog,
  type Log,
  type Provider,
  type Signer,
  type ContractTransactionResponse,
  type TransactionDescription,
} from 'ethers'
import {
  ARBITRATOR_ROLE,
  DEFAULT_ADMIN_ROLE,
  ESCROW_MARKETPLACE_ABI,
  ESCROW_MARKETPLACE_ADDRESS,
  ESCROW_MARKETPLACE_DEPLOYMENT_BLOCK,
  ESCROW_MARKETPLACE_INTERFACE,
  MAX_LOG_RANGE,
  SEPOLIA_CHAIN_ID,
  getEscrowMarketplaceContract,
} from '../contracts/escrowMarketplace'
import {
  EscrowJobStatus,
  EscrowJobStatusLabel,
  JobStatus,
  type EscrowEvent,
  type EscrowJob,
  type EscrowTransactionResult,
  type EthereumAddress,
  type Job,
  type ReleaseBalanceSnapshot,
  toEscrowJobStatus,
} from '../types/escrow'
import { assertPositiveWei, ethToWei } from '../utils/eth'
import { toEscrowUserFacingError, userFacingErrorMessage } from '../utils/contractErrors'

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on?: (event: string, handler: (...args: unknown[]) => void) => void
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
    }
  }
}

export type ReadProvider = Provider
export type EscrowTransactionResponse = ContractTransactionResponse

export interface ScanJobsOptions {
  startId?: bigint
  endIdExclusive?: bigint
  maxJobs?: bigint
}

export interface ReadJobsResult {
  jobs: EscrowJob[]
  nextJobId: bigint
}

export interface RoleChecks {
  isAdmin: boolean
  isArbitrator: boolean
}

export interface CreateJobRequest {
  description: string
  budgetEth: string
}

export function getContract(runner: ContractRunner | null): Contract {
  return getEscrowMarketplaceContract(runner)
}

export function assertValidJobId(jobId: bigint): void {
  if (jobId < 0n) throw new Error('Job ID cannot be negative.')
}

export function assertValidAddress(address: string, fieldName = 'Address'): string {
  if (!isAddress(address)) throw new Error(`${fieldName} is not a valid Ethereum address.`)
  return getAddress(address)
}

export async function assertSepoliaNetwork(provider: Provider): Promise<void> {
  const network = await provider.getNetwork()
  if (network.chainId !== SEPOLIA_CHAIN_ID) {
    throw new Error('Wrong network. Switch your wallet to Ethereum Sepolia before continuing.')
  }
}

export async function readNextJobId(provider: Provider): Promise<bigint> {
  await assertSepoliaNetwork(provider)
  const contract = getContract(provider)
  return BigInt(String(await contract.getFunction('nextJobId')()))
}

export async function readPaused(provider: Provider): Promise<boolean> {
  await assertSepoliaNetwork(provider)
  const contract = getContract(provider)
  return Boolean(await contract.getFunction('paused')())
}

export async function readContractBalance(provider: Provider): Promise<bigint> {
  await assertSepoliaNetwork(provider)
  return provider.getBalance(ESCROW_MARKETPLACE_ADDRESS)
}

export async function readRoleAdmin(provider: Provider, role: string): Promise<string> {
  await assertSepoliaNetwork(provider)
  const contract = getContract(provider)
  return String(await contract.getFunction('getRoleAdmin')(role))
}

export async function supportsInterface(provider: Provider, interfaceId: string): Promise<boolean> {
  await assertSepoliaNetwork(provider)
  const contract = getContract(provider)
  return Boolean(await contract.getFunction('supportsInterface')(interfaceId))
}

function resultValue(raw: unknown, name: string, index: number): unknown {
  if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>
    if (name in record) return record[name]
  }
  if (Array.isArray(raw)) return raw[index]
  return undefined
}

function asBigInt(value: unknown, fieldName: string): bigint {
  if (value === undefined || value === null) throw new Error(`Contract response did not include ${fieldName}.`)
  try {
    return BigInt(String(value))
  } catch {
    throw new Error(`Contract response included an invalid ${fieldName}.`)
  }
}

function asString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') throw new Error(`Contract response did not include a valid ${fieldName}.`)
  return value
}

function asAddress(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !isAddress(value)) {
    throw new Error(`Contract response did not include a valid ${fieldName}.`)
  }
  return getAddress(value)
}

function asBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`Contract response did not include a valid ${fieldName}.`)
  return value
}

export function parseJob(jobId: bigint, raw: unknown): EscrowJob {
  assertValidJobId(jobId)
  const status = toEscrowJobStatus(asBigInt(resultValue(raw, 'status', 6), 'status'))
  return {
    id: asBigInt(resultValue(raw, 'id', 0), 'job id'),
    client: asAddress(resultValue(raw, 'client', 1), 'client'),
    freelancer: asAddress(resultValue(raw, 'freelancer', 2), 'freelancer'),
    budgetWei: asBigInt(resultValue(raw, 'budget', 3), 'budget'),
    description: asString(resultValue(raw, 'description', 4), 'description'),
    workSubmission: asString(resultValue(raw, 'workSubmission', 5), 'work submission'),
    status,
    disputeRaised: asBoolean(resultValue(raw, 'disputeRaised', 7), 'dispute flag'),
  }
}

export async function readJob(provider: Provider, jobId: bigint): Promise<EscrowJob> {
  assertValidJobId(jobId)
  await assertSepoliaNetwork(provider)
  const contract = getContract(provider)
  const raw = await contract.getFunction('jobs')(jobId)
  return parseJob(jobId, raw)
}

export interface JobHistorySummary {
  lastActionTxHash?: string
  releaseTxHash?: string
  refundTxHash?: string
}

export function getLogRanges(latestBlock: bigint): Array<{ fromBlock: bigint; toBlock: bigint }> {
  if (latestBlock < ESCROW_MARKETPLACE_DEPLOYMENT_BLOCK) return []
  const ranges: Array<{ fromBlock: bigint; toBlock: bigint }> = []
  for (let fromBlock = ESCROW_MARKETPLACE_DEPLOYMENT_BLOCK; fromBlock <= latestBlock; fromBlock += MAX_LOG_RANGE) {
    ranges.push({
      fromBlock,
      toBlock: fromBlock + MAX_LOG_RANGE - 1n < latestBlock ? fromBlock + MAX_LOG_RANGE - 1n : latestBlock,
    })
  }
  return ranges
}

async function queryEventInChunks(contract: Contract, filter: unknown, provider: Provider): Promise<(Log | EventLog)[]> {
  const latestBlock = BigInt(await provider.getBlockNumber())
  const logs: (Log | EventLog)[] = []
  for (const range of getLogRanges(latestBlock)) {
    const chunk = await contract.queryFilter(filter as never, Number(range.fromBlock), Number(range.toBlock))
    logs.push(...chunk)
  }
  return logs
}

export async function readJobHistory(provider: Provider, jobId: bigint, status?: EscrowJobStatus): Promise<JobHistorySummary> {
  assertValidJobId(jobId)
  await assertSepoliaNetwork(provider)
  const contract = getContract(provider)
  // Normal job reads use the mapping getter only. History is needed for the
  // final transaction link, so only query the terminal event and only across
  // bounded ranges anchored at the verified deployment block.
  const filters = status === EscrowJobStatus.Released
    ? [contract.filters.PaymentReleased(jobId)]
    : status === EscrowJobStatus.Refunded
      ? [contract.filters.JobRefunded(jobId)]
      : []
  if (filters.length === 0) return {}
  const logs = (await Promise.all(filters.map((filter) => queryEventInChunks(contract, filter, provider)))).flat()
    .sort((left, right) => (left.blockNumber - right.blockNumber) || (left.index - right.index))
  const events = parseEscrowLogs(logs)
  const release = [...events].reverse().find((event) => event.name === 'PaymentReleased')
  const refund = [...events].reverse().find((event) => event.name === 'JobRefunded')
  return {
    lastActionTxHash: logs.at(-1)?.transactionHash,
    releaseTxHash: release?.transactionHash,
    refundTxHash: refund?.transactionHash,
  }
}

export async function readReleaseBalanceSnapshot(provider: Provider, transactionHash: string, account: string): Promise<ReleaseBalanceSnapshot | null> {
  await assertSepoliaNetwork(provider)
  const receipt = await provider.getTransactionReceipt(transactionHash)
  if (!receipt) return null
  const beforeBlock = receipt.blockNumber > 0 ? receipt.blockNumber - 1 : 0
  const [beforeWei, afterWei] = await Promise.all([
    provider.getBalance(account, beforeBlock),
    provider.getBalance(account, receipt.blockNumber),
  ])
  return { beforeWei, afterWei, deltaWei: afterWei - beforeWei, blockNumber: receipt.blockNumber }
}

export function isEmptyJob(job: EscrowJob): boolean {
  return (
    job.client === ZeroAddress &&
    job.freelancer === ZeroAddress &&
    job.budgetWei === 0n &&
    job.description.length === 0 &&
    job.workSubmission.length === 0 &&
    job.status === EscrowJobStatus.Open &&
    !job.disputeRaised
  )
}

/**
 * Scans the mapping from zero through nextJobId without converting the counter
 * to a JS number. The bounded default prevents an accidental unbounded RPC loop.
 */
export async function readJobs(
  provider: Provider,
  options: ScanJobsOptions = {},
): Promise<ReadJobsResult> {
  const nextJobId = await readNextJobId(provider)
  const startId = options.startId ?? 0n
  if (startId < 0n || startId > nextJobId) throw new Error('Invalid job scan start.')

  const endIdExclusive = options.endIdExclusive ?? nextJobId
  if (endIdExclusive < startId || endIdExclusive > nextJobId) {
    throw new Error('Invalid job scan range.')
  }

  const maxJobs = options.maxJobs ?? 1_000n
  if (maxJobs <= 0n) throw new Error('maxJobs must be greater than zero.')
  if (endIdExclusive - startId > maxJobs) {
    throw new Error(`Refusing to scan more than ${maxJobs.toString()} jobs in one request.`)
  }

  const contract = getContract(provider)
  const jobs: EscrowJob[] = []
  for (let jobId = startId; jobId < endIdExclusive; jobId += 1n) {
    const raw = await contract.getFunction('jobs')(jobId)
    const job = parseJob(jobId, raw)
    if (!isEmptyJob(job)) jobs.push(job)
  }

  return { jobs, nextJobId }
}

export async function hasRole(provider: Provider, role: string, account: string): Promise<boolean> {
  await assertSepoliaNetwork(provider)
  const normalizedAccount = assertValidAddress(account, 'Account')
  const contract = getContract(provider)
  return Boolean(await contract.getFunction('hasRole')(role, normalizedAccount))
}

export async function getRoleChecks(provider: Provider, account: string): Promise<RoleChecks> {
  const normalizedAccount = assertValidAddress(account, 'Account')
  const [isAdmin, isArbitrator] = await Promise.all([
    hasRole(provider, DEFAULT_ADMIN_ROLE, normalizedAccount),
    hasRole(provider, ARBITRATOR_ROLE, normalizedAccount),
  ])
  return { isAdmin, isArbitrator }
}

export async function requireRole(
  provider: Provider,
  account: string,
  role: string,
  message = 'Your wallet is not authorized to perform this action.',
): Promise<void> {
  if (!(await hasRole(provider, role, account))) throw new Error(message)
}

async function ensureWriteNetwork(signer: Signer): Promise<void> {
  if (!signer.provider) throw new Error('The wallet provider is not available.')
  await assertSepoliaNetwork(signer.provider)
}

async function send(
  signer: Signer,
  functionName: string,
  args: readonly unknown[] = [],
  overrides?: Record<string, unknown>,
): Promise<EscrowTransactionResponse> {
  await ensureWriteNetwork(signer)
  const contract = getContract(signer)
  const method = contract.getFunction(functionName)
  return overrides === undefined
    ? (await method(...args)) as EscrowTransactionResponse
    : (await method(...args, overrides)) as EscrowTransactionResponse
}

export async function createJob(
  signer: Signer,
  request: CreateJobRequest,
): Promise<EscrowTransactionResponse> {
  const description = request.description.trim()
  if (description.length === 0) throw new Error('Add a description before creating the job.')
  const budgetWei = ethToWei(request.budgetEth)
  assertPositiveWei(budgetWei, 'Budget')
  return send(signer, 'createJob', [description, budgetWei])
}

export async function createJobWithEth(
  signer: Signer,
  description: string,
  budgetEth: string,
): Promise<EscrowTransactionResponse> {
  return createJob(signer, { description, budgetEth })
}

export async function fundJobWithWei(
  signer: Signer,
  jobId: bigint,
  amountWei: bigint,
): Promise<EscrowTransactionResponse> {
  assertValidJobId(jobId)
  assertPositiveWei(amountWei, 'Funding amount')
  return send(signer, 'fundJob', [jobId], { value: amountWei })
}

export async function fundJob(
  signer: Signer,
  jobId: bigint,
  amountEth: string,
): Promise<EscrowTransactionResponse> {
  return fundJobWithWei(signer, jobId, ethToWei(amountEth))
}

export const acceptJob = (signer: Signer, jobId: bigint) => send(signer, 'acceptJob', [jobId])
export const submitWork = (signer: Signer, jobId: bigint, work: string) => {
  const trimmedWork = work.trim()
  if (trimmedWork.length === 0) throw new Error('Work submission cannot be empty.')
  return send(signer, 'submitWork', [jobId, trimmedWork])
}
export const approveWork = (signer: Signer, jobId: bigint) => send(signer, 'approveWork', [jobId])
export const raiseDispute = (signer: Signer, jobId: bigint) => send(signer, 'raiseDispute', [jobId])
export const resolveDispute = (signer: Signer, jobId: bigint, favorFreelancer: boolean) => send(signer, 'resolveDispute', [jobId, favorFreelancer])

export async function pause(signer: Signer): Promise<EscrowTransactionResponse> {
  if (!signer.provider) throw new Error('The wallet provider is not available.')
  await requireRole(signer.provider, await signer.getAddress(), DEFAULT_ADMIN_ROLE)
  return send(signer, 'pause')
}

export async function unpause(signer: Signer): Promise<EscrowTransactionResponse> {
  if (!signer.provider) throw new Error('The wallet provider is not available.')
  await requireRole(signer.provider, await signer.getAddress(), DEFAULT_ADMIN_ROLE)
  return send(signer, 'unpause')
}

export async function grantRole(signer: Signer, role: string, account: string): Promise<EscrowTransactionResponse> {
  if (!signer.provider) throw new Error('The wallet provider is not available.')
  await requireRole(signer.provider, await signer.getAddress(), DEFAULT_ADMIN_ROLE)
  return send(signer, 'grantRole', [role, assertValidAddress(account, 'Account')])
}

export async function revokeRole(signer: Signer, role: string, account: string): Promise<EscrowTransactionResponse> {
  if (!signer.provider) throw new Error('The wallet provider is not available.')
  await requireRole(signer.provider, await signer.getAddress(), DEFAULT_ADMIN_ROLE)
  return send(signer, 'revokeRole', [role, assertValidAddress(account, 'Account')])
}

export async function renounceRole(signer: Signer, role: string): Promise<EscrowTransactionResponse> {
  const account = await signer.getAddress()
  return send(signer, 'renounceRole', [role, account])
}

export async function resolveDisputeAsArbitrator(
  signer: Signer,
  jobId: bigint,
  favorFreelancer: boolean,
): Promise<EscrowTransactionResponse> {
  if (!signer.provider) throw new Error('The wallet provider is not available.')
  await requireRole(signer.provider, await signer.getAddress(), ARBITRATOR_ROLE)
  return resolveDispute(signer, jobId, favorFreelancer)
}

function eventArg(args: readonly unknown[], name: string, index: number): unknown {
  const named = args as unknown as Record<string, unknown>
  return name in named ? named[name] : args[index]
}

function eventBigInt(args: readonly unknown[], name: string, index: number): bigint {
  return asBigInt(eventArg(args, name, index), name)
}

function eventAddress(args: readonly unknown[], name: string, index: number): string {
  return asAddress(eventArg(args, name, index), name)
}

function eventString(args: readonly unknown[], name: string, index: number): string {
  return asString(eventArg(args, name, index), name)
}

function logMetadata(log: Log | EventLog, name: string) {
  return {
    name,
    transactionHash: log.transactionHash,
    blockNumber: log.blockNumber,
    logIndex: log.index,
  }
}

export function parseEscrowLogs(logs: readonly (Log | EventLog)[]): EscrowEvent[] {
  const events: EscrowEvent[] = []
  for (const log of logs) {
    let parsed
    try {
      parsed = ESCROW_MARKETPLACE_INTERFACE.parseLog({ topics: log.topics, data: log.data })
    } catch {
      continue
    }
    if (!parsed) continue

    const args = parsed.args
    const base = logMetadata(log, parsed.name)
    switch (parsed.name) {
      case 'JobCreated':
        events.push({ ...base, name: parsed.name, jobId: eventBigInt(args, 'jobId', 0), client: eventAddress(args, 'client', 1), amountWei: eventBigInt(args, 'amount', 2), description: eventString(args, 'description', 3) })
        break
      case 'JobAccepted':
        events.push({ ...base, name: parsed.name, jobId: eventBigInt(args, 'jobId', 0), freelancer: eventAddress(args, 'freelancer', 1) })
        break
      case 'JobFunded':
        events.push({ ...base, name: parsed.name, jobId: eventBigInt(args, 'jobId', 0), funder: eventAddress(args, 'funder', 1), amountWei: eventBigInt(args, 'amount', 2) })
        break
      case 'WorkSubmitted':
        events.push({ ...base, name: parsed.name, jobId: eventBigInt(args, 'jobId', 0), freelancer: eventAddress(args, 'freelancer', 1), work: eventString(args, 'work', 2) })
        break
      case 'DisputeRaised':
        events.push({ ...base, name: parsed.name, jobId: eventBigInt(args, 'jobId', 0), raisedBy: eventAddress(args, 'raisedBy', 1) })
        break
      case 'PaymentReleased':
        events.push({ ...base, name: parsed.name, jobId: eventBigInt(args, 'jobId', 0), freelancer: eventAddress(args, 'freelancer', 1), amountWei: eventBigInt(args, 'amount', 2) })
        break
      case 'JobRefunded':
        events.push({ ...base, name: parsed.name, jobId: eventBigInt(args, 'jobId', 0), client: eventAddress(args, 'client', 1), amountWei: eventBigInt(args, 'amount', 2) })
        break
      case 'RoleGranted':
      case 'RoleRevoked':
        events.push({ ...base, name: parsed.name, role: String(eventArg(args, 'role', 0)), account: eventAddress(args, 'account', 1), sender: eventAddress(args, 'sender', 2) })
        break
      case 'Paused':
      case 'Unpaused':
        events.push({ ...base, name: parsed.name, account: eventAddress(args, 'account', 0) })
        break
      default:
        break
    }
  }
  return events
}

export function parseEscrowTransaction(
  data: string,
  value: bigint = 0n,
): TransactionDescription | null {
  return ESCROW_MARKETPLACE_INTERFACE.parseTransaction({ data, value })
}

export async function waitForEscrowTransaction(
  transaction: EscrowTransactionResponse,
  confirmations?: number,
): Promise<EscrowTransactionResult> {
  const receipt = await transaction.wait(confirmations)
  if (!receipt) throw new Error('The transaction was not mined; no success is assumed.')
  return { hash: transaction.hash, receipt, events: parseEscrowLogs(receipt.logs) }
}

export function transactionUrl(hash: string): string {
  return `https://sepolia.etherscan.io/tx/${hash}`
}

export function parseContractError(error: unknown): string {
  return userFacingErrorMessage(error)
}

export function toUserFacingError(error: unknown): Error {
  return toEscrowUserFacingError(error)
}

export function isKnownJobStatus(status: number): status is JobStatus {
  return Object.values(JobStatus).some((value) => typeof value === 'number' && value === status)
}

export function toUiJob(job: EscrowJob): Job {
  if (job.id > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Job ID is too large for this frontend.')
  return {
    id: Number(job.id),
    client: job.client,
    freelancer: job.freelancer,
    description: job.description,
    amountWei: job.budgetWei,
    status: Number(job.status) as JobStatus,
    workCID: job.workSubmission,
    disputeRaised: job.disputeRaised,
  }
}

export function getDefaultRpcUrl(): string | undefined {
  const runtimeMeta = import.meta as unknown as { env?: { VITE_SEPOLIA_RPC_URL?: string } }
  return runtimeMeta.env?.VITE_SEPOLIA_RPC_URL
}

export function getReadProvider(): JsonRpcProvider | null {
  const rpcUrl = getDefaultRpcUrl()
  return rpcUrl ? new JsonRpcProvider(rpcUrl, SEPOLIA_CHAIN_ID) : null
}

export async function getBrowserProvider(): Promise<BrowserProvider> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No wallet detected. Install MetaMask or another EVM wallet to continue.')
  }
  const provider = new BrowserProvider(window.ethereum)
  await assertSepoliaNetwork(provider)
  return provider
}

export async function getSigner(): Promise<Signer> {
  const provider = await getBrowserProvider()
  return provider.getSigner()
}

export function hasWalletProvider(): boolean {
  return typeof window !== 'undefined' && Boolean(window.ethereum)
}

export function getContractAddress(): EthereumAddress {
  return ESCROW_MARKETPLACE_ADDRESS
}

export const STATUS_LABELS = EscrowJobStatusLabel
export { ESCROW_MARKETPLACE_ABI }
