import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'line' | 'circle' | 'rect'
  width?: string
  height?: string
}

function Skeleton({ variant = 'rect', width, height, className, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton',
        variant === 'circle' && 'rounded-full',
        variant === 'line' && 'rounded',
        variant === 'rect' && 'rounded-lg',
        className,
      )}
      style={{ width, height, ...style }}
      {...props}
    />
  )
}

function SkeletonCard() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton width="120px" height="14px" variant="line" />
        <Skeleton width="32px" height="32px" variant="circle" />
      </div>
      <Skeleton width="80px" height="28px" variant="line" />
      <Skeleton width="100px" height="12px" variant="line" />
    </div>
  )
}

function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 border-b border-gray-800">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height="12px" variant="line" className="flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3.5 border-b border-gray-800/50 last:border-b-0">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton
              key={j}
              height="14px"
              variant="line"
              className="flex-1"
              style={{ opacity: 1 - i * 0.08 }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="14px"
          variant="line"
          style={{ width: i === lines - 1 ? '70%' : '100%' }}
        />
      ))}
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonTable, SkeletonText }
