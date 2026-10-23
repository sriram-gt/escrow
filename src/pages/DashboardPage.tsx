import { AlertCircle, ArrowRight, BriefcaseBusiness, CheckCircle2, CircleDollarSign, Gavel, Plus, RefreshCcw, ShieldAlert, UserRound } from 'lucide-react'
import { BrowserProvider } from 'ethers'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { JobStatus, NETWORK, type Job } from '../types/escrow'
import { useWallet } from '../hooks/useWallet'
import { useJobs } from '../hooks/useEscrow'
import { fetchJob, getReadProvider, getWalletSnapshot, hasWalletProvider } from '../services/escrowService'
import { shortenAddress } from '../utils/format'
import { archiveJobForWallet, canArchiveJob, getArchivedJobIds, restoreJobForWallet, subscribeToLocalArchiveChanges } from '../utils/localArchive'
import { JobCard } from '../components/JobCard'
import { EmptyState, ErrorState, LoadingState, SectionHeading } from '../components/Primitives'
import { EscrowMascot } from '../components/EscrowMascot'

type ArchiveFeedback = { kind: 'success' | 'error'; message: string }

export function DashboardPage() {
  const { address, connect, sessionId } = useWallet()
  const { jobs, loading, error, reload } = useJobs()
  const [archivedIds, setArchivedIds] = useState<Set<number>>(() => getArchivedJobIds(address))
  const [archiveCandidate, setArchiveCandidate] = useState<Job | null>(null)
  const [archiveBusy, setArchiveBusy] = useState(false)
  const [archiveFeedback, setArchiveFeedback] = useState<ArchiveFeedback | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    setArchivedIds(getArchivedJobIds(address))
    setArchiveCandidate(null)
    setArchiveFeedback(null)
    setShowArchived(false)
  }, [address, sessionId])

  useEffect(() => subscribeToLocalArchiveChanges((changedAddress) => {
    if (changedAddress === null || changedAddress === address?.toLowerCase()) {
      setArchivedIds(getArchivedJobIds(address))
    }
  }), [address])

  if (!address) {
    return <main className="page-shell"><div className="container dashboard-gate"><div className="mascot-dock"><EscrowMascot state="disconnected" /></div><div className="gate-icon"><UserRound size={22} /></div><div className="eyebrow">Your workspace</div><h1>A dashboard for the work tied to your wallet.</h1><p>Connect a Sepolia wallet to see jobs you created, accepted, and need to act on.</p><button className="button button-primary" onClick={() => void connect()}>Connect wallet <ArrowRight size={16} /></button></div></main>
  }

  const mine = jobs.filter((job) => job.client.toLowerCase() === address.toLowerCase() || job.freelancer.toLowerCase() === address.toLowerCase())
  // If a stale local id points at a job that has moved on-chain, show it again.
  // This keeps locked, pending, unresolved, and completed agreements visible.
  const visibleMine = mine.filter((job) => !archivedIds.has(job.id) || !canArchiveJob(job, address))
  const archived = mine.filter((job) => archivedIds.has(job.id) && canArchiveJob(job, address))
  const created = visibleMine.filter((job) => job.client.toLowerCase() === address.toLowerCase())
  const accepted = visibleMine.filter((job) => job.freelancer.toLowerCase() === address.toLowerCase())
  const awaiting = visibleMine.filter((job) => (job.client.toLowerCase() === address.toLowerCase() && [JobStatus.ACCEPTED, JobStatus.SUBMITTED].includes(job.status)) || (job.freelancer.toLowerCase() === address.toLowerCase() && job.status === JobStatus.FUNDED))
  const awaitingApproval = visibleMine.filter((job) => job.client.toLowerCase() === address.toLowerCase() && job.status === JobStatus.SUBMITTED)
  const completed = visibleMine.filter((job) => [JobStatus.RELEASED, JobStatus.REFUNDED].includes(job.status))
  const disputed = visibleMine.filter((job) => job.status === JobStatus.DISPUTED)

  const requestArchive = (job: Job) => {
    setArchiveFeedback(null)
    if (!canArchiveJob(job, address)) {
      setArchiveFeedback({ kind: 'error', message: 'This job is no longer an eligible unfunded OPEN job, so it remains visible.' })
      return
    }
    setArchiveCandidate(job)
  }

  const confirmArchive = async () => {
    if (!archiveCandidate || !address) return
    setArchiveBusy(true)
    setArchiveFeedback(null)
    try {
      // Re-read wallet identity and the contract record immediately before the
      // local write so a stale card cannot hide a changed agreement.
      const snapshot = await getWalletSnapshot()
      if (!snapshot.address || snapshot.address.toLowerCase() !== address.toLowerCase()) throw new Error('The connected wallet changed. Refresh the dashboard before archiving.')
      if (snapshot.chainId !== NETWORK.chainId) throw new Error('Switch your wallet to Ethereum Sepolia before archiving.')
      const provider = getReadProvider() ?? (hasWalletProvider() ? new BrowserProvider(window.ethereum!) : null)
      if (!provider) throw new Error('No Sepolia read provider is available to recheck this job.')
      const latestJob = await fetchJob(provider, archiveCandidate.id)
      if (!canArchiveJob(latestJob, snapshot.address)) throw new Error('This job changed on-chain and can no longer be archived locally.')
      archiveJobForWallet(latestJob, snapshot.address)
      setArchivedIds(getArchivedJobIds(snapshot.address))
      setArchiveCandidate(null)
      setArchiveFeedback({ kind: 'success', message: `Job #${latestJob.id} was archived locally for this wallet. No contract record was deleted.` })
      await reload()
    } catch (nextError) {
      setArchiveFeedback({ kind: 'error', message: nextError instanceof Error ? nextError.message : 'Unable to archive this job locally.' })
    } finally {
      setArchiveBusy(false)
    }
  }

  const restoreArchive = (job: Job) => {
    try {
      if (!address) throw new Error('Connect the job owner wallet before restoring this archive.')
      restoreJobForWallet(job, address)
      setArchivedIds(getArchivedJobIds(address))
      setArchiveFeedback({ kind: 'success', message: `Job #${job.id} is visible in the dashboard again.` })
    } catch (nextError) {
      setArchiveFeedback({ kind: 'error', message: nextError instanceof Error ? nextError.message : 'Unable to restore this local archive.' })
    }
  }

  return <main className="page-shell">
    <div className="container">
      <div className="dashboard-head"><div><div className="eyebrow">Connected as {shortenAddress(address, 8, 6)}</div><h1>Your work, at a glance.</h1><p>Live records from the EscrowMarketplace contract, grouped around the decisions you own. Account session {sessionId} refreshes when MetaMask switches wallets.</p></div><div className="dashboard-actions"><button className="button button-ghost button-small" onClick={() => void reload()}><RefreshCcw size={14} /> Refresh</button><Link className="button button-primary" to="/create-job"><Plus size={16} /> Create a job</Link></div></div>
      {archiveFeedback && <div className={`archive-feedback ${archiveFeedback.kind === 'error' ? 'error' : ''}`} role={archiveFeedback.kind === 'error' ? 'alert' : 'status'}><span>{archiveFeedback.kind === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}</span><span>{archiveFeedback.message}</span></div>}
      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={() => void reload()} /> : <>
        <div className="stat-grid"><Stat icon={<BriefcaseBusiness size={17} />} label="Jobs I created" value={created.length} /><Stat icon={<UserRound size={17} />} label="Jobs I accepted" value={accepted.length} /><Stat icon={<CircleDollarSign size={17} />} label="Awaiting my action" value={awaiting.length} accent="violet" /><Stat icon={<CheckCircle2 size={17} />} label="Completed" value={completed.length} accent="green" /><Stat icon={<Gavel size={17} />} label="Disputed" value={disputed.length} accent="amber" /></div>
        <DashboardGroup title="Awaiting my action" copy="The next decision is yours." jobs={awaiting} empty="You’re all caught up." address={address} />
        <DashboardGroup title="Work awaiting client approval" copy="Submitted work is waiting for an explicit review." jobs={awaitingApproval} empty="No work is waiting for approval." address={address} />
        <DashboardGroup title="Jobs I created" copy="Briefs published by your wallet." jobs={created} empty="Create your first listing to see it here." address={address} onArchive={requestArchive} />
        <DashboardGroup title="Jobs I accepted" copy="Projects you committed to." jobs={accepted} empty="Accepted work will appear here." address={address} />
        <DashboardGroup title="Completed jobs" copy="Released or refunded agreements." jobs={completed} empty="No completed agreements yet." address={address} />
        {archived.length > 0 && <section className="dashboard-group"><SectionHeading title="Archived locally" copy="Only this wallet’s dashboard hides these unfunded OPEN jobs. The contract records remain unchanged." action={<button className="button button-ghost button-small archive-toggle" onClick={() => setShowArchived((shown) => !shown)}>{showArchived ? 'Hide archived' : `Show archived (${archived.length})`}</button>} />{showArchived && <div className="job-grid compact-grid">{archived.map((job) => <JobCard key={job.id} job={job} onRestore={restoreArchive} />)}</div>}</section>}
      </>}
      <WorkflowGuide />
    </div>
    {archiveCandidate && <ArchiveConfirmModal job={archiveCandidate} busy={archiveBusy} onClose={() => { if (!archiveBusy) setArchiveCandidate(null) }} onConfirm={() => void confirmArchive()} />}
  </main>
}

