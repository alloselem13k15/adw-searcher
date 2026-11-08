import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered' | 'glass'
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const variants = {
  default: 'bg-gray-900 border border-gray-800',
  elevated: 'bg-gray-850 border border-gray-700',
  bordered: 'bg-transparent border border-gray-700',
  glass: 'bg-black/60 backdrop-blur-xl border border-gray-800',
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

function Card({
  variant = 'default',
  hover = false,
  padding = 'md',
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl',
        variants[variant],
        paddings[padding],
        hover && 'transition-all duration-200 hover:border-gray-700 hover:shadow-card-hover cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-between mb-5', className)}
      {...props}
    >
      {children}
    </div>
  )
}

function CardTitle({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-semibold text-white', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

function CardDescription({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-gray-400 mt-0.5', className)}
      {...props}
    >
      {children}
    </p>
  )
}

function CardContent({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}

function CardFooter({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-between pt-5 mt-5 border-t border-gray-800', className)}
      {...props}
    >
      {children}
    </div>
  )
}

// Stat Card
interface StatCardProps {
  label: string
  value: string | number
  change?: string
  positive?: boolean
  icon?: React.ReactNode
  className?: string
}

function StatCard({ label, value, change, positive, icon, className }: StatCardProps) {
  return (
    <Card className={cn('card-shine', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {change && (
            <p className={cn('text-xs mt-1', positive ? 'text-gray-300' : 'text-gray-500')}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-gray-800 rounded-lg text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, StatCard }
