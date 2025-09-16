import { forwardRef } from 'react';
import { cn } from '../utils/cn';

export const Badge = forwardRef(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-gray-900 text-white',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    outline: 'border border-gray-300 bg-white text-gray-900'
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