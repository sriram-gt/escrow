import { describe, expect, it } from 'vitest'
import { parseEther } from 'ethers'
import { formatEth, ipfsGatewayUrl, isValidCid, shortenAddress } from './format'

describe('format helpers', () => {
  it('formats exact bigint ETH amounts without floating point conversion', () => {
    expect(formatEth(parseEther('1.25'))).toBe('1.25 ETH')
  })

  it('shortens addresses for readable UI labels', () => {
    expect(shortenAddress('0x1234567890abcdef')).toBe('0x1234…cdef')
  })

  it('accepts plausible content identifiers and rejects empty input', () => {
    expect(isValidCid('bafybeigdyrzt5y4examplecid')).toBe(true)
    expect(isValidCid('')).toBe(false)
  })

  it('creates a safe HTTPS gateway link only for recognized CID values', () => {
    expect(ipfsGatewayUrl('ipfs://bafybeigdyrzt5y4examplecid')).toBe('https://ipfs.io/ipfs/bafybeigdyrzt5y4examplecid')
    expect(ipfsGatewayUrl('javascript:alert(1)')).toBeNull()
  })
})