function Stat({ icon, label, value, accent = '' }: { icon: React.ReactNode; label: string; value: number; accent?: string }) { return <div className={`stat-card ${accent}`}><span className="stat-icon">{icon}</span><strong>{value}</strong><span>{label}</span></div> }

function DashboardGroup({ title, copy, jobs, empty, address, onArchive }: { title: string; copy: string; jobs: Job[]; empty: string; address: string; onArchive?: (job: Job) => void }) { return <section className="dashboard-group"><SectionHeading title={title} copy={copy} action={jobs.length > 0 ? <span className="group-count">{jobs.length}</span> : undefined} />{jobs.length === 0 ? <EmptyState title={empty} copy="Only live contract records are shown here." /> : <div className="job-grid compact-grid">{jobs.slice(0, 4).map((job) => <JobCard key={job.id} job={job} onArchive={onArchive && canArchiveJob(job, address) ? onArchive : undefined} />)}</div>}</section> }

function ArchiveConfirmModal({ job, busy, onClose, onConfirm }: { job: Job; busy: boolean; onClose: () => void; onConfirm: () => void }) { return <div className="modal-backdrop" role="presentation"><div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="archive-confirm-title"><div className="modal-icon"><ShieldAlert size={20} /></div><h2 id="archive-confirm-title">Archive this listing locally?</h2><p>Only this wallet’s dashboard will hide Job #{job.id}. The deployed contract has no deletion method, and this action will not remove or change the on-chain record.</p><div className="modal-actions"><button className="button button-ghost" disabled={busy} onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy} onClick={onConfirm}>{busy ? 'Rechecking…' : 'Archive locally'}</button></div></div></div> }

function WorkflowGuide() { return <section className="workflow-guide"><div className="eyebrow">Test the Full Escrow Workflow</div><h2>Use two real Sepolia wallets, not a fake role switch.</h2><p>MetaMask can switch accounts in the same browser session. Each account must have its own Sepolia test ETH for gas, and the active signer always controls the transaction.</p><div className="guide-grid"><div><span>Wallet A · Client</span><ol><li>Connect Wallet A and create a job.</li><li>Wait for creation, then explicitly fund the exact amount.</li><li>Switch back to Wallet A later to review and approve.</li></ol></div><div><span>Wallet B · Freelancer</span><ol><li>Switch MetaMask to Wallet B or use another browser profile.</li><li>Find the live job, accept it, and complete work off-chain.</li><li>Submit a CID/reference, then switch back after release to verify the balance and transaction.</li></ol></div></div><div className="guide-footnote">Gas is separate from escrow. Creating a job costs a small amount of Sepolia ETH; it does not deposit the job price.</div></section> }
