import { ArrowRight, Check, CircleDollarSign, FileCheck2, LockKeyhole, MoveRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { JobStatus, type Job } from '../types/escrow'
import { JobCard } from '../components/JobCard'
import { NetworkBadge } from '../components/NetworkBadge'
import { SectionHeading } from '../components/Primitives'
import { WorkflowTimeline } from '../components/WorkflowTimeline'
import { useJobs } from '../hooks/useEscrow'

const demoJobs: Job[] = [
  { id: 101, description: 'Build a refined onboarding flow\nProduct UI · 3 screens and responsive states', amountWei: 1900000000000000000n, client: '0xF4A4b87b2144F92D9B8b7C7a1a1dF21CbbA4D2a8', freelancer: '', status: JobStatus.OPEN, workCID: '' },
  { id: 102, description: 'Motion system for a developer tool\nMicro-interactions, transitions, and tokens', amountWei: 2800000000000000000n, client: '0x9f3D7D0aB00cD4A2A8D19fC4Abd9eF5a7eE1B123', freelancer: '', status: JobStatus.OPEN, workCID: '' },
  { id: 103, description: 'Write a crisp protocol explainer\nTechnical storytelling for a new Web3 product', amountWei: 850000000000000000n, client: '0xB2c07A4d75b2B2b8F7E4A0A0E9B7eB4b9D2C8e10', freelancer: '', status: JobStatus.OPEN, workCID: '' },
]

export function HomePage() {
  const { jobs } = useJobs()
  const featured = jobs.length > 0 ? jobs.slice(0, 3) : demoJobs
  const live = jobs.length > 0
  return <div className="home-page">
    <section className="hero-shell"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-grid" />
      <div className="container hero-content"><div className="hero-copy"><div className="hero-kicker"><span className="live-dot" /> Programmable trust for independent work <NetworkBadge /></div><h1>Good work deserves <em>secure payment.</em></h1><p>Create freelance agreements, lock payments in smart-contract escrow, and release funds when the work is approved. Transparent by design. Secured on Ethereum.</p><div className="hero-actions"><Link className="button button-primary button-large" to="/marketplace">Explore marketplace <ArrowRight size={17} /></Link><a className="button button-secondary button-large" href="#how-it-works">How escrow works <MoveRight size={16} /></a></div><div className="hero-footnote"><Check size={14} /> No mainnet funds required · Sepolia testnet only</div></div>
        <div className="hero-visual"><div className="visual-halo" /><div className="flow-card"><div className="flow-card-head"><span className="eyebrow">Escrow flow</span><span className="flow-live"><span /> Live demo</span></div><div className="flow-row"><div className="flow-avatar avatar-client">C</div><div className="flow-node"><span>Client</span><strong>2.80 ETH</strong></div><div className="flow-connector"><span className="flow-pulse" /></div><div className="flow-lock"><LockKeyhole size={18} /></div><div className="flow-connector right"><span className="flow-pulse" /></div><div className="flow-node align-right"><span>Freelancer</span><strong>Pending approval</strong></div><div className="flow-avatar avatar-freelancer">F</div></div><div className="flow-state"><span className="state-check"><Check size={13} /></span>Payment held by contract <span className="state-divider" /> <span className="state-muted">Job #024</span></div></div><div className="floating-event"><div className="event-icon"><CircleDollarSign size={16} /></div><div><span>Funds secured</span><strong>2.80 ETH</strong></div><div className="event-time">just now</div></div><div className="hero-stat"><span>14</span><small>state changes<br />verified on-chain</small></div></div>
      </div>
      <div className="hero-bottom container"><span>Designed for work that moves at the speed of trust</span><div className="hero-logos"><span>CLIENTS</span><span>FREELANCERS</span><span>ARBITRATORS</span></div></div>
    </section>

    <section className="trust-strip"><div className="container trust-grid"><div className="trust-item"><span className="trust-icon"><LockKeyhole size={18} /></span><div><strong>Funds held by code</strong><span>Payment moves only when the programmed rules allow it.</span></div></div><div className="trust-item"><span className="trust-icon"><Sparkles size={18} /></span><div><strong>State changes you can verify</strong><span>Follow every job on Ethereum Sepolia.</span></div></div><div className="trust-item"><span className="trust-icon"><FileCheck2 size={18} /></span><div><strong>Approval with a clear fallback</strong><span>Either approve completed work or open a dispute.</span></div></div></div></section>

    <section className="section featured-section"><div className="container"><SectionHeading eyebrow="The marketplace" title="Opportunities with a clear next step." copy="Browse live jobs from the Sepolia contract, or use the demo set to understand the experience before you connect a wallet." action={<Link className="text-link" to="/marketplace">View all jobs <ArrowRight size={15} /></Link>} /><div className="section-label"><span>{live ? 'Live opportunities' : 'Demo data'}</span><span>{live ? 'Read from EscrowMarketplace' : 'No live jobs found yet'}</span></div><div className="job-scroll">{featured.map((job) => <JobCard key={job.id} job={job} demo={!live} featured />)}</div></div></section>

    <section className="section workflow-section" id="how-it-works"><div className="container"><SectionHeading eyebrow="A calmer way to collaborate" title="Five states. One shared source of truth." copy="The contract keeps the agreement legible: define the work, commit to it, fund it, submit the deliverable, and make the release decision explicit." /><WorkflowTimeline /></div></section>

    <section className="section showcase-section"><div className="container showcase-grid"><div className="showcase-copy"><div className="eyebrow">The useful middle layer</div><h2>Built around the moments that usually create uncertainty.</h2><p>Escrow does not replace judgment. It gives clients and freelancers a shared sequence of actions that is visible, inspectable, and easier to navigate.</p><Link className="button button-secondary" to="/how-it-works">See the workflow <ArrowRight size={16} /></Link></div><div className="showcase-panels"><div className="showcase-panel panel-primary"><div className="panel-icon"><LockKeyhole size={19} /></div><span className="eyebrow">01 · On-chain escrow</span><h3>The agreed amount moves once.</h3><p>Funding is a separate action from creating a job, so the client stays in control of when ETH enters the contract.</p><div className="panel-line"><span style={{ width: '64%' }} /></div></div><div className="showcase-panel"><div className="panel-icon blue"><FileCheck2 size={19} /></div><span className="eyebrow">02 · Work CID</span><h3>Keep the file off-chain. Keep the proof on-chain.</h3><p>The contract stores a content identifier, not the work itself. Paste an IPFS CID when the deliverable is ready.</p></div></div></div></section>

    <section className="cta-section"><div className="container cta-card"><div><span className="eyebrow">Start with a clear agreement</span><h2>Make the next project feel lighter.</h2><p>Explore open work or create a job in a few minutes. No mainnet funds. No hidden steps.</p></div><div className="cta-actions"><Link to="/marketplace" className="button button-primary">Explore marketplace <ArrowRight size={16} /></Link><Link to="/create-job" className="button button-ghost">Create a job</Link></div></div></section>
  </div>
}
