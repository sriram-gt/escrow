import { ArrowUpRight, Github, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CONTRACT_EXPLORER_URL, NETWORK } from '../types/escrow'

export function Footer() {
  return <footer className="site-footer"><div className="footer-grid">
    <div><Link to="/" className="brand"><span className="brand-mark"><span /></span><span>Escrow</span></Link><p className="footer-copy">A clearer way to work together when payment matters.</p><div className="footer-network"><ShieldCheck size={15} /> Ethereum Sepolia · Testnet</div></div>
    <div className="footer-links"><div><div className="eyebrow">Explore</div><Link to="/marketplace">Marketplace</Link><Link to="/how-it-works">How it works</Link><Link to="/create-job">Create a job</Link></div><div><div className="eyebrow">On-chain</div><a href={CONTRACT_EXPLORER_URL} target="_blank" rel="noreferrer">Contract <ArrowUpRight size={14} /></a><a href={`${NETWORK.explorer}/`} target="_blank" rel="noreferrer">Sepolia explorer <ArrowUpRight size={14} /></a><a href="https://github.com/" target="_blank" rel="noreferrer"><Github size={14} /> Source repository</a></div></div>
  </div><div className="footer-bottom"><span>Built for transparent collaboration.</span><span>Testnet only · Never send mainnet funds.</span></div></footer>
}
