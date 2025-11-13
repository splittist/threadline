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

  it('shows Phase 2.1 clustering implementation features', () => {
    render(<App />)
    expect(
      screen.getByText('Phase 2.1: Heuristic Clustering (NEW)')
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Clause-based clustering using Levenshtein distance/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Keyword extraction using TF-IDF algorithm/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/Previous Phase 1.4 features/i)).toBeInTheDocument()
    expect(screen.getByText(/Phase 1.2 features/i)).toBeInTheDocument()
  })
})
