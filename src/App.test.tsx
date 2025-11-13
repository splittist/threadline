import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the Threadline heading', () => {
    render(<App />)
    expect(screen.getByText('Threadline')).toBeInTheDocument()
  })

  it('displays the tagline', () => {
    render(<App />)
    expect(
      screen.getByText('Bringing clarity to the chaos of redlines.')
    ).toBeInTheDocument()
  })

  it('shows Phase 1.4 implementation features', () => {
    render(<App />)
    expect(
      screen.getByText('Phase 1.4: Data Model Implementation')
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Core data structures: Document, Change, and Thread/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/Previous Phase 1.2 features/i)).toBeInTheDocument()
  })
})
