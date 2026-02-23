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
    expect(submitted.className).toContain('bg-blue')

    rerender(<StatusBadge status="In Review" />)
    const inReview = screen.getByText('In Review')
    expect(inReview.className).toContain('bg-yellow')

    rerender(<StatusBadge status="Approved" />)
    const approved = screen.getByText('Approved')
    expect(approved.className).toContain('bg-green')

    rerender(<StatusBadge status="Completed" />)
    const completed = screen.getByText('Completed')
    expect(completed.className).toContain('bg-gray')
  })
})
