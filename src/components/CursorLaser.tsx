import { useEffect, useRef } from 'react'
import './cursor-laser.css'

/**
 * A decorative pointer-following laser that updates DOM styles directly so
 * pointer movement never causes React renders.
 */
export function CursorLaser() {
  const laserRef = useRef<HTMLDivElement>(null)
  const pointRef = useRef<HTMLSpanElement>(null)
  const trailRef = useRef<HTMLSpanElement>(null)
  const glowRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const laser = laserRef.current
    const point = pointRef.current
    const trail = trailRef.current
    const glow = glowRef.current

    if (!laser || !point || !trail || !glow || typeof window === 'undefined' || typeof document === 'undefined') return

    let frameId: number | null = null
    let enabled = false
    let hidden = document.hidden
    let hasPointer = false
    let targetX = 0
    let targetY = 0
    let headX = 0
    let headY = 0
    let tailX = 0
    let tailY = 0
    let lastMoveAt = 0

    const requestFrame = typeof window.requestAnimationFrame === 'function'
      ? window.requestAnimationFrame.bind(window)
      : null
    const cancelFrame = typeof window.cancelAnimationFrame === 'function'
      ? window.cancelAnimationFrame.bind(window)
      : null

    if (!requestFrame || !cancelFrame) {
      laser.dataset.disabled = 'true'
      return
    }

    const finePointerQuery = typeof window.matchMedia === 'function'
      ? window.matchMedia('(pointer: fine)')
      : null
    const reducedMotionQuery = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null
    const fallbackFinePointer = typeof navigator === 'undefined' || (navigator.maxTouchPoints ?? 0) === 0

    const cancelAnimation = () => {
      if (frameId !== null) {
        cancelFrame(frameId)
        frameId = null
      }
    }

    const hideLaser = () => {
      cancelAnimation()
      laser.dataset.active = 'false'
      point.style.opacity = '0'
      trail.style.opacity = '0'
      glow.style.opacity = '0'
    }

    const render = (now: number) => {
      frameId = null
      if (!enabled || hidden || !hasPointer) return

      headX += (targetX - headX) * 0.32
      headY += (targetY - headY) * 0.32
      tailX += (headX - tailX) * 0.14
      tailY += (headY - tailY) * 0.14

      const deltaX = headX - tailX
      const deltaY = headY - tailY
      const distance = Math.hypot(deltaX, deltaY)
      const idleFor = now - lastMoveAt
      const idleOpacity = Math.max(0, 1 - Math.max(0, idleFor - 120) / 420)
      const angle = Math.atan2(deltaY, deltaX)

      point.style.transform = `translate3d(${headX.toFixed(2)}px, ${headY.toFixed(2)}px, 0) translate(-50%, -50%)`
      glow.style.transform = `translate3d(${headX.toFixed(2)}px, ${headY.toFixed(2)}px, 0) translate(-50%, -50%)`
      trail.style.width = `${Math.min(distance, 220).toFixed(2)}px`
      trail.style.transform = `translate3d(${tailX.toFixed(2)}px, ${tailY.toFixed(2)}px, 0) rotate(${angle}rad)`
      trail.style.opacity = String(Math.min(1, distance / 24) * idleOpacity)
      point.style.opacity = '1'
      glow.style.opacity = String(0.62 * Math.max(0.35, idleOpacity))

      if (distance > 0.15 || idleFor < 500) {
        frameId = requestFrame(render)
      } else {
        trail.style.opacity = '0'
      }
    }

    const scheduleAnimation = () => {
      if (frameId === null && enabled && !hidden && hasPointer) frameId = requestFrame(render)
    }

    const setEnabled = (nextEnabled: boolean) => {
      enabled = nextEnabled
      laser.dataset.disabled = nextEnabled ? 'false' : 'true'

      if (!nextEnabled) {
        hideLaser()
        return
      }

      laser.dataset.hidden = hidden ? 'true' : 'false'
      if (hasPointer && !hidden) scheduleAnimation()
    }

    const syncEnabled = () => {
      const finePointer = finePointerQuery?.matches ?? fallbackFinePointer
      const reducedMotion = reducedMotionQuery?.matches ?? false
      setEnabled(finePointer && !reducedMotion)
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!enabled || hidden || event.pointerType === 'touch') return

      const firstPointer = !hasPointer
      targetX = event.clientX
      targetY = event.clientY
      if (firstPointer) {
        headX = targetX
        headY = targetY
        tailX = targetX
        tailY = targetY
      }

      hasPointer = true
      lastMoveAt = typeof window.performance?.now === 'function' ? window.performance.now() : Date.now()
      laser.dataset.active = 'true'
      laser.dataset.hidden = 'false'
      scheduleAnimation()
    }

    const handleVisibilityChange = () => {
      hidden = document.hidden
      laser.dataset.hidden = hidden ? 'true' : 'false'
      if (hidden) {
        hideLaser()
      } else if (enabled && hasPointer) {
        laser.dataset.active = 'true'
        scheduleAnimation()
      }
    }

    const addMediaListener = (query: MediaQueryList | null) => {
      if (!query) return () => undefined

      if (typeof query.addEventListener === 'function') {
        query.addEventListener('change', syncEnabled)
        return () => query.removeEventListener('change', syncEnabled)
      }

      query.addListener(syncEnabled)
      return () => query.removeListener(syncEnabled)
    }

    try {
      laser.dataset.active = 'false'
      laser.dataset.hidden = hidden ? 'true' : 'false'
      syncEnabled()

      const removeFinePointerListener = addMediaListener(finePointerQuery)
      const removeReducedMotionListener = addMediaListener(reducedMotionQuery)
      window.addEventListener('pointermove', handlePointerMove, { passive: true })
      document.addEventListener('visibilitychange', handleVisibilityChange)

      return () => {
        cancelAnimation()
        removeFinePointerListener()
        removeReducedMotionListener()
        window.removeEventListener('pointermove', handlePointerMove)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    } catch {
      cancelAnimation()
      laser.dataset.disabled = 'true'
    }
  }, [])

  return (
    <div ref={laserRef} className="cursor-laser" data-active="false" aria-hidden="true">
      <span ref={glowRef} className="cursor-laser__glow" />
      <span ref={trailRef} className="cursor-laser__trail" />
      <span ref={pointRef} className="cursor-laser__point" />
    </div>
  )
}
