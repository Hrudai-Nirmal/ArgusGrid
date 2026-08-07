/**
 * Scroll-replayed SVG stroke text for the signed-out homepage hero.
 */

"use client"

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react"

import "./stroke-text.css"

type StrokeTextTrigger = "mount" | "scroll"
type StrokeTextFillMode = "wipe" | "none"

type StrokeTextProps = {
  text: string
  strokeColor?: string
  fillColor?: string
  strokeWidth?: number
  drawDuration?: number
  fillDelay?: number
  trigger?: StrokeTextTrigger
  fillMode?: StrokeTextFillMode
  fontSize?: number
  fontWeight?: number | string
  letterSpacing?: number
  className?: string
}

/**
 * Renders large SVG text that draws its stroke and wipes in its fill on mount or scroll entry.
 */
export default function StrokeText({
  text,
  strokeColor = "#C4B5FD",
  fillColor = "#D8B4FE",
  strokeWidth = 1.4,
  drawDuration = 1.6,
  fillDelay = 0.2,
  trigger = "mount",
  fillMode = "wipe",
  fontSize = 128,
  fontWeight = 800,
  letterSpacing = -4,
  className,
}: StrokeTextProps) {
  const rootRef = useRef<HTMLSpanElement | null>(null)
  const rawId = useId()
  const clipId = `stroke-text-wipe-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`
  const [replayKey, setReplayKey] = useState(() => (trigger === "mount" ? 1 : 0))

  const metrics = useMemo(() => {
    const estimatedWidth = Math.max(text.length * fontSize * 0.62 + Math.abs(letterSpacing) * text.length, fontSize * 2)
    const height = Math.round(fontSize * 1.24)
    return {
      width: Math.round(estimatedWidth),
      height,
      baseline: Math.round(fontSize * 0.9),
      dash: Math.round(estimatedWidth * 1.8),
    }
  }, [fontSize, letterSpacing, text])

  useEffect(() => {
    if (trigger === "mount") {
      return
    }

    const root = rootRef.current
    if (!root) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setReplayKey((current) => current + 1)
        }
      },
      { threshold: 0.5 },
    )
    observer.observe(root)

    return () => {
      observer.disconnect()
    }
  }, [trigger])

  const style = {
    "--stroke-text-height": `${metrics.height}px`,
    "--stroke-text-dash": metrics.dash,
    "--stroke-text-duration": `${drawDuration}s`,
    "--stroke-text-fill-delay": `${drawDuration + fillDelay}s`,
    "--stroke-text-fill-duration": `${Math.max(0.6, drawDuration * 0.5)}s`,
  } as CSSProperties

  return (
    <span
      ref={rootRef}
      className={["stroke-text", "stroke-text--animate", className].filter(Boolean).join(" ")}
      style={style}
      role="img"
      aria-label={text}
    >
      <svg
        key={replayKey}
        className="stroke-text__svg"
        viewBox={`0 0 ${metrics.width} ${metrics.height}`}
        preserveAspectRatio="xMinYMid meet"
        aria-hidden="true"
      >
        {fillMode === "wipe" ? (
          <defs>
            <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
              <rect className="stroke-text__fill-wipe" x="0" y="0" width={metrics.width} height={metrics.height} />
            </clipPath>
          </defs>
        ) : null}
        <text
          className="stroke-text__stroke"
          x="0"
          y={metrics.baseline}
          fill="none"
          stroke={strokeColor}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
          style={{ fontSize, fontWeight, letterSpacing }}
        >
          {text}
        </text>
        <text
          className="stroke-text__fill"
          x="0"
          y={metrics.baseline}
          fill={fillColor}
          clipPath={fillMode === "wipe" ? `url(#${clipId})` : undefined}
          style={{ fontSize, fontWeight, letterSpacing }}
        >
          {text}
        </text>
      </svg>
    </span>
  )
}
