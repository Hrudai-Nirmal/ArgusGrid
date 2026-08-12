/**
 * Shared Meridian brand mark backed by the static compass SVG asset.
 */

import { cn } from "@/lib/utils"

type MeridianLogoProps = {
  className?: string
}

/**
 * Renders the Meridian compass logo without duplicating inline SVG definitions.
 */
export function MeridianLogo({ className }: MeridianLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Static SVG logo needs no Next image optimization.
    <img src="/meridian-logo.svg" alt="Meridian logo" className={cn("size-8 object-contain", className)} />
  )
}
