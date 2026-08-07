/**
 * Cursor-reactive border glow wrapper for Meridian marketing cards.
 */

"use client"

import { useCallback, useEffect, useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react"

import { cn } from "@/lib/utils"

import "./border-glow.css"

type BorderGlowProps = {
  children?: ReactNode
  className?: string
  edgeSensitivity?: number
  glowColor?: string
  backgroundColor?: string
  borderRadius?: number
  glowRadius?: number
  glowIntensity?: number
  coneSpread?: number
  animated?: boolean
  colors?: string[]
  fillOpacity?: number
}

type HslColor = {
  h: number
  s: number
  l: number
}

const GRADIENT_POSITIONS = ["80% 55%", "69% 34%", "8% 6%", "41% 38%", "86% 85%", "82% 18%", "51% 4%"]
const GRADIENT_KEYS = ["--gradient-one", "--gradient-two", "--gradient-three", "--gradient-four", "--gradient-five", "--gradient-six", "--gradient-seven"]
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1]

function parseHsl(glowColor: string): HslColor {
  const match = glowColor.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/)
  if (!match) return { h: 40, s: 80, l: 80 }
  return {
    h: Number.parseFloat(match[1] ?? "40"),
    s: Number.parseFloat(match[2] ?? "80"),
    l: Number.parseFloat(match[3] ?? "80"),
  }
}

function buildGlowVars(glowColor: string, intensity: number): Record<string, string> {
  const { h, s, l } = parseHsl(glowColor)
  const base = `${h}deg ${s}% ${l}%`
  const opacities = [100, 60, 50, 40, 30, 20, 10]
  const keys = ["", "-60", "-50", "-40", "-30", "-20", "-10"]
  const vars: Record<string, string> = {}

  for (let index = 0; index < opacities.length; index += 1) {
    vars[`--glow-color${keys[index]}`] = `hsl(${base} / ${Math.min(opacities[index] * intensity, 100)}%)`
  }

  return vars
}

function buildGradientVars(colors: string[]): Record<string, string> {
  const fallbackColors = colors.length > 0 ? colors : ["#c084fc", "#f472b6", "#38bdf8"]
  const vars: Record<string, string> = {}

  for (let index = 0; index < GRADIENT_KEYS.length; index += 1) {
    const color = fallbackColors[Math.min(COLOR_MAP[index], fallbackColors.length - 1)] ?? fallbackColors[0]
    vars[GRADIENT_KEYS[index]] = `radial-gradient(at ${GRADIENT_POSITIONS[index]}, ${color} 0px, transparent 50%)`
  }

  vars["--gradient-base"] = `linear-gradient(${fallbackColors[0]} 0 100%)`
  return vars
}

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3
}

function easeInCubic(value: number) {
  return value ** 3
}

type AnimateOptions = {
  start?: number
  end?: number
  duration?: number
  delay?: number
  ease?: (value: number) => number
  onUpdate: (value: number) => void
  onEnd?: () => void
}

function animateValue({ start = 0, end = 100, duration = 1000, delay = 0, ease = easeOutCubic, onUpdate, onEnd }: AnimateOptions) {
  const startTime = performance.now() + delay

  function tick() {
    const elapsed = performance.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    onUpdate(start + (end - start) * ease(progress))

    if (progress < 1) {
      window.requestAnimationFrame(tick)
      return
    }

    onEnd?.()
  }

  window.setTimeout(() => window.requestAnimationFrame(tick), delay)
}

/**
 * Wraps major homepage cards with a subtle edge-aware glow.
 */
export default function BorderGlow({
  children,
  className,
  edgeSensitivity = 30,
  glowColor = "40 80 80",
  backgroundColor = "#120F17",
  borderRadius = 28,
  glowRadius = 40,
  glowIntensity = 1,
  coneSpread = 25,
  animated = false,
  colors = ["#A855F7", "#B497CF", "#7C3AED"],
  fillOpacity = 0.42,
}: BorderGlowProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const getCenterOfElement = useCallback((element: HTMLElement) => {
    const { width, height } = element.getBoundingClientRect()
    return [width / 2, height / 2]
  }, [])

  const getEdgeProximity = useCallback(
    (element: HTMLElement, x: number, y: number) => {
      const [centerX, centerY] = getCenterOfElement(element)
      const deltaX = x - centerX
      const deltaY = y - centerY
      const scaleX = deltaX === 0 ? Number.POSITIVE_INFINITY : centerX / Math.abs(deltaX)
      const scaleY = deltaY === 0 ? Number.POSITIVE_INFINITY : centerY / Math.abs(deltaY)

      return Math.min(Math.max(1 / Math.min(scaleX, scaleY), 0), 1)
    },
    [getCenterOfElement],
  )

  const getCursorAngle = useCallback(
    (element: HTMLElement, x: number, y: number) => {
      const [centerX, centerY] = getCenterOfElement(element)
      const deltaX = x - centerX
      const deltaY = y - centerY
      if (deltaX === 0 && deltaY === 0) return 0

      const degrees = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90
      return degrees < 0 ? degrees + 360 : degrees
    },
    [getCenterOfElement],
  )

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const card = cardRef.current
      if (!card) return

      const rect = card.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      card.style.setProperty("--edge-proximity", `${(getEdgeProximity(card, x, y) * 100).toFixed(3)}`)
      card.style.setProperty("--cursor-angle", `${getCursorAngle(card, x, y).toFixed(3)}deg`)
    },
    [getCursorAngle, getEdgeProximity],
  )

  useEffect(() => {
    if (!animated || !cardRef.current) return
    const card = cardRef.current
    const angleStart = 110
    const angleEnd = 465

    card.classList.add("sweep-active")
    card.style.setProperty("--cursor-angle", `${angleStart}deg`)
    animateValue({ duration: 500, onUpdate: (value) => card.style.setProperty("--edge-proximity", `${value}`) })
    animateValue({
      duration: 1500,
      end: 50,
      ease: easeInCubic,
      onUpdate: (value) => card.style.setProperty("--cursor-angle", `${(angleEnd - angleStart) * (value / 100) + angleStart}deg`),
    })
    animateValue({
      delay: 1500,
      duration: 2250,
      start: 50,
      end: 100,
      ease: easeOutCubic,
      onUpdate: (value) => card.style.setProperty("--cursor-angle", `${(angleEnd - angleStart) * (value / 100) + angleStart}deg`),
    })
    animateValue({
      delay: 2500,
      duration: 1500,
      start: 100,
      end: 0,
      ease: easeInCubic,
      onUpdate: (value) => card.style.setProperty("--edge-proximity", `${value}`),
      onEnd: () => card.classList.remove("sweep-active"),
    })
  }, [animated])

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      className={cn("border-glow-card", className)}
      style={
        {
          "--card-bg": backgroundColor,
          "--edge-sensitivity": edgeSensitivity,
          "--border-radius": `${borderRadius}px`,
          "--glow-padding": `${glowRadius}px`,
          "--cone-spread": coneSpread,
          "--fill-opacity": fillOpacity,
          ...buildGlowVars(glowColor, glowIntensity),
          ...buildGradientVars(colors),
        } as CSSProperties
      }
    >
      <span className="edge-light" />
      <div className="border-glow-inner">{children}</div>
    </div>
  )
}
