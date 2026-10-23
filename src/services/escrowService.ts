import { BrowserProvider, type ContractTransactionResponse, type Provider } from 'ethers'
import { CONTRACT_ADDRESS, escrowAbi } from '../contracts/escrow'
import { NETWORK, type Job } from '../types/escrow'
import {
  acceptJob as acceptJobWithSigner,
  approveWork as approveWorkWithSigner,
  createJob as createJobWithSigner,
  fundJobWithWei,
  getBrowserProvider as getCoreBrowserProvider,
  getContract,
  getReadProvider as getCoreReadProvider,
  getRoleChecks as getCoreRoleChecks,
  hasRole as hasCoreRole,
  parseContractError,
  parseEscrowLogs,
  parseEscrowTransaction,
  readJob,
  readJobHistory,
  readReleaseBalanceSnapshot,
  readJobs,
  readNextJobId,
  raiseDispute as raiseDisputeWithSigner,
  resolveDispute as resolveDisputeWithSigner,
  submitWork as submitWorkWithSigner,
  toUiJob,
  transactionUrl,
  unpause as unpauseWithSigner,
  pause as pauseWithSigner,
  isEmptyJob,
} from './escrowMarketplace'

// Browser wallet providers expose this EIP-1193 surface.
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

export function hasWalletProvider(): boolean {
  return typeof window !== 'undefined' && Boolean(window.ethereum)
}

export function getReadProvider(): Provider | null {
  return getCoreReadProvider()
}

export async function getBrowserProvider(): Promise<BrowserProvider> {
  return getCoreBrowserProvider()
}

export function getReadContract(provider: ReadProvider) {
  return getContract(provider)
}

export async function getSignerContract() {
  const provider = await getBrowserProvider()
  const signer = await provider.getSigner()
  return { contract: getContract(signer), provider, signer }
}

function toSafeNumber(value: bigint, fieldName: string): number {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`${fieldName} is too large for this frontend.`)
  }
  return Number(value)
}

export async function fetchNextJobId(provider: ReadProvider): Promise<number> {
  return toSafeNumber(await readNextJobId(provider), 'Next job ID')
}

export async function fetchJob(provider: ReadProvider, id: number): Promise<Job> {
  if (!Number.isSafeInteger(id) || id < 0) throw new Error('Job ID must be a non-negative safe integer.')
  const rawJob = await readJob(provider, BigInt(id))
  if (isEmptyJob(rawJob)) throw new Error(`Job ${id} was not found on the deployed Sepolia contract.`)
  const job = toUiJob(rawJob)
  try {
    const history = await readJobHistory(provider, BigInt(id), Number(job.status) as import('../types/escrow').EscrowJobStatus)
    return { ...job, ...history }
  } catch {
    // The mapping record remains authoritative even when the RPC does not support log queries.
    return job
  }
}

export { readReleaseBalanceSnapshot }

export async function fetchJobs(
  provider: ReadProvider,
  options?: { page?: number; pageSize?: number },
): Promise<{ jobs: Job[]; nextJobId: number; hasMore: boolean }> {
  const pageSize = options?.pageSize ?? 50
  const page = options?.page ?? 0
  if (!Number.isSafeInteger(pageSize) || pageSize <= 0) throw new Error('Page size must be a positive safe integer.')
  if (!Number.isSafeInteger(page) || page < 0) throw new Error('Page must be a non-negative safe integer.')

  const result = await readJobs(provider, { maxJobs: 1_000n })
  const jobs = result.jobs.map(toUiJob).sort((left, right) => right.id - left.id)
  const start = page * pageSize
  return {
    jobs: jobs.slice(start, start + pageSize),
    nextJobId: toSafeNumber(result.nextJobId, 'Next job ID'),
    hasMore: start + pageSize < jobs.length,
  }
}

export async function requestWalletAccounts(): Promise<string | null> {
  if (!window.ethereum) throw new Error('No wallet detected. Install MetaMask or another EVM wallet to continue.')
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[]
  return accounts[0] ?? null
}

