import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserProvider } from 'ethers'
import { fetchJob, fetchJobs, getReadProvider, getRoleChecks, hasWalletProvider, readReleaseBalanceSnapshot } from '../services/escrowService'
import type { Job } from '../types/escrow'
import { useWallet } from './useWallet'

function getProvider() {
  const readProvider = getReadProvider()
  if (readProvider) return readProvider
  if (hasWalletProvider()) return new BrowserProvider(window.ethereum!)
  return null
}

export function useJobs() {
  const { chainId, sessionId } = useWallet()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    const provider = getProvider()
    if (!provider || (chainId !== null && chainId !== 11155111)) {
      setJobs([])
      setLoading(false)
      setError(!provider ? 'No Sepolia read provider is available. Configure VITE_SEPOLIA_RPC_URL or connect a Sepolia wallet.' : 'Switch your wallet to Ethereum Sepolia to read marketplace data.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await fetchJobs(provider)
      if (requestId === requestRef.current) setJobs(result.jobs)
    } catch (nextError) {
      if (requestId === requestRef.current) setError(nextError instanceof Error ? nextError.message : 'Unable to read jobs from Sepolia.')
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [chainId, sessionId])

  useEffect(() => { void load() }, [load])
  return { jobs, loading, error, reload: load }
}

export function useJob(id: number | undefined) {
  const { chainId, sessionId } = useWallet()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    if (id === undefined) {
      setJob(null)
      setError('The job URL does not contain a valid numeric job ID.')
      setLoading(false)
      return
    }
    setJob(null)
    setError(null)
    setLoading(true)
    const provider = getProvider()
    if (!provider || (chainId !== null && chainId !== 11155111)) {
      setLoading(false)
      setError(!provider ? 'No Sepolia read provider is available. Configure VITE_SEPOLIA_RPC_URL or connect a Sepolia wallet.' : 'Switch your wallet to Ethereum Sepolia to read this job.')
      return
    }
    try {
      const nextJob = await fetchJob(provider, id)
      if (requestId === requestRef.current) setJob(nextJob)
    } catch (nextError) {
      if (requestId === requestRef.current) setError(nextError instanceof Error ? nextError.message : 'Unable to read this job from Sepolia.')
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [chainId, id, sessionId])

  useEffect(() => { void load() }, [load])
  return { job, loading, error, reload: load }
}

export function useRoleChecks() {
  const { address, chainId, sessionId } = useWallet()
  const [roles, setRoles] = useState({ isArbitrator: false, isAdmin: false })
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!address || chainId !== 11155111) {
      setRoles({ isArbitrator: false, isAdmin: false })
      return
    }
    const provider = getProvider()
    if (!provider) {
      setLoading(false)
      return
    }
    setLoading(true)
    void getRoleChecks(provider, address)
      .then(setRoles)
      .catch(() => setRoles({ isArbitrator: false, isAdmin: false }))
      .finally(() => setLoading(false))
  }, [address, chainId, sessionId])
  return { ...roles, loading }
}

export function useReleaseBalance(transactionHash: string | undefined, account: string | null) {
  const { chainId, sessionId } = useWallet()
  const [snapshot, setSnapshot] = useState<import('../types/escrow').ReleaseBalanceSnapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const requestRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    setSnapshot(null)
    if (!transactionHash || !account || chainId !== 11155111) {
      setLoading(false)
      return
    }
    const provider = getProvider()
    if (!provider) return
    setLoading(true)
    try {
      const nextSnapshot = await readReleaseBalanceSnapshot(provider, transactionHash, account)
      if (requestId === requestRef.current) setSnapshot(nextSnapshot)
    } catch {
      if (requestId === requestRef.current) setSnapshot(null)
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [account, chainId, sessionId, transactionHash])

  useEffect(() => { void load() }, [load])
  return { snapshot, loading, reload: load }
}
