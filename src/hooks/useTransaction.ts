import { useCallback, useEffect, useRef, useState } from 'react'
import type { ContractTransactionResponse } from 'ethers'
import { parseContractError, transactionUrl } from '../services/escrowService'
import type { TransactionState } from '../types/escrow'

export function useTransaction(sessionId = 0) {
  const [state, setState] = useState<TransactionState>({ phase: 'ready' })
  const activeSession = useRef(sessionId)

  useEffect(() => {
    activeSession.current = sessionId
    setState({ phase: 'ready' })
  }, [sessionId])

  const run = useCallback(async (action: () => Promise<ContractTransactionResponse>) => {
    const runSession = activeSession.current
    if (['wallet', 'submitted', 'confirming'].includes(state.phase)) throw new Error('A transaction is already pending for this wallet.')
    setState({ phase: 'wallet' })
    try {
      const tx = await action()
      if (activeSession.current !== runSession) throw new Error('The active wallet changed. Refresh the job before continuing.')
      setState({ phase: 'submitted', hash: tx.hash })
      setState({ phase: 'confirming', hash: tx.hash })
      await tx.wait()
      if (activeSession.current !== runSession) throw new Error('The active wallet changed while the transaction was confirming. Refresh before taking another action.')
      setState({ phase: 'confirmed', hash: tx.hash })
      return tx
    } catch (error) {
      const message = parseContractError(error)
      setState({ phase: 'failed', error: message })
      throw new Error(message)
    }
  }, [state.phase])

  return { state, run, isBusy: ['wallet', 'submitted', 'confirming'].includes(state.phase), reset: () => setState({ phase: 'ready' }), explorerUrl: state.hash ? transactionUrl(state.hash) : undefined }
}
