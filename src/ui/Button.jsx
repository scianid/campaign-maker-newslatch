import { forwardRef } from 'react';
import { cn } from '../utils/cn';

export const Button = forwardRef(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-gray-900 text-white hover:bg-gray-800',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-900',
    ghost: 'hover:bg-gray-100 text-gray-900',
    destructive: 'bg-red-600 text-white hover:bg-red-700'
  };

  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 py-1 text-sm',
    lg: 'h-12 px-8 py-3'
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    />
  );
});