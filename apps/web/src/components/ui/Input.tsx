'use client'

import { forwardRef, InputHTMLAttributes, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  wrapperClassName?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      type,
      wrapperClassName,
      className,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

    return (
      <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label className="text-sm font-medium text-gray-300">
            {label}
            {props.required && (
              <span className="ml-1 text-gray-500">*</span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            className={cn(
              'w-full bg-gray-850 border rounded-lg text-white placeholder-gray-500 text-sm',
              'transition-all duration-200',
              'focus:outline-none focus:ring-1',
              error
                ? 'border-gray-500 focus:border-gray-400 focus:ring-gray-400/30'
                : 'border-gray-700 focus:border-gray-500 focus:ring-gray-500/30',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leftIcon ? 'pl-10' : 'pl-4',
              rightIcon || isPassword ? 'pr-10' : 'pr-4',
              'py-2.5',
              className,
            )}
            {...props}
          />

          {/* Password toggle */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Custom right icon */}
          {rightIcon && !isPassword && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <span className="w-1 h-1 bg-gray-400 rounded-full inline-block" />
            {error}
          </p>
        )}

        {/* Hint */}
        {!error && hint && (
          <p className="text-xs text-gray-500">{hint}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

// Textarea variant
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  wrapperClassName?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, wrapperClassName, className, ...props }, ref) => (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      {label && (
        <label className="text-sm font-medium text-gray-300">
          {label}
          {props.required && <span className="ml-1 text-gray-500">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'w-full bg-gray-850 border rounded-lg text-white placeholder-gray-500 text-sm px-4 py-2.5',
          'transition-all duration-200 resize-none',
          'focus:outline-none focus:ring-1',
          error
            ? 'border-gray-500 focus:border-gray-400 focus:ring-gray-400/30'
            : 'border-gray-700 focus:border-gray-500 focus:ring-gray-500/30',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-gray-400">{error}</p>}
      {!error && hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  ),
)

Textarea.displayName = 'Textarea'

// Select variant
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
  wrapperClassName?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, wrapperClassName, className, ...props }, ref) => (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      {label && (
        <label className="text-sm font-medium text-gray-300">
          {label}
          {props.required && <span className="ml-1 text-gray-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          'w-full bg-gray-850 border rounded-lg text-white text-sm px-4 py-2.5',
          'transition-all duration-200',
          'focus:outline-none focus:ring-1',
          error
            ? 'border-gray-500 focus:border-gray-400 focus:ring-gray-400/30'
            : 'border-gray-700 focus:border-gray-500 focus:ring-gray-500/30',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          '[&>option]:bg-gray-850 [&>option]:text-white',
          className,
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-gray-400">{error}</p>}
    </div>
  ),
)

Select.displayName = 'Select'

export { Input, Textarea, Select }
export type { InputProps, TextareaProps, SelectProps }
