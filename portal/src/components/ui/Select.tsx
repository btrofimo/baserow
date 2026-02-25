import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label?: string
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchable?: boolean
}

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchable = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = searchable
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase())
      )
    : options

  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? placeholder

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between rounded-lg border bg-bg-tertiary px-4 py-2.5 text-sm text-left transition-colors ${
          isOpen
            ? 'border-border-focus ring-2 ring-accent-orange/20'
            : 'border-border-default'
        }`}
      >
        <span className={value ? 'text-text-primary' : 'text-text-muted'}>
          {selectedLabel}
        </span>
        <ChevronDown
          size={16}
          className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border-default bg-bg-secondary shadow-lg">
          {searchable && (
            <div className="p-2">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-border-default bg-bg-tertiary px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                placeholder="Search..."
              />
            </div>
          )}
          <div className="max-h-60 overflow-auto py-1">
            {filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                  setSearch('')
                }}
                className="flex w-full items-center justify-between px-4 py-2 text-sm text-text-primary hover:bg-bg-tertiary"
              >
                {option.label}
                {option.value === value && (
                  <Check size={16} className="text-accent-orange" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