export async function getWalletSnapshot(): Promise<{ address: string | null; chainId: number | null }> {
  if (!window.ethereum) return { address: null, chainId: null }
  const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[]
  const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' }) as string
  return { address: accounts[0] ?? null, chainId: Number.parseInt(chainIdHex, 16) }
}

export async function switchToSepolia(): Promise<void> {
  if (!window.ethereum) throw new Error('No wallet detected. Install MetaMask or another EVM wallet to continue.')
  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: NETWORK.chainIdHex }] })
  } catch (error) {
    const code = (error as { code?: number }).code
    if (code !== 4902) throw error
    const runtimeMeta = import.meta as unknown as { env?: { VITE_SEPOLIA_RPC_URL?: string } }
    const rpcUrl = runtimeMeta.env?.VITE_SEPOLIA_RPC_URL
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: NETWORK.chainIdHex,
        chainName: NETWORK.name,
        nativeCurrency: NETWORK.nativeCurrency,
        rpcUrls: rpcUrl ? [rpcUrl] : [],
        blockExplorerUrls: [NETWORK.explorer],
      }],
    })
  }
}

export async function ensureSepolia(): Promise<void> {
  const snapshot = await getWalletSnapshot()
  if (snapshot.chainId !== NETWORK.chainId) {
    throw new Error('Wrong network. Switch your wallet to Ethereum Sepolia before continuing.')
  }
}

async function withSigner<T>(callback: (signer: import('ethers').Signer) => Promise<T>): Promise<T> {
  await ensureSepolia()
  const provider = await getBrowserProvider()
  return callback(await provider.getSigner())
}

export function createJob(description: string, budgetEth: string): Promise<ContractTransactionResponse> {
  return withSigner((signer) => createJobWithSigner(signer, { description, budgetEth }))
}

export function acceptJob(jobId: number): Promise<ContractTransactionResponse> {
  return withSigner((signer) => acceptJobWithSigner(signer, BigInt(jobId)))
}

export function fundJob(jobId: number, amountWei: bigint): Promise<ContractTransactionResponse> {
  return withSigner((signer) => fundJobWithWei(signer, BigInt(jobId), amountWei))
}

export function submitWork(jobId: number, workCID: string): Promise<ContractTransactionResponse> {
  return withSigner((signer) => submitWorkWithSigner(signer, BigInt(jobId), workCID))
}

export function approveWork(jobId: number): Promise<ContractTransactionResponse> {
  return withSigner((signer) => approveWorkWithSigner(signer, BigInt(jobId)))
}

export function raiseDispute(jobId: number): Promise<ContractTransactionResponse> {
  return withSigner((signer) => raiseDisputeWithSigner(signer, BigInt(jobId)))
}

export function resolveDispute(jobId: number, freelancerWins: boolean): Promise<ContractTransactionResponse> {
  return withSigner((signer) => resolveDisputeWithSigner(signer, BigInt(jobId), freelancerWins))
}

export function pauseContract(): Promise<ContractTransactionResponse> {
  return withSigner(pauseWithSigner)
}

export function unpauseContract(): Promise<ContractTransactionResponse> {
  return withSigner(unpauseWithSigner)
}

export function hasRole(provider: ReadProvider, role: string, account: string): Promise<boolean> {
  return hasCoreRole(provider, role, account)
}

export function getRoleChecks(provider: ReadProvider, account: string) {
  return getCoreRoleChecks(provider, account)
}

export async function waitForConfirmation(transaction: ContractTransactionResponse): Promise<string> {
  const receipt = await transaction.wait()
  if (!receipt) throw new Error('The transaction was not mined; no success is assumed.')
  return transaction.hash
}

export { CONTRACT_ADDRESS, escrowAbi, parseContractError, parseEscrowLogs, parseEscrowTransaction, transactionUrl }
