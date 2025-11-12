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

  it('shows Phase 1.2 implementation features', () => {
    render(<App />)
    expect(
      screen.getByText('Phase 1.2: DOCX Structure Extraction')
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Web Worker for non-blocking DOCX parsing/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/SHA-256 document hashing/i)).toBeInTheDocument()
  })
})
