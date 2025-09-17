import { forwardRef } from 'react';
import { cn } from '../utils/cn';

export const Badge = forwardRef(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-highlight text-primary-bg',
    secondary: 'bg-primary-bg text-gray-300 hover:bg-gray-700',
    outline: 'border border-gray-600 bg-card-bg text-white'
  };

  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
});