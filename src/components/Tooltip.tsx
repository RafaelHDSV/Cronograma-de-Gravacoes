import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

const GAP = 8
const VIEWPORT_PAD = 8

type Placement = 'top' | 'bottom'

interface Props {
  label: string
  multiline?: boolean
  children: ReactElement
}

function clampX(centerX: number, popupWidth: number): number {
  const half = popupWidth / 2
  return Math.max(VIEWPORT_PAD + half, Math.min(window.innerWidth - VIEWPORT_PAD - half, centerX))
}

export function Tooltip({ label, multiline, children }: Props) {
  const [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState<Placement>('bottom')
  const [coords, setCoords] = useState<CSSProperties>({})
  const hostRef = useRef<HTMLSpanElement>(null)
  const popupRef = useRef<HTMLSpanElement>(null)

  const updatePosition = useCallback(() => {
    const host = hostRef.current
    const popup = popupRef.current
    if (!host) return

    const rect = host.getBoundingClientRect()
    const popupH = popup?.offsetHeight ?? 36
    const popupW = popup?.offsetWidth ?? 120
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const fitsBelow = spaceBelow >= popupH + GAP
    const fitsAbove = spaceAbove >= popupH + GAP
    const showBelow = fitsBelow ? true : fitsAbove ? false : spaceBelow >= spaceAbove

    const nextPlacement: Placement = showBelow ? 'bottom' : 'top'
    const centerX = clampX(rect.left + rect.width / 2, popupW)

    if (nextPlacement === 'bottom') {
      setCoords({
        top: rect.bottom + GAP,
        left: centerX,
        transform: 'translateX(-50%)',
      })
    } else {
      setCoords({
        top: rect.top - GAP,
        left: centerX,
        transform: 'translate(-50%, -100%)',
      })
    }
    setPlacement(nextPlacement)
  }, [])

  const show = useCallback(() => {
    setOpen(true)
  }, [])

  const hide = useCallback(() => {
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()
    const id = requestAnimationFrame(updatePosition)
    const onScrollOrResize = () => updatePosition()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [open, label, updatePosition])

  return (
    <span
      ref={hostRef}
      className="tooltip-host"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {open &&
        createPortal(
          <span
            ref={popupRef}
            className={`tooltip-popup tooltip-popup--${placement}${multiline ? ' tooltip-popup--multiline' : ''}`}
            style={coords}
            role="tooltip"
          >
            {label}
          </span>,
          document.body,
        )}
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
