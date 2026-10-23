import { ArrowUpRight, BriefcaseBusiness, MoreHorizontal, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Job } from '../types/escrow'
import { JobStatus } from '../types/escrow'
import { formatEth, shortenAddress } from '../utils/format'
import { StatusBadge } from './StatusBadge'

interface JobCardProps {
  job: Job
  demo?: boolean
  featured?: boolean
  onArchive?: (job: Job) => void
  onRestore?: (job: Job) => void
}

export function JobCard({ job, demo = false, featured = false, onArchive, onRestore }: JobCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuAction = onRestore ?? onArchive
  const menuLabel = onRestore ? 'Restore to dashboard' : 'Archive locally'

  return <article className={`job-card ${featured ? 'job-card-featured' : ''}`}>
     <div className="job-card-top"><div className="job-index">{demo ? 'DEMO OPPORTUNITY' : `JOB #${String(job.id).padStart(3, '0')}`}</div><div className="job-card-top-actions"><StatusBadge status={job.status} small />{menuAction && <div className="job-card-menu-wrap"><button className="icon-button" type="button" aria-label={`${menuLabel} for job ${job.id}`} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><MoreHorizontal size={17} /></button>{menuOpen && <div className="job-card-menu" role="menu"><button className={onArchive ? 'job-card-menu-danger' : ''} type="button" role="menuitem" onClick={() => { setMenuOpen(false); menuAction(job) }}>{menuLabel}</button></div>}</div>}</div></div>
    <div className="job-card-icon"><BriefcaseBusiness size={18} /></div>
    <h3>{job.description.split('\n')[0] || 'Untitled opportunity'}</h3>
    <p>{job.description.split('\n').slice(1).join(' ') || job.description}</p>
    <div className="job-card-meta"><div><span className="meta-label">Budget</span><strong>{formatEth(job.amountWei)}</strong></div><div><span className="meta-label">Client</span><strong><UserRound size={13} /> {shortenAddress(job.client)}</strong></div></div>
    <Link className="card-action" to={demo ? '/marketplace' : `/jobs/${job.id}`}>{job.status === JobStatus.OPEN ? 'View opportunity' : 'Open job details'}<ArrowUpRight size={16} /></Link>
  </article>
}
