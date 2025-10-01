import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '../Textarea';

describe('Textarea Component', () => {
  it('renders textarea field', () => {
    render(<Textarea placeholder="Enter description" />);
    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
  });

  it('accepts and displays value', async () => {
    const user = userEvent.setup();
    render(<Textarea placeholder="Enter description" />);
    
    const textarea = screen.getByPlaceholderText('Enter description');
    await user.type(textarea, 'Multi-line text');
    
    expect(textarea).toHaveValue('Multi-line text');
  });

  it('calls onChange handler', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    
    render(<Textarea onChange={handleChange} placeholder="Enter description" />);
    
    await user.type(screen.getByPlaceholderText('Enter description'), 'a');
    expect(handleChange).toHaveBeenCalled();
  });

  it('renders with custom className', () => {
    render(<Textarea className="custom-class" data-testid="textarea" />);
    expect(screen.getByTestId('textarea')).toHaveClass('custom-class');
  });

  it('renders disabled textarea', () => {
    render(<Textarea disabled data-testid="textarea" />);
    expect(screen.getByTestId('textarea')).toBeDisabled();
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('accepts all textarea HTML attributes', () => {
    render(
      <Textarea 
        name="test-textarea"
        id="test-id"
        required
        maxLength={100}
        rows={5}
        data-testid="textarea"
      />
    );
    
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveAttribute('name', 'test-textarea');
    expect(textarea).toHaveAttribute('id', 'test-id');
    expect(textarea).toBeRequired();
    expect(textarea).toHaveAttribute('maxlength', '100');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('handles multiline text correctly', async () => {
    const user = userEvent.setup();
    render(<Textarea data-testid="textarea" />);
    
    const textarea = screen.getByTestId('textarea');
    const multiLineText = 'Line 1\nLine 2\nLine 3';
    
    await user.type(textarea, multiLineText);
    expect(textarea).toHaveValue(multiLineText);
  });

  it('handles focus and blur', async () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    const user = userEvent.setup();
    
    render(
      <Textarea 
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Test textarea"
      />
    );
    
    const textarea = screen.getByPlaceholderText('Test textarea');
    
    await user.click(textarea);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    await user.tab();
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });
});
