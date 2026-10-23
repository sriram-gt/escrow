import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { getWalletSnapshot, hasWalletProvider, requestWalletAccounts, switchToSepolia } from '../services/escrowService'
import { NETWORK, type WalletState } from '../types/escrow'
import { walletIdentityChanged } from '../utils/wallet'

interface WalletContextValue extends WalletState {
  isInstalled: boolean
  isWrongNetwork: boolean
  connect: () => Promise<void>
  switchNetwork: () => Promise<void>
  refresh: () => Promise<void>
}

const WalletContext = createContext<WalletContextValue | null>(null)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({ address: null, chainId: null, isConnecting: false, error: null, sessionId: 0 })
  const isInstalled = hasWalletProvider()
  const isWrongNetwork = Boolean(state.chainId && state.chainId !== NETWORK.chainId)
  const refreshRequest = useRef(0)

  const refresh = useCallback(async () => {
    const requestId = ++refreshRequest.current
    if (!isInstalled) {
      setState((current) => current.address || current.chainId ? { ...current, address: null, chainId: null, sessionId: current.sessionId + 1 } : current)
      return
    }
    try {
      const snapshot = await getWalletSnapshot()
      if (requestId !== refreshRequest.current) return
      setState((current) => {
        const changed = walletIdentityChanged(current.address, current.chainId, snapshot.address, snapshot.chainId)
        return { ...current, address: snapshot.address, chainId: snapshot.chainId, error: null, sessionId: changed ? current.sessionId + 1 : current.sessionId }
      })
    } catch (error) {
      if (requestId !== refreshRequest.current) return
      setState((current) => ({ ...current, error: error instanceof Error ? error.message : 'Unable to read wallet state.' }))
    }
  }, [isInstalled])

  useEffect(() => {
    void refresh()
    if (!window.ethereum?.on) return undefined
    const onAccountsChanged = () => void refresh()
    const onChainChanged = () => void refresh()
    window.ethereum.on('accountsChanged', onAccountsChanged)
    window.ethereum.on('chainChanged', onChainChanged)
    return () => {
      window.ethereum?.removeListener?.('accountsChanged', onAccountsChanged)
      window.ethereum?.removeListener?.('chainChanged', onChainChanged)
    }
  }, [refresh])

  const connect = useCallback(async () => {
    setState((current) => ({ ...current, isConnecting: true, error: null }))
    try {
      await requestWalletAccounts()
      await refresh()
    } catch (error) {
      setState((current) => ({ ...current, error: error instanceof Error ? error.message : 'Unable to connect wallet.' }))
    } finally {
      setState((current) => ({ ...current, isConnecting: false }))
    }
  }, [refresh])

  const switchNetwork = useCallback(async () => {
    try {
      await switchToSepolia()
      await refresh()
    } catch (error) {
      setState((current) => ({ ...current, error: error instanceof Error ? error.message : 'Unable to switch networks.' }))
    }
  }, [refresh])

  const value = useMemo(() => ({ ...state, isInstalled, isWrongNetwork, connect, switchNetwork, refresh }), [state, isInstalled, isWrongNetwork, connect, switchNetwork, refresh])
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) throw new Error('useWallet must be used within WalletProvider')
  return context
}
