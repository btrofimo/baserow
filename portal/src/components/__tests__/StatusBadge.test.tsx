import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '../StatusBadge'

describe('StatusBadge', () => {
  it('renders status text', () => {
    render(<StatusBadge status="Submitted" />)
    expect(screen.getByText('Submitted')).toBeTruthy()
  })

  it('applies different styles per status', () => {
    const { rerender } = render(<StatusBadge status="Submitted" />)
    const submitted = screen.getByText('Submitted')
    expect(submitted.className).toContain('bg-status-submitted-bg')

    rerender(<StatusBadge status="In Review" />)
    const inReview = screen.getByText('In Review')
    expect(inReview.className).toContain('bg-status-pending-bg')

    rerender(<StatusBadge status="Completed" />)
    const completed = screen.getByText('Completed')
    expect(completed.className).toContain('bg-status-completed-bg')
  })

  it('applies fallback style for unknown status', () => {
    render(<StatusBadge status="Unknown Status" />)
    const badge = screen.getByText('Unknown Status')
    expect(badge.className).toContain('bg-bg-tertiary')
  })
})
