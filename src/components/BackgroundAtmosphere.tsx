import { useEffect, useRef, type ReactNode } from 'react'
import './premium-motion.css'

export interface BackgroundAtmosphereProps {
  children?: ReactNode
  className?: string
  /** Enables a small pointer-following shift on fine-pointer devices. */
  pointerParallax?: boolean
}

/**
 * A decorative atmosphere layer that can wrap any page content without
 * changing the content's layout or adding an image dependency.
 */
export function BackgroundAtmosphere({ children, className = '', pointerParallax = false }: BackgroundAtmosphereProps) {
  const atmosphereRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const atmosphere = atmosphereRef.current
    if (!atmosphere || !pointerParallax || typeof window === 'undefined') return

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const finePointer = window.matchMedia?.('(pointer: fine)').matches ?? true
    if (reducedMotion || !finePointer) return

    const setParallax = (x: number, y: number) => {
      atmosphere.style.setProperty('--atmosphere-pointer-x', `${x.toFixed(2)}px`)
      atmosphere.style.setProperty('--atmosphere-pointer-y', `${y.toFixed(2)}px`)
      atmosphere.style.setProperty('--atmosphere-grid-x', `${(x * -0.25).toFixed(2)}px`)
      atmosphere.style.setProperty('--atmosphere-grid-y', `${(y * -0.25).toFixed(2)}px`)
      atmosphere.style.setProperty('--atmosphere-network-x', `${(x * 0.4).toFixed(2)}px`)
      atmosphere.style.setProperty('--atmosphere-network-y', `${(y * 0.4).toFixed(2)}px`)
      atmosphere.style.setProperty('--atmosphere-orbs-x', `${(x * 0.65).toFixed(2)}px`)
      atmosphere.style.setProperty('--atmosphere-orbs-y', `${(y * 0.65).toFixed(2)}px`)
    }

    const resetParallax = () => setParallax(0, 0)

    const handlePointerMove = (event: PointerEvent) => {
      const x = ((event.clientX / Math.max(window.innerWidth, 1)) - 0.5) * 18
      const y = ((event.clientY / Math.max(window.innerHeight, 1)) - 0.5) * 12
      setParallax(x, y)
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('blur', resetParallax)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('blur', resetParallax)
      resetParallax()
    }
  }, [pointerParallax])

  const rootClassName = ['background-atmosphere', className].filter(Boolean).join(' ')

  return (
    <div ref={atmosphereRef} className={rootClassName}>
      <div className="background-atmosphere__canvas" aria-hidden="true">
        <div className="background-atmosphere__wash" />
        <div className="background-atmosphere__grid" />
        <svg className="background-atmosphere__network" viewBox="0 0 1200 800" preserveAspectRatio="none">
          <path d="M-40 190 C180 120 245 280 420 205 S725 80 890 184 S1100 270 1240 126" />
          <path d="M-55 590 C180 486 290 690 490 560 S790 426 990 560 S1134 634 1246 520" />
          <path d="M176 -30 C210 160 340 242 294 420 S290 650 435 830" />
          <path d="M970 -30 C900 182 1050 248 962 416 S1008 646 876 830" />
          <circle cx="294" cy="420" r="4" />
          <circle cx="962" cy="416" r="4" />
          <circle cx="490" cy="560" r="3" />
          <circle cx="890" cy="184" r="3" />
        </svg>
        <div className="background-atmosphere__orbs">
          <span className="background-atmosphere__orb background-atmosphere__orb--violet" />
          <span className="background-atmosphere__orb background-atmosphere__orb--blue" />
          <span className="background-atmosphere__orb background-atmosphere__orb--green" />
          <span className="background-atmosphere__spark background-atmosphere__spark--one" />
          <span className="background-atmosphere__spark background-atmosphere__spark--two" />
          <span className="background-atmosphere__spark background-atmosphere__spark--three" />
        </div>
      </div>
      <div className="background-atmosphere__content">{children}</div>
    </div>
  )
}
