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

  it('merges Tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4');
    // Should override px-2 with px-4
    expect(result).not.toContain('px-2');
    expect(result).toContain('px-4');
    expect(result).toContain('py-1');
  });

  it('handles object syntax', () => {
    expect(cn({
      'class1': true,
      'class2': false,
      'class3': true,
    })).toContain('class1');
    expect(cn({
      'class1': true,
      'class2': false,
      'class3': true,
    })).toContain('class3');
    expect(cn({
      'class1': true,
      'class2': false,
      'class3': true,
    })).not.toContain('class2');
  });

  it('handles array syntax', () => {
    expect(cn(['class1', 'class2', 'class3'])).toBe('class1 class2 class3');
  });

  it('handles mixed inputs', () => {
    const result = cn(
      'base',
      ['array1', 'array2'],
      { 'object1': true, 'object2': false },
      undefined,
      'end'
    );
    expect(result).toContain('base');
    expect(result).toContain('array1');
    expect(result).toContain('array2');
    expect(result).toContain('object1');
    expect(result).not.toContain('object2');
    expect(result).toContain('end');
  });

  it('returns empty string for no arguments', () => {
    expect(cn()).toBe('');
  });

  it('handles complex Tailwind class conflicts', () => {
    const result = cn('bg-red-500 text-white', 'bg-blue-500');
    expect(result).not.toContain('bg-red-500');
    expect(result).toContain('bg-blue-500');
    expect(result).toContain('text-white');
  });

  it('deduplicates identical classes', () => {
    const result = cn('class1 class2', 'class2 class3');
    // Should not have duplicate class2
    const classes = result.split(' ');
    const class2Count = classes.filter(c => c === 'class2').length;
    expect(class2Count).toBe(1);
  });

  it('handles responsive and state variants', () => {
    const result = cn('hover:bg-blue-500 md:text-lg', 'hover:bg-red-500');
    expect(result).not.toContain('hover:bg-blue-500');
    expect(result).toContain('hover:bg-red-500');
    expect(result).toContain('md:text-lg');
  });

  it('preserves important modifiers', () => {
    const result = cn('!text-red-500', 'text-blue-500');
    expect(result).toContain('!text-red-500');
  });
});
