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

  it('shows Phase 3.1 three-panel layout implementation features', () => {
    render(<App />)
    expect(
      screen.getByText('Phase 3.1: Three-Panel Layout (NEW)')
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Responsive three-panel layout with Thread List, Change List, and Thread Metadata/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Panel state management in Zustand store/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/Previous Phase 2.2 features/i)).toBeInTheDocument()
    expect(screen.getByText(/Previous Phase 2.1 features/i)).toBeInTheDocument()
    expect(screen.getByText(/Previous Phase 1.4 features/i)).toBeInTheDocument()
    expect(screen.getByText(/Phase 1.2 features/i)).toBeInTheDocument()
  })
})
