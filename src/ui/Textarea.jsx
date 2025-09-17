import { forwardRef } from 'react';
import { cn } from '../utils/cn';

export const Textarea = forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-lg border border-gray-600 bg-card-bg px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-highlight focus:border-transparent disabled:opacity-50 transition-all',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});