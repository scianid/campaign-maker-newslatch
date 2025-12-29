import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../utils/cn';

export const Button = forwardRef(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
  const variants = {
    default: 'bg-button-primary text-button-text hover:bg-button-primary/90',
    outline: 'border border-white/15 bg-white/5 hover:bg-white/10 text-white',
    dashed:
      'border border-dashed border-highlight/55 bg-highlight/5 text-highlight hover:border-highlight/80 hover:bg-highlight/10',
    ghost: 'bg-transparent text-white hover:bg-white/5',
    destructive: 'bg-red-600 text-white hover:bg-red-700'
  };

  const sizes = {
    default: 'h-11 px-6 text-sm',
    sm: 'h-9 px-4 text-sm',
    lg: 'h-12 px-8 text-base',
    icon: 'h-11 w-11 p-0'
  };

  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold leading-none tracking-[-0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-primary-bg disabled:pointer-events-none disabled:opacity-50 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0',
        variants[variant],
        sizes[size] ?? sizes.default,
        className
      )}
      ref={ref}
      {...props}
    />
  );
});