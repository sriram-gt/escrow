import type { CSSProperties } from 'react'
import './premium-motion.css'

export interface MilestoneCelebrationProps {
  active: boolean
  onDismiss?: () => void
  title?: string
  message?: string
  className?: string
}

const confetti = [
  { left: '8%', top: '24%', color: '#8b7cff', shape: 'square', delay: '0ms', rotation: '-18deg' },
  { left: '16%', top: '8%', color: '#6ea8ff', shape: 'pill', delay: '180ms', rotation: '24deg' },
  { left: '28%', top: '15%', color: '#45d6a0', shape: 'square', delay: '360ms', rotation: '42deg' },
  { left: '42%', top: '4%', color: '#f6c66a', shape: 'pill', delay: '90ms', rotation: '-32deg' },
  { left: '56%', top: '13%', color: '#ff737d', shape: 'square', delay: '270ms', rotation: '16deg' },
  { left: '70%', top: '6%', color: '#8b7cff', shape: 'pill', delay: '450ms', rotation: '-22deg' },
  { left: '84%', top: '23%', color: '#6ea8ff', shape: 'square', delay: '140ms', rotation: '30deg' },
  { left: '92%', top: '45%', color: '#45d6a0', shape: 'pill', delay: '320ms', rotation: '-12deg' },
  { left: '80%', top: '69%', color: '#f6c66a', shape: 'square', delay: '50ms', rotation: '26deg' },
  { left: '61%', top: '82%', color: '#ff737d', shape: 'pill', delay: '230ms', rotation: '-28deg' },
  { left: '38%', top: '87%', color: '#8b7cff', shape: 'square', delay: '410ms', rotation: '10deg' },
  { left: '15%', top: '70%', color: '#6ea8ff', shape: 'pill', delay: '120ms', rotation: '-38deg' },
]

/** A deliberately opt-in, lightweight milestone success accent. */
export function MilestoneCelebration({ active, onDismiss, title = 'Milestone complete', message = 'The escrow mission reached a successful checkpoint.', className = '' }: MilestoneCelebrationProps) {
  if (!active) return null

  const rootClassName = ['milestone-celebration', className].filter(Boolean).join(' ')

  return (
    <section className={rootClassName} role="status" aria-live="polite" aria-label="Milestone celebration">
      <div className="milestone-celebration__sparkles" aria-hidden="true">
        {confetti.map((piece, index) => {
          const style = {
            left: piece.left,
            top: piece.top,
            backgroundColor: piece.color,
            animationDelay: piece.delay,
            '--milestone-rotation': piece.rotation,
          } as CSSProperties

          return <span key={`${piece.left}-${piece.top}-${index}`} className={`milestone-celebration__confetti milestone-celebration__confetti--${piece.shape}`} style={style} />
        })}
        <span className="milestone-celebration__star milestone-celebration__star--one">✦</span>
        <span className="milestone-celebration__star milestone-celebration__star--two">✦</span>
        <span className="milestone-celebration__star milestone-celebration__star--three">✦</span>
      </div>
      <div className="milestone-celebration__content">
        <span className="milestone-celebration__kicker">CHECKPOINT VERIFIED</span>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      {onDismiss && <button type="button" className="milestone-celebration__dismiss" onClick={onDismiss} aria-label="Dismiss milestone celebration">Dismiss</button>}
    </section>
  )
}
