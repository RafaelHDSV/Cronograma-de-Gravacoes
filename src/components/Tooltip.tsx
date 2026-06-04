import type { ReactElement, ReactNode } from 'react'

type Placement = 'top' | 'bottom'

interface Props {
  label: string
  children: ReactElement
  placement?: Placement
}

export function Tooltip({ label, children, placement = 'top' }: Props) {
  return (
    <span className={`tooltip-host tooltip-${placement}`}>
      {children}
      <span className="tooltip-popup" role="tooltip">
        {label}
      </span>
    </span>
  )
}

interface IconButtonProps {
  label: string
  className?: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  'aria-expanded'?: boolean
  children: ReactNode
}

export function IconButton({
  label,
  className = '',
  active,
  disabled,
  onClick,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        className={`btn-icon-sm${active ? ' active' : ''}${className ? ` ${className}` : ''}`}
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        {...rest}
      >
        {children}
      </button>
    </Tooltip>
  )
}
