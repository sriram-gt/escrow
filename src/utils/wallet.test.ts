import { describe, expect, it } from 'vitest'
import { walletIdentityChanged } from './wallet'

describe('wallet identity changes', () => {
  it('detects MetaMask account switches even on the same chain', () => {
    expect(walletIdentityChanged('0xaaa', 11155111, '0xbbb', 11155111)).toBe(true)
  })

  it('does not reset account-scoped state when the same account remains on the same chain', () => {
    expect(walletIdentityChanged('0xAaA', 11155111, '0xaaa', 11155111)).toBe(false)
  })
})
