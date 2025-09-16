import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  it('renders the main heading', () => {
    render(<App />)
    expect(screen.getByText('Basic WebApp')).toBeInTheDocument()
  })

  it('renders the description text', () => {
    render(<App />)
    expect(screen.getByText(/A modern React application built with Vite/)).toBeInTheDocument()
  })

  it('mentions the tech stack in description', () => {
    render(<App />)
    const description = screen.getByText(/A modern React application built with Vite/)
    expect(description).toHaveTextContent('Vite')
    expect(description).toHaveTextContent('Tailwind CSS')
    expect(description).toHaveTextContent('Vitest')
    expect(description).toHaveTextContent('Radix UI')
  })
})