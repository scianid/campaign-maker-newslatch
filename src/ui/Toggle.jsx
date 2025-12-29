import { cn } from '../utils/cn';

export function Toggle({ 
  checked = false, 
  onChange, 
  disabled = false, 
  size = 'md', 
  label,
  labelPosition = 'right',
  className,
  ...props 
}) {
  const sizeClasses = {
    sm: {
      switch: 'w-8 h-4',
      thumb: 'w-3 h-3',
      translate: 'translate-x-4',
      label: 'text-xs'
    },
    md: {
      switch: 'w-10 h-5',
      thumb: 'w-4 h-4',
      translate: 'translate-x-5',
      label: 'text-sm'
    },
    lg: {
      switch: 'w-12 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-6',
      label: 'text-sm'
    }
  };

  const currentSize = sizeClasses[size];

  const toggleSwitch = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'relative inline-flex items-center rounded-full border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-highlight/30 focus:ring-offset-2 focus:ring-offset-primary-bg',
        currentSize.switch,
        checked 
          ? 'bg-highlight border-highlight/40 hover:bg-highlight/90' 
          : 'bg-white/10 border-white/10 hover:bg-white/15 hover:border-white/20',
        disabled && 'opacity-50 cursor-not-allowed hover:bg-white/10 hover:border-white/10',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'inline-block bg-white rounded-full shadow-lg shadow-black/30 transform transition-transform duration-200',
          currentSize.thumb,
          checked ? currentSize.translate : 'translate-x-0.5'
        )}
      />
    </button>
  );

  if (!label) {
    return toggleSwitch;
  }

  return (
    <div className={cn(
      'flex items-center gap-3',
      labelPosition === 'left' && 'flex-row-reverse'
    )}>
      {toggleSwitch}
      <span 
        className={cn(
          'font-medium',
          currentSize.label,
          checked ? 'text-highlight' : 'text-white/60',
          disabled && 'opacity-50'
        )}
      >
        {label}
      </span>
    </div>
  );
}