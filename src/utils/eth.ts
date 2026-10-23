import { formatEther, parseEther } from 'ethers'

export function ethToWei(amountEth: string): bigint {
  const normalized = amountEth.trim()

  if (normalized.length === 0) {
    throw new Error('ETH amount is required.')
  }

  if (!/^\d+(?:\.\d{1,18})?$/.test(normalized)) {
    throw new Error('Enter a valid ETH amount with up to 18 decimal places.')
  }

  try {
    return parseEther(normalized)
  } catch {
    throw new Error('Enter a valid ETH amount with up to 18 decimal places.')
  }
}

export function weiToEth(amountWei: bigint): string {
  return formatEther(amountWei)
}

export function assertPositiveWei(amountWei: bigint, fieldName = 'Amount'): void {
  if (amountWei <= 0n) {
    throw new Error(`${fieldName} must be greater than zero.`)
  }
}
