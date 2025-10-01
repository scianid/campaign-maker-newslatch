import { describe, it, expect } from 'vitest';
import { cn } from '../cn';

describe('cn utility function', () => {
  it('merges class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('handles conditional classes', () => {
    expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional');
  });

  it('handles undefined and null', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  it('handles empty strings', () => {
    expect(cn('base', '', 'end')).toBe('base end');
  });

  it('concatenates all valid classes', () => {
    const result = cn('px-2 py-1', 'px-4');
    // Simple implementation just concatenates
    expect(result).toBe('px-2 py-1 px-4');
  });

  it('returns empty string for no arguments', () => {
    expect(cn()).toBe('');
  });

  it('handles falsy values', () => {
    expect(cn('base', false, null, undefined, '', 'end')).toBe('base end');
  });

  it('handles multiple string arguments', () => {
    expect(cn('class1', 'class2', 'class3')).toBe('class1 class2 class3');
  });

  it('filters out boolean false', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible');
  });

  it('handles zero as falsy', () => {
    expect(cn('base', 0, 'end')).toBe('base end');
  });

  it('handles multiple conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    const result = cn(
      'base',
      isActive && 'active',
      isDisabled && 'disabled',
      'end'
    );
    expect(result).toBe('base active end');
  });

  it('works with className props pattern', () => {
    const baseClasses = 'flex items-center';
    const variantClasses = 'bg-blue-500 text-white';
    const customClasses = 'custom-padding';
    
    const result = cn(baseClasses, variantClasses, customClasses);
    expect(result).toBe('flex items-center bg-blue-500 text-white custom-padding');
  });
});
