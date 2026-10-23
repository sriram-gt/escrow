export function walletIdentityChanged(previousAddress: string | null, previousChainId: number | null, nextAddress: string | null, nextChainId: number | null) {
  return previousAddress?.toLowerCase() !== nextAddress?.toLowerCase() || previousChainId !== nextChainId
}
