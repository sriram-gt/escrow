import type { InterfaceAbi } from 'ethers'
import {
  ESCROW_MARKETPLACE_ABI,
  ESCROW_MARKETPLACE_ADDRESS,
  ESCROW_MARKETPLACE_INTERFACE,
} from './escrowMarketplace'

/** Compatibility exports for the existing React pages. */
export const escrowAbi: InterfaceAbi = ESCROW_MARKETPLACE_ABI as unknown as InterfaceAbi
export const escrowEventsAbi: InterfaceAbi = ESCROW_MARKETPLACE_ABI as unknown as InterfaceAbi
export const CONTRACT_ADDRESS = ESCROW_MARKETPLACE_ADDRESS
export { ESCROW_MARKETPLACE_INTERFACE }
