import { describe, expect, it } from 'vitest'
import { ESCROW_MARKETPLACE_DEPLOYMENT_BLOCK, MAX_LOG_RANGE } from '../contracts/escrowMarketplace'
import { getLogRanges } from '../services/escrowMarketplace'

describe('bounded Sepolia log ranges', () => {
  it('starts at deployment and never exceeds the provider range limit', () => {
    const ranges = getLogRanges(ESCROW_MARKETPLACE_DEPLOYMENT_BLOCK + MAX_LOG_RANGE * 2n + 3n)
    expect(ranges[0]?.fromBlock).toBe(ESCROW_MARKETPLACE_DEPLOYMENT_BLOCK)
    expect(ranges.every((range) => range.toBlock - range.fromBlock + 1n <= MAX_LOG_RANGE)).toBe(true)
  })

  it('does not request history before the contract was deployed', () => {
    expect(getLogRanges(ESCROW_MARKETPLACE_DEPLOYMENT_BLOCK - 1n)).toEqual([])
  })
})
