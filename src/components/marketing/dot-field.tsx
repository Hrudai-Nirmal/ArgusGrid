/**
 * Interactive canvas dot field used as the public homepage hero background.
 */

"use client"

import { memo, useEffect, useId, useRef } from "react"

import "./dot-field.css"

const TWO_PI = Math.PI * 2

interface Dot {
  ax: number
  ay: number
  sx: number
  sy: number
  vx: number
  vy: number
  x: number
  y: number
}

interface DotFieldProps {
  dotRadius?: number
  dotSpacing?: number
  cursorRadius?: number
  cursorForce?: number
  bulgeOnly?: boolean
  bulgeStrength?: number
  glowRadius?: number
  sparkle?: boolean
  waveAmplitude?: number
  gradientFrom?: string
  gradientTo?: string
  glowColor?: string
}

/**
 * Renders a cursor-reactive dot field without exposing app data or network calls.
 */
const DotField = memo(function DotField({
  dotRadius = 1.5,
  dotSpacing = 14,
  cursorRadius = 500,
  cursorForce = 0.1,
  bulgeOnly = true,
  bulgeStrength = 67,
  glowRadius = 160,
  sparkle = false,
  waveAmplitude = 0,
  gradientFrom = "rgba(168, 85, 247, 0.35)",
  gradientTo = "rgba(180, 151, 207, 0.25)",
  glowColor = "#120F17",
}: DotFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glowRef = useRef<SVGCircleElement>(null)
  const dotsRef = useRef<Dot[]>([])
  const mouseRef = useRef({ x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 })
  const rafRef = useRef<number | null>(null)
  const sizeRef = useRef({ w: 0, h: 0, offsetX: 0, offsetY: 0 })
  const glowOpacityRef = useRef(0)
  const engagementRef = useRef(0)
  const rebuildRef = useRef<(() => void) | null>(null)
  const reactId = useId()
  const glowId = `dot-field-glow-${reactId.replace(/:/g, "")}`
  const propsRef = useRef({
    dotRadius,
    dotSpacing,
    cursorRadius,
    cursorForce,
    bulgeOnly,
    bulgeStrength,
    sparkle,
    waveAmplitude,
    gradientFrom,
    gradientTo,
  })

  propsRef.current = {
    dotRadius,
    dotSpacing,
    cursorRadius,
    cursorForce,
    bulgeOnly,
    bulgeStrength,
    sparkle,
    waveAmplitude,
    gradientFrom,
    gradientTo,
  }

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    const glowEl = glowRef.current
    if (!container || !canvas) return

    const context = canvas.getContext("2d", { alpha: true })
    if (!context) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let resizeTimer: ReturnType<typeof setTimeout> | null = null

    const buildDots = (width: number, height: number) => {
      const currentProps = propsRef.current
      const step = currentProps.dotRadius + currentProps.dotSpacing
      const cols = Math.floor(width / step)
      const rows = Math.floor(height / step)
      const padX = (width % step) / 2
      const padY = (height % step) / 2
      const dots: Dot[] = new Array(rows * cols)
      let index = 0

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const ax = padX + col * step + step / 2
          const ay = padY + row * step + step / 2
          dots[index] = { ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay }
          index += 1
        }
      }

      dotsRef.current = dots
    }

    const doResize = () => {
      const rect = container.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      sizeRef.current = {
        w: width,
        h: height,
        offsetX: rect.left + window.scrollX,
        offsetY: rect.top + window.scrollY,
      }

      buildDots(width, height)
    }

    const resize = () => {
      if (resizeTimer) clearTimeout(resizeTimer)
      resizeTimer = setTimeout(doResize, 100)
    }

    const onMouseMove = (event: MouseEvent) => {
      const size = sizeRef.current
      mouseRef.current.x = event.pageX - size.offsetX
      mouseRef.current.y = event.pageY - size.offsetY
    }

    const updateMouseSpeed = () => {
      const mouse = mouseRef.current
      const dx = mouse.prevX - mouse.x
      const dy = mouse.prevY - mouse.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      mouse.speed += (distance - mouse.speed) * 0.5
      if (mouse.speed < 0.001) mouse.speed = 0
      mouse.prevX = mouse.x
      mouse.prevY = mouse.y
    }

    const speedInterval = window.setInterval(updateMouseSpeed, 20)
    let frameCount = 0

    const tick = () => {
      frameCount += 1
      const dots = dotsRef.current
      const mouse = mouseRef.current
      const { w, h } = sizeRef.current
      const currentProps = propsRef.current
      const animationTime = frameCount * 0.02

      const targetEngagement = Math.min(mouse.speed / 5, 1)
      engagementRef.current += (targetEngagement - engagementRef.current) * 0.06
      if (engagementRef.current < 0.001) engagementRef.current = 0

      glowOpacityRef.current += (engagementRef.current - glowOpacityRef.current) * 0.08
      if (glowEl) {
        glowEl.setAttribute("cx", String(mouse.x))
        glowEl.setAttribute("cy", String(mouse.y))
        glowEl.style.opacity = String(glowOpacityRef.current)
      }

      context.clearRect(0, 0, w, h)
      const gradient = context.createLinearGradient(0, 0, w, h)
      gradient.addColorStop(0, currentProps.gradientFrom)
      gradient.addColorStop(1, currentProps.gradientTo)
      context.fillStyle = gradient
      context.beginPath()

      const cursorRadiusSquared = currentProps.cursorRadius * currentProps.cursorRadius
      const radius = currentProps.dotRadius / 2

      for (let index = 0; index < dots.length; index += 1) {
        const dot = dots[index]
        const dx = mouse.x - dot.ax
        const dy = mouse.y - dot.ay
        const distanceSquared = dx * dx + dy * dy

        if (distanceSquared < cursorRadiusSquared && engagementRef.current > 0.01) {
          const distance = Math.sqrt(distanceSquared)
          if (currentProps.bulgeOnly) {
            const t = 1 - distance / currentProps.cursorRadius
            const push = t * t * currentProps.bulgeStrength * engagementRef.current
            const angle = Math.atan2(dy, dx)
            dot.sx += (dot.ax - Math.cos(angle) * push - dot.sx) * 0.15
            dot.sy += (dot.ay - Math.sin(angle) * push - dot.sy) * 0.15
          } else {
            const angle = Math.atan2(dy, dx)
            const move = (500 / Math.max(distance, 1)) * (mouse.speed * currentProps.cursorForce)
            dot.vx += Math.cos(angle) * -move
            dot.vy += Math.sin(angle) * -move
          }
        } else if (currentProps.bulgeOnly) {
          dot.sx += (dot.ax - dot.sx) * 0.1
          dot.sy += (dot.ay - dot.sy) * 0.1
        }

        if (!currentProps.bulgeOnly) {
          dot.vx *= 0.9
          dot.vy *= 0.9
          dot.x = dot.ax + dot.vx
          dot.y = dot.ay + dot.vy
          dot.sx += (dot.x - dot.sx) * 0.1
          dot.sy += (dot.y - dot.sy) * 0.1
        }

        let drawX = dot.sx
        let drawY = dot.sy
        if (currentProps.waveAmplitude > 0) {
          drawY += Math.sin(dot.ax * 0.03 + animationTime) * currentProps.waveAmplitude
          drawX += Math.cos(dot.ay * 0.03 + animationTime * 0.7) * currentProps.waveAmplitude * 0.5
        }

        if (currentProps.sparkle) {
          const hash = ((index * 2654435761) ^ (frameCount >> 3)) >>> 0
          const sparkleRadius = hash % 100 < 3 ? radius * 1.8 : radius
          context.moveTo(drawX + sparkleRadius, drawY)
          context.arc(drawX, drawY, sparkleRadius, 0, TWO_PI)
        } else {
          context.moveTo(drawX + radius, drawY)
          context.arc(drawX, drawY, radius, 0, TWO_PI)
        }
      }

      context.fill()
      rafRef.current = requestAnimationFrame(tick)
    }

    doResize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    window.addEventListener("resize", resize)
    window.addEventListener("mousemove", onMouseMove, { passive: true })
    rafRef.current = requestAnimationFrame(tick)

    rebuildRef.current = () => {
      const { w, h } = sizeRef.current
      if (w > 0 && h > 0) buildDots(w, h)
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      resizeObserver.disconnect()
      window.clearInterval(speedInterval)
      if (resizeTimer) clearTimeout(resizeTimer)
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", onMouseMove)
    }
  }, [])

  useEffect(() => {
    rebuildRef.current?.()
  }, [dotRadius, dotSpacing])

  return (
    <div ref={containerRef} className="dot-field-container" aria-hidden="true">
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <defs>
          <radialGradient id={glowId}>
            <stop offset="0%" stopColor={glowColor} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle
          ref={glowRef}
          cx="-9999"
          cy="-9999"
          r={glowRadius}
          fill={`url(#${glowId})`}
          style={{ opacity: 0, willChange: "opacity" }}
        />
      </svg>
    </div>
  )
})

export default DotField
