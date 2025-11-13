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

  it('shows Phase 2.2 clustering implementation features', () => {
    render(<App />)
    expect(
      screen.getByText('Phase 2.2: LLM-Assisted Clustering (NEW)')
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Export clustering packet as JSON with clear LLM instructions/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Import and validate LLM responses with comprehensive checks/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/Previous Phase 2.1 features/i)).toBeInTheDocument()
    expect(screen.getByText(/Previous Phase 1.4 features/i)).toBeInTheDocument()
    expect(screen.getByText(/Phase 1.2 features/i)).toBeInTheDocument()
  })
})
