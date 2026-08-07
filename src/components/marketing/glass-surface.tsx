/**
 * SVG-backed liquid glass surface used by the signed-out homepage header.
 */

"use client"

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react"

import { cn } from "@/lib/utils"

import "./glass-surface.css"

type ColorChannel = "R" | "G" | "B"

type GlassBlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity"
  | "plus-darker"
  | "plus-lighter"

export type GlassSurfaceProps = {
  children?: ReactNode
  width?: number | string
  height?: number | string
  borderRadius?: number
  borderWidth?: number
  brightness?: number
  opacity?: number
  blur?: number
  displace?: number
  backgroundOpacity?: number
  saturation?: number
  distortionScale?: number
  redOffset?: number
  greenOffset?: number
  blueOffset?: number
  xChannel?: ColorChannel
  yChannel?: ColorChannel
  mixBlendMode?: GlassBlendMode
  className?: string
  style?: CSSProperties
}

type GlassSurfaceStyle = CSSProperties & Record<`--${string}`, string | number>

function supportsSvgFilters(filterId: string) {
  if (typeof window === "undefined" || typeof document === "undefined") return false

  const isWebkit = /Safari/.test(window.navigator.userAgent) && !/Chrome/.test(window.navigator.userAgent)
  const isFirefox = /Firefox/.test(window.navigator.userAgent)
  if (isWebkit || isFirefox) return false

  const div = document.createElement("div")
  div.style.backdropFilter = `url(#${filterId})`
  return div.style.backdropFilter !== ""
}

function getCssLength(value: number | string) {
  return typeof value === "number" ? `${value}px` : value
}

/**
 * Renders a liquid-glass panel with an SVG filter when supported and a CSS fallback otherwise.
 */
export default function GlassSurface({
  children,
  width = 200,
  height = 80,
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.93,
  blur = 11,
  displace = 0,
  backgroundOpacity = 0,
  saturation = 1,
  distortionScale = -180,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  xChannel = "R",
  yChannel = "G",
  mixBlendMode = "difference",
  className,
  style,
}: GlassSurfaceProps) {
  const reactId = useId().replace(/:/g, "")
  const filterId = `glass-filter-${reactId}`
  const redGradientId = `red-grad-${reactId}`
  const blueGradientId = `blue-grad-${reactId}`
  const [isSvgSupported, setIsSvgSupported] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const feImageRef = useRef<SVGFEImageElement>(null)
  const redChannelRef = useRef<SVGFEDisplacementMapElement>(null)
  const greenChannelRef = useRef<SVGFEDisplacementMapElement>(null)
  const blueChannelRef = useRef<SVGFEDisplacementMapElement>(null)
  const gaussianBlurRef = useRef<SVGFEGaussianBlurElement>(null)

  const generateDisplacementMap = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect()
    const actualWidth = rect?.width || 400
    const actualHeight = rect?.height || 80
    const edgeSize = Math.min(actualWidth, actualHeight) * (borderWidth * 0.5)

    const svgContent = `
      <svg viewBox="0 0 ${actualWidth} ${actualHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradientId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${blueGradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" fill="black"></rect>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${redGradientId})" />
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${blueGradientId})" style="mix-blend-mode: ${mixBlendMode}" />
        <rect x="${edgeSize}" y="${edgeSize}" width="${actualWidth - edgeSize * 2}" height="${actualHeight - edgeSize * 2}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)" />
      </svg>
    `

    return `data:image/svg+xml,${encodeURIComponent(svgContent)}`
  }, [blueGradientId, blur, borderRadius, borderWidth, brightness, mixBlendMode, opacity, redGradientId])

  const updateDisplacementMap = useCallback(() => {
    feImageRef.current?.setAttribute("href", generateDisplacementMap())
  }, [generateDisplacementMap])

  useEffect(() => {
    updateDisplacementMap()
    for (const { ref, offset } of [
      { ref: redChannelRef, offset: redOffset },
      { ref: greenChannelRef, offset: greenOffset },
      { ref: blueChannelRef, offset: blueOffset },
    ]) {
      if (!ref.current) continue
      ref.current.setAttribute("scale", (distortionScale + offset).toString())
      ref.current.setAttribute("xChannelSelector", xChannel)
      ref.current.setAttribute("yChannelSelector", yChannel)
    }

    gaussianBlurRef.current?.setAttribute("stdDeviation", displace.toString())
  }, [blueOffset, displace, distortionScale, greenOffset, redOffset, updateDisplacementMap, xChannel, yChannel])

  useEffect(() => {
    let isMounted = true
    const frameId = window.requestAnimationFrame(() => {
      if (isMounted) setIsSvgSupported(supportsSvgFilters(filterId))
    })

    return () => {
      isMounted = false
      window.cancelAnimationFrame(frameId)
    }
  }, [filterId])

  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      window.setTimeout(updateDisplacementMap, 0)
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [updateDisplacementMap])

  const containerStyle: GlassSurfaceStyle = {
    ...style,
    width: getCssLength(width),
    height: getCssLength(height),
    borderRadius: `${borderRadius}px`,
    "--glass-frost": backgroundOpacity,
    "--glass-saturation": saturation,
    "--filter-id": `url(#${filterId})`,
  }

  return (
    <div
      ref={containerRef}
      className={cn("glass-surface", isSvgSupported ? "glass-surface--svg" : "glass-surface--fallback", className)}
      style={containerStyle}
    >
      <svg className="glass-surface__filter" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
            <feImage ref={feImageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
            <feDisplacementMap ref={redChannelRef} in="SourceGraphic" in2="map" result="dispRed" />
            <feColorMatrix
              in="dispRed"
              type="matrix"
              values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"
              result="red"
            />
            <feDisplacementMap ref={greenChannelRef} in="SourceGraphic" in2="map" result="dispGreen" />
            <feColorMatrix
              in="dispGreen"
              type="matrix"
              values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0"
              result="green"
            />
            <feDisplacementMap ref={blueChannelRef} in="SourceGraphic" in2="map" result="dispBlue" />
            <feColorMatrix
              in="dispBlue"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0"
              result="blue"
            />
            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />
            <feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation="0.7" />
          </filter>
        </defs>
      </svg>
      <div className="glass-surface__content">{children}</div>
    </div>
  )
}
