import { describe, expect, it } from 'vitest'
import { userFacingErrorMessage } from './contractErrors'

describe('contract error messages', () => {
  it('explains wallet rejection without claiming a transaction was sent', () => {
    expect(userFacingErrorMessage({ code: 'ACTION_REJECTED', message: 'User rejected the request' })).toContain('No transaction was sent')
  })

  it('explains insufficient Sepolia funds as a gas/funding issue', () => {
    expect(userFacingErrorMessage(new Error('insufficient funds for intrinsic transaction cost'))).toContain('Sepolia test ETH')
  })
})
