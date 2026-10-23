import { Interface } from 'ethers'
import { ESCROW_MARKETPLACE_INTERFACE } from '../contracts/escrowMarketplace'

export interface ParsedContractError {
  name: string
  message: string
  args: readonly unknown[]
}

interface UnknownRecord {
  [key: string]: unknown
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function findRevertData(value: unknown, depth = 0): string | null {
  if (depth > 5 || value === null || value === undefined) return null
  if (typeof value === 'string' && /^0x[0-9a-fA-F]+$/.test(value)) return value
  if (!isRecord(value)) return null

  for (const key of ['data', 'error', 'info', 'cause', 'response']) {
    const nested = findRevertData(value[key], depth + 1)
    if (nested) return nested
  }

  return null
}

function findMessage(value: unknown): string | null {
  if (value instanceof Error && value.message) return value.message
  if (!isRecord(value)) return null

  for (const key of ['shortMessage', 'reason', 'message', 'details']) {
    if (typeof value[key] === 'string' && value[key]) return value[key]
  }

  return null
}

function decimalArg(value: unknown): string {
  return typeof value === 'bigint' ? value.toString() : String(value)
}

export function parseContractError(error: unknown): ParsedContractError | null {
  const data = findRevertData(error)
  if (!data) return null

  try {
    const parsed = ESCROW_MARKETPLACE_INTERFACE.parseError(data)
    if (!parsed) return null
    return {
      name: parsed.name,
      message: parsed.name,
      args: Array.from(parsed.args),
    }
  } catch {
    try {
      const parsed = new Interface(['error Error(string)', 'error Panic(uint256)']).parseError(data)
      if (!parsed) return null
      return { name: parsed.name, message: parsed.name, args: Array.from(parsed.args) }
    } catch {
      return null
    }
  }
}

export function userFacingErrorMessage(error: unknown): string {
  const code = isRecord(error) && typeof error.code === 'string' ? error.code : ''
  const rawMessage = findMessage(error) ?? String(error)
  const parsed = parseContractError(error)

  if (code === 'ACTION_REJECTED' || /user rejected|user denied|request rejected/i.test(rawMessage)) {
    return 'The wallet request was rejected. No transaction was sent.'
  }
  if (/insufficient funds|not enough funds/i.test(rawMessage)) {
    return 'Your wallet needs more Sepolia test ETH to pay for this transaction.'
  }
  if (/wrong network|chain id|unsupported chain/i.test(rawMessage)) {
    return 'Switch your wallet to Ethereum Sepolia and try again.'
  }

  if (parsed) {
    switch (parsed.name) {
      case 'UnauthorizedCaller':
      case 'AccessControlUnauthorizedAccount':
        return 'Your wallet is not authorized to perform this action.'
      case 'EmptyDescription':
        return 'Add a description before creating the job.'
      case 'IncorrectFundingAmount':
        return `Funding must match the job budget exactly (${decimalArg(parsed.args[1])} wei expected; ${decimalArg(parsed.args[0])} wei received).`
      case 'InsufficientBalance':
        return 'The escrow contract does not have enough ETH for this payout.'
      case 'EnforcedPause':
        return 'The marketplace is paused. Try again after it is unpaused.'
      case 'ExpectedPause':
        return 'The marketplace is already active.'
      case 'ReentrancyGuardReentrantCall':
        return 'The contract rejected this repeated call. Wait for the previous transaction to finish.'
      case 'FailedCall':
        return 'The escrow payout call failed. No success is assumed.'
      case 'Error':
        return typeof parsed.args[0] === 'string' ? parsed.args[0] : 'The contract rejected this action.'
      case 'Panic':
        return 'The contract hit an internal safety check and rejected this action.'
      default:
        return `The contract rejected this action (${parsed.name}).`
    }
  }

  if (/missing revert data|execution reverted|revert/i.test(rawMessage)) {
    return 'The contract rejected this action. Check the job state, your role, and the exact payment amount.'
  }

  return rawMessage.length > 180 ? `${rawMessage.slice(0, 177)}…` : rawMessage
}

export class EscrowUserFacingError extends Error {
  public readonly cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.cause = cause
    this.name = 'EscrowUserFacingError'
  }
}

export function toEscrowUserFacingError(error: unknown): EscrowUserFacingError {
  return new EscrowUserFacingError(userFacingErrorMessage(error), error)
}
