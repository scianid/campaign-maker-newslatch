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
      translate: 'translate-x-4'
    },
    md: {
      switch: 'w-10 h-5',
      thumb: 'w-4 h-4',
      translate: 'translate-x-5'
    },
    lg: {
      switch: 'w-12 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-6'
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
        'relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900',
        currentSize.switch,
        checked 
          ? 'bg-purple-600 hover:bg-purple-700' 
          : 'bg-gray-600 hover:bg-gray-500',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'inline-block bg-white rounded-full shadow-lg transform transition-transform duration-200',
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
          'text-sm font-medium text-gray-300',
          disabled && 'opacity-50'
        )}
      >
        {label}
      </span>
    </div>
  );
}