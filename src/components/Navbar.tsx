import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { NetworkBadge } from './NetworkBadge'
import { WalletButton } from './WalletButton'

const links = [
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/create-job', label: 'For clients' },
  { to: '/dashboard', label: 'For freelancers' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  return <header className="site-nav">
    <div className="nav-inner">
      <Link to="/" className="brand" onClick={() => setOpen(false)}><span className="brand-mark"><span /></span><span>Escrow</span></Link>
      <nav className={`nav-links ${open ? 'nav-open' : ''}`} aria-label="Main navigation">
        {links.map((link) => <NavLink key={link.to} to={link.to} className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setOpen(false)}>{link.label}</NavLink>)}
        <div className="nav-mobile-wallet"><NetworkBadge /><WalletButton /></div>
      </nav>
      <div className="nav-actions"><NetworkBadge /><WalletButton /><button className="menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((value) => !value)}>{open ? <X size={21} /> : <Menu size={21} />}</button></div>
    </div>
  </header>
}
