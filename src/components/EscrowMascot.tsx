import { useId, useState } from 'react'
import './premium-motion.css'

export type EscrowMascotState =
  | 'welcome'
  | 'created'
  | 'funded'
  | 'submitted'
  | 'released'
  | 'disputed'
  | 'pending'
  | 'failed'
  | 'disconnected'

export interface EscrowMascotProps {
  state?: EscrowMascotState
  visible?: boolean
  message?: string
  onDismiss?: () => void
  defaultMuted?: boolean
  onMuteChange?: (muted: boolean) => void
  className?: string
}

const stateCopy: Record<EscrowMascotState, string> = {
  welcome: 'Welcome aboard. Your escrow journey starts here.',
  created: 'Your escrow agreement is ready for the next step.',
  funded: 'Funds are secured. Nice work — the milestone is protected.',
  submitted: 'Submission received. The review window is open.',
  released: 'Milestone released. The mission is complete!',
  disputed: 'A review is in progress. We’ll keep the details visible.',
  pending: 'We’re waiting for the network to confirm this step.',
  failed: 'This step could not finish. Check the transaction and try again.',
  disconnected: 'Connect your wallet to continue the escrow mission.',
}

const eyeOffset: Record<EscrowMascotState, { x: number; y: number }> = {
  welcome: { x: 0, y: 0 },
  created: { x: 0, y: 0 },
  funded: { x: 0, y: -1 },
  submitted: { x: 1, y: 0 },
  released: { x: 0, y: -1 },
  disputed: { x: -1, y: 1 },
  pending: { x: 0, y: 1 },
  failed: { x: -1, y: 1 },
  disconnected: { x: 1, y: 1 },
}

function MuteGlyph({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true" focusable="false">
      <path d="M3.5 8.1v3.8h2.7l3.3 2.6V5.5L6.2 8.1H3.5Z" fill="currentColor" />
      {muted ? <path d="m13.1 7.1 3.8 4.1m0-4.1-3.8 4.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" /> : <path d="M13.1 7.4c1.7 1.4 1.7 3.8 0 5.2m1.9-7.1c2.8 2.4 2.8 6.6 0 9" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.35" />}
    </svg>
  )
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true" focusable="false">
      <path d="m5 5 10 10M15 5 5 15" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  )
}

function ExplorerSvg({ state, muted }: { state: EscrowMascotState; muted: boolean }) {
  const eyes = eyeOffset[state]
  const leftEyeX = 37 + eyes.x
  const rightEyeX = 51 + eyes.x
  const eyeY = 36 + eyes.y
  const worried = state === 'disputed' || state === 'failed' || state === 'disconnected'

  return (
    <svg className="escrow-mascot__avatar" viewBox="0 0 88 100" role="img" aria-label="Small escrow space explorer" focusable="false" data-muted={muted}>
      <path className="escrow-mascot__antenna" d="M44 17V9m0 0 7-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
      <circle className="escrow-mascot__antenna-tip" cx="53" cy="5" r="3" />
      <path className="escrow-mascot__backpack" d="M15 50v24c0 4 3 7 7 7h4V47h-4c-4 0-7 1-7 3Zm58 0v24c0 4-3 7-7 7h-4V47h4c4 0 7 1 7 3Z" />
      <rect className="escrow-mascot__helmet" x="17" y="15" width="54" height="50" rx="22" />
      <rect className="escrow-mascot__visor" x="23" y="25" width="42" height="25" rx="12.5" />
      <circle className="escrow-mascot__eye" cx={leftEyeX} cy={eyeY} r="3.2" />
      <circle className="escrow-mascot__eye" cx={rightEyeX} cy={eyeY} r="3.2" />
      <path className="escrow-mascot__brow" d={worried ? 'M33 30 40 28m8 0 7 2' : 'M33 29 40 30m8 0 7-1'} fill="none" strokeLinecap="round" strokeWidth="1.6" />
      <path className="escrow-mascot__mouth" d={worried ? 'M39 44c3-2 7-2 10 0' : state === 'released' ? 'M39 42c3 4 7 4 10 0' : 'M41 43h6'} fill="none" strokeLinecap="round" strokeWidth="1.7" />
      <path className="escrow-mascot__body" d="M28 63h32l7 25H21l7-25Z" />
      <path className="escrow-mascot__badge" d="m44 68 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.3-4.5 2.3.9-5-3.6-3.5 5-.7L44 68Z" />
      <path className="escrow-mascot__leg" d="M31 87v7m26-7v7" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
    </svg>
  )
}

/** A small, inline SVG escrow guide for contextual page feedback. */
export function EscrowMascot({ state = 'welcome', visible = true, message, onDismiss, defaultMuted = false, onMuteChange, className = '' }: EscrowMascotProps) {
  const [muted, setMuted] = useState(defaultMuted)
  const messageId = useId()

  if (!visible) return null

  const rootClassName = ['escrow-mascot', className].filter(Boolean).join(' ')
  const displayMessage = message ?? stateCopy[state]

  const toggleMuted = () => {
    setMuted((current) => {
      const next = !current
      onMuteChange?.(next)
      return next
    })
  }

  return (
    <aside className={rootClassName} data-state={state} aria-label="Escrow assistant">
      <div className="escrow-mascot__figure">
        <ExplorerSvg state={state} muted={muted} />
      </div>
      <div className="escrow-mascot__bubble" role="status" aria-live={muted ? 'off' : 'polite'}>
        <div className="escrow-mascot__bubble-head">
          <span className="escrow-mascot__eyebrow">ESCROW EXPLORER</span>
          <div className="escrow-mascot__controls">
            <button type="button" className="escrow-mascot__control" onClick={toggleMuted} aria-pressed={muted} aria-label={muted ? 'Unmute mascot feedback' : 'Mute mascot feedback'}>
              <MuteGlyph muted={muted} />
            </button>
            {onDismiss && <button type="button" className="escrow-mascot__control" onClick={onDismiss} aria-label="Dismiss escrow assistant"><CloseGlyph /></button>}
          </div>
        </div>
        <p id={messageId}>{displayMessage}</p>
      </div>
    </aside>
  )
}
