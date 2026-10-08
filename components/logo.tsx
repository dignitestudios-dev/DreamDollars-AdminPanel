import Image from "next/image"
import * as React from "react"

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number
  width?: number
  height?: number
  alt?: string
  color?: string
}

export function Logo({
  size = 24,
  width,
  height,
  className,
  alt = "Dream Dollar Logo",
  color,
  ...props
}: LogoProps) {
  const finalWidth = width ?? size
  const finalHeight = height ?? size

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: finalWidth,
        height: finalHeight,
      }}
      {...props}
    >
      <Image
        src="/images/logo.png"
        alt={alt}
        width={finalWidth}
        height={finalHeight}
        className="h-full w-full object-contain"
        priority
      />
    </div>
  )
}

