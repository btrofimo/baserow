import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-orange text-white hover:bg-accent-orange-hover disabled:opacity-50',
  secondary:
    'border border-border-default text-text-primary hover:bg-bg-tertiary disabled:opacity-50',
  ghost:
    'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-50',
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${VARIANT_STYLES[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
