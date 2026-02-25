import { useState, useRef, useEffect, useCallback } from 'react'
import { geocodeAddress } from '../api/geocoding.functions'
import type { GeocodingResult } from '../lib/geocoding.server'

interface AddressAutocompleteProps {
  onSelect: (result: GeocodingResult) => void
  placeholder?: string
  initialValue?: string
}

export function AddressAutocomplete({
  onSelect,
  placeholder = 'Start typing an address...',
  initialValue = '',
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(initialValue)
  const [results, setResults] = useState<GeocodingResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [hasSelected, setHasSelected] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsSearching(true)
    try {
      const data = await geocodeAddress({ data: { query: q } })
      setResults(data)
      setIsOpen(data.length > 0)
      setActiveIndex(-1)
    } catch {
      setResults([])
      setIsOpen(false)
    } finally {
      setIsSearching(false)
    }
  }, [])

  function handleInputChange(value: string) {
    setQuery(value)
    setHasSelected(false)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      search(value)
    }, 400)
  }

  function handleSelect(result: GeocodingResult) {
    const shortDisplay = [result.street, result.city, result.state]
      .filter(Boolean)
      .join(', ')
    setQuery(shortDisplay)
    setResults([])
    setIsOpen(false)
    setHasSelected(true)
    onSelect(result)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(results[activeIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0 && !hasSelected) {
              setIsOpen(true)
            }
          }}
          className="w-full rounded-lg border border-border-default bg-bg-tertiary px-4 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-border-focus focus:ring-2 focus:ring-accent-orange/20 focus:outline-none"
          placeholder={placeholder}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />
        {isSearching && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-border-default border-t-accent-orange" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border-default bg-bg-secondary shadow-lg"
        >
          {results.map((result, index) => (
            <li
              key={`${result.latitude}-${result.longitude}`}
              role="option"
              aria-selected={index === activeIndex}
              className={`cursor-pointer px-4 py-3 text-sm ${
                index === activeIndex
                  ? 'bg-bg-tertiary text-text-primary'
                  : 'text-text-secondary hover:bg-bg-tertiary'
              }`}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <div className="font-medium text-text-primary">
                {result.street || result.city}
                {result.street && result.city && `, ${result.city}`}
              </div>
              <div className="mt-0.5 text-xs text-text-muted">
                {[result.state, result.zipCode].filter(Boolean).join(' ')}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-1 text-xs text-text-muted">
        Search powered by OpenStreetMap Nominatim
      </p>
    </div>
  )
}
