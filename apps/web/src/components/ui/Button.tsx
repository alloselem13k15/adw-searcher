'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-white text-black hover:bg-gray-200 font-semibold shadow-sm',
  secondary:
    'bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 hover:border-gray-600 font-semibold',
  ghost:
    'bg-transparent text-gray-400 hover:text-white hover:bg-gray-800 font-medium',
  danger:
    'bg-gray-800 text-gray-200 border border-gray-600 hover:bg-gray-700 hover:text-white font-semibold',
  outline:
    'bg-transparent text-white border border-gray-600 hover:border-gray-400 hover:bg-gray-800/30 font-medium',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-lg gap-2',
  lg: 'px-7 py-3.5 text-base rounded-lg gap-2',
  icon: 'p-2 rounded-lg',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children && (
          <span className={cn(size === 'icon' && 'sr-only')}>{children}</span>
        )}
        {!loading && rightIcon}
      </button>
    )
  },
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps, Variant as ButtonVariant, Size as ButtonSize }
