'use client'

import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?:      number
  showText?:  boolean
  textClassName?: string
}

export function Logo({
  className,
  size = 32,
  showText = true,
  textClassName,
}: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Outer circle of magnifying glass */}
        <circle
          cx="13"
          cy="13"
          r="9"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        {/* Inner smaller circle */}
        <circle
          cx="13"
          cy="13"
          r="4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="2.5 2"
        />
        {/* Handle */}
        <line
          x1="19.5"
          y1="19.5"
          x2="27"
          y2="27"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Center dot */}
        <circle
          cx="13"
          cy="13"
          r="1.5"
          fill="currentColor"
        />
      </svg>

      {showText && (
        <span
          className={cn(
            'font-semibold tracking-tight leading-none',
            textClassName,
          )}
        >
          ADW{' '}
          <span className="font-light tracking-widest text-[0.9em]">
            SEARCHER
          </span>
        </span>
      )}
    </div>
  )
}
