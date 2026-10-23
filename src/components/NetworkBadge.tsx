import { Radio } from 'lucide-react'
import { NETWORK } from '../types/escrow'

export function NetworkBadge() {
  return <span className="network-badge"><Radio size={13} aria-hidden="true" /> {NETWORK.name} <span>· Testnet</span></span>
}
