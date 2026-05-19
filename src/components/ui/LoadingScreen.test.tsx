import { render, screen } from '@testing-library/react'
import { LoadingScreen } from './LoadingScreen'

describe('LoadingScreen', () => {
  it('renders the dashboard title', () => {
    render(<LoadingScreen />)
    expect(screen.getByText('MapSCN Dashboard')).toBeInTheDocument()
  })

  it('renders the initializing status text', () => {
    render(<LoadingScreen />)
    expect(screen.getByText(/initializing fleet data/i)).toBeInTheDocument()
  })

  it('applies a custom className when provided', () => {
    const { container } = render(<LoadingScreen className="test-class" />)
    expect(container.firstChild).toHaveClass('test-class')
  })
})
