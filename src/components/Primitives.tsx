import { AlertCircle, ArrowLeft, LoaderCircle, RefreshCcw, SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'

export function SectionHeading({ eyebrow, title, copy, action }: { eyebrow?: string; title: string; copy?: string; action?: React.ReactNode }) {
  return <div className="section-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h2>{title}</h2>{copy && <p>{copy}</p>}</div>{action}</div>
}

export function LoadingState({ label = 'Reading from Sepolia…' }: { label?: string }) {
  return <div className="state-card"><LoaderCircle className="spin" size={24} /><strong>{label}</strong><span>On-chain data can take a moment to arrive.</span></div>
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="state-card state-error"><AlertCircle size={24} /><strong>We couldn’t load this view.</strong><span>{message}</span>{onRetry && <button className="button button-small button-ghost" onClick={onRetry}><RefreshCcw size={15} /> Try again</button>}</div>
}

export function EmptyState({ title = 'Nothing here yet', copy = 'When an on-chain record appears, it will show up here.', action }: { title?: string; copy?: string; action?: React.ReactNode }) {
  return <div className="state-card"><SearchX size={24} /><strong>{title}</strong><span>{copy}</span>{action}</div>
}

export function BackLink({ to = '/marketplace', label = 'Back to marketplace' }: { to?: string; label?: string }) {
  return <Link to={to} className="back-link"><ArrowLeft size={15} /> {label}</Link>
}
