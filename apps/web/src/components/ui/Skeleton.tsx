import type { CSSProperties } from 'react'

interface Props {
  className?: string
  style?: CSSProperties
}

export function Skeleton({ className = '', style }: Props) {
  return (
    <div
      className={`animate-pulse rounded bg-[var(--bg-elevated)] ${className}`}
      style={style}
    />
  )
}
