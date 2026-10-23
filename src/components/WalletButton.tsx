import { Check, ChevronDown, Copy, ExternalLink, Link2, WalletCards, X } from 'lucide-react'
import { useState } from 'react'
import { useWallet } from '../hooks/useWallet'
import { NETWORK } from '../types/escrow'
import { shortenAddress } from '../utils/format'

export function WalletButton() {
  const { address, chainId, error, isConnecting, isInstalled, isWrongNetwork, connect, switchNetwork } = useWallet()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!isInstalled) return <a className="button button-small button-ghost" href="https://metamask.io/download/" target="_blank" rel="noreferrer"><WalletCards size={16} /> Install wallet</a>
  if (!address) return <button className="button button-small button-primary" onClick={() => void connect()} disabled={isConnecting}><WalletCards size={16} />{isConnecting ? 'Connecting…' : 'Connect wallet'}</button>
  if (isWrongNetwork) return <button className="button button-small button-warning" onClick={() => void switchNetwork()}>Switch to Sepolia</button>

  const copyAddress = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return <div className="wallet-menu-wrap">
    <button className="wallet-pill" onClick={() => setOpen((value) => !value)} aria-expanded={open}><span className="wallet-dot" />{shortenAddress(address)}<ChevronDown size={15} className={open ? 'rotate-180' : ''} /></button>
    {open && <div className="wallet-menu" role="menu">
      <div className="wallet-menu-head"><div className="eyebrow">Connected wallet</div><button className="icon-button" aria-label="Close wallet menu" onClick={() => setOpen(false)}><X size={15} /></button></div>
      <div className="wallet-address"><span>{shortenAddress(address, 8, 6)}</span><button className="icon-button" aria-label="Copy wallet address" onClick={() => void copyAddress()}>{copied ? <Check size={15} /> : <Copy size={15} />}</button></div>
      <div className="wallet-network"><span className="network-dot" />{NETWORK.name}<span className="wallet-chain">Chain {chainId}</span></div>
      {error && <div className="wallet-error">{error}</div>}
      <a className="wallet-link" href={`${NETWORK.explorer}/address/${address}`} target="_blank" rel="noreferrer">View on Etherscan <ExternalLink size={14} /></a>
      <div className="wallet-note"><Link2 size={14} /> Switch accounts in MetaMask to test as a second wallet. This app never impersonates another signer.</div>
    </div>}
  </div>
}
