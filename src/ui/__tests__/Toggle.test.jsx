import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle } from '../Toggle';

describe('Toggle Component', () => {
  it('renders toggle switch', () => {
    render(<Toggle aria-label="Toggle feature" />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('toggles state when clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Toggle checked={false} onChange={handleChange} aria-label="Toggle feature" />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    
    await user.click(toggle);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange handler with correct value', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    
    render(<Toggle checked={false} onChange={handleChange} aria-label="Toggle feature" />);
    
    await user.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('renders with custom className', () => {
    render(<Toggle className="custom-class" aria-label="Toggle feature" />);
    expect(screen.getByRole('switch')).toHaveClass('custom-class');
  });

  it('renders disabled toggle', () => {
    render(<Toggle disabled aria-label="Toggle feature" />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('does not toggle when disabled', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    
    render(<Toggle disabled onChange={handleChange} aria-label="Toggle feature" />);
    
    await user.click(screen.getByRole('switch'));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('can be controlled with checked prop', () => {
    const { rerender } = render(<Toggle checked={false} aria-label="Toggle feature" />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    
    rerender(<Toggle checked={true} aria-label="Toggle feature" />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Toggle size="md" aria-label="Toggle" />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
    
    rerender(<Toggle size="sm" aria-label="Toggle" />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
    
    rerender(<Toggle size="lg" aria-label="Toggle" />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Toggle label="Toggle Text" aria-label="Toggle" />);
    expect(screen.getByText('Toggle Text')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('renders label on left when labelPosition is left', () => {
    const { container } = render(
      <Toggle label="Toggle Text" labelPosition="left" aria-label="Toggle" />
    );
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('flex-row-reverse');
  });
});
