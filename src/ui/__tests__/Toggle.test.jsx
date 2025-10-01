import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle } from '../Toggle';

describe('Toggle Component', () => {
  it('renders toggle button', () => {
    render(<Toggle aria-label="Toggle feature" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('toggles state when clicked', async () => {
    const user = userEvent.setup();
    render(<Toggle aria-label="Toggle feature" />);
    
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAttribute('data-state', 'off');
    
    await user.click(toggle);
    expect(toggle).toHaveAttribute('data-state', 'on');
    
    await user.click(toggle);
    expect(toggle).toHaveAttribute('data-state', 'off');
  });

  it('calls onPressedChange handler', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    
    render(<Toggle onPressedChange={handleChange} aria-label="Toggle feature" />);
    
    await user.click(screen.getByRole('button'));
    expect(handleChange).toHaveBeenCalledWith(true);
    
    await user.click(screen.getByRole('button'));
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('renders with custom className', () => {
    render(<Toggle className="custom-class" aria-label="Toggle feature" />);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('renders disabled toggle', () => {
    render(<Toggle disabled aria-label="Toggle feature" />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not toggle when disabled', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    
    render(<Toggle disabled onPressedChange={handleChange} aria-label="Toggle feature" />);
    
    await user.click(screen.getByRole('button'));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('can be controlled with pressed prop', () => {
    const { rerender } = render(<Toggle pressed={false} aria-label="Toggle feature" />);
    expect(screen.getByRole('button')).toHaveAttribute('data-state', 'off');
    
    rerender(<Toggle pressed={true} aria-label="Toggle feature" />);
    expect(screen.getByRole('button')).toHaveAttribute('data-state', 'on');
  });

  it('renders different variants', () => {
    const { rerender } = render(<Toggle variant="default" aria-label="Toggle" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    
    rerender(<Toggle variant="outline" aria-label="Toggle" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Toggle size="default" aria-label="Toggle" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    
    rerender(<Toggle size="sm" aria-label="Toggle" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    
    rerender(<Toggle size="lg" aria-label="Toggle" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders with children content', () => {
    render(<Toggle aria-label="Toggle">Toggle Text</Toggle>);
    expect(screen.getByText('Toggle Text')).toBeInTheDocument();
  });
});
