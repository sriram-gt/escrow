import { ArrowDownUp, Filter, Plus, RefreshCcw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { JobStatus } from '../types/escrow'
import { useJobs } from '../hooks/useEscrow'
import { JobCard } from '../components/JobCard'
import { EmptyState, ErrorState, LoadingState } from '../components/Primitives'

export function MarketplacePage() {
  const { jobs, loading, error, reload } = useJobs()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | JobStatus>('all')
  const [sort, setSort] = useState<'newest' | 'budget'>('newest')
  const filteredJobs = useMemo(() => jobs.filter((job) => `${job.description} ${job.client}`.toLowerCase().includes(search.toLowerCase())).filter((job) => status === 'all' || job.status === status).sort((a, b) => sort === 'budget' ? (a.amountWei > b.amountWei ? -1 : 1) : b.id - a.id), [jobs, search, sort, status])
  return <main className="page-shell"><div className="container"><div className="page-intro"><div><div className="eyebrow">Sepolia marketplace</div><h1>Work with a clear next step.</h1><p>Every listing below is read from the deployed EscrowMarketplace contract. If the chain has no jobs, we’ll say so.</p></div><Link to="/create-job" className="button button-primary"><Plus size={16} /> Create a job</Link></div>
    <div className="market-toolbar"><label className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search job descriptions" aria-label="Search job descriptions" /></label><label className="select-field"><Filter size={15} /><select value={status} onChange={(event) => setStatus(event.target.value === 'all' ? 'all' : Number(event.target.value) as JobStatus)} aria-label="Filter by status"><option value="all">All statuses</option><option value={JobStatus.OPEN}>Open</option><option value={JobStatus.ACCEPTED}>Accepted</option><option value={JobStatus.FUNDED}>Funded</option><option value={JobStatus.SUBMITTED}>Submitted</option><option value={JobStatus.DISPUTED}>Disputed</option><option value={JobStatus.RELEASED}>Released</option><option value={JobStatus.REFUNDED}>Refunded</option></select></label><label className="select-field"><ArrowDownUp size={15} /><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} aria-label="Sort jobs"><option value="newest">Newest first</option><option value="budget">Highest budget</option></select></label><button className="icon-button toolbar-refresh" onClick={() => void reload()} aria-label="Refresh jobs"><RefreshCcw size={16} /></button></div>
    {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={() => void reload()} /> : filteredJobs.length === 0 ? <EmptyState title={jobs.length === 0 ? 'The marketplace is waiting for its first job' : 'No jobs match these filters'} copy={jobs.length === 0 ? 'Create a listing on Sepolia and it will appear here after confirmation.' : 'Try a broader search or reset the status filter.'} action={jobs.length === 0 ? <Link to="/create-job" className="button button-primary button-small"><Plus size={15} /> Create the first job</Link> : undefined} /> : <><div className="results-row"><span>{filteredJobs.length} {filteredJobs.length === 1 ? 'opportunity' : 'opportunities'}</span><span>Live contract data</span></div><div className="job-grid">{filteredJobs.map((job) => <JobCard key={job.id} job={job} />)}</div></>}
  </div></main>
}
