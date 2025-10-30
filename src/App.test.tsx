import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the Threadline heading', () => {
    render(<App />)
    expect(screen.getByText('Threadline')).toBeInTheDocument()
  })

  it('displays the welcome message', () => {
    render(<App />)
    expect(screen.getByText('Welcome to Threadline')).toBeInTheDocument()
  })

  it('shows the technology stack list', () => {
    render(<App />)
    expect(screen.getByText(/Vite \+ TypeScript \+ React/i)).toBeInTheDocument()
    expect(screen.getByText(/Tailwind CSS for styling/i)).toBeInTheDocument()
  })
})
