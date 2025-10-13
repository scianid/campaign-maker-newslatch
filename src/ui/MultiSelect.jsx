import { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

export function MultiSelect({ options, value = [], onChange, placeholder = "Select options..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Normalize options to handle both string arrays and object arrays
  const normalizedOptions = options.map(option => 
    typeof option === 'string' ? { value: option, label: option } : option
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = (optionValue) => {
    // If clicking on 'all', don't add it to the array
    if (optionValue === 'all') {
      return;
    }
    
    const newValue = value.includes(optionValue) 
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  // Check if all non-'all' options are selected
  const actualOptions = normalizedOptions.filter(opt => opt.value !== 'all');
  const isAllSelected = actualOptions.length > 0 && actualOptions.every(opt => value.includes(opt.value));

  const handleSelectAll = () => {
    if (isAllSelected) {
      onChange([]);
    } else {
      // Select all actual categories, not 'all'
      onChange(actualOptions.map(opt => opt.value));
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-600 bg-card-bg px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-highlight focus:border-transparent transition-all"
      >
        <div className={cn(
          "flex-1 text-left truncate",
          value.length === 0 ? 'text-gray-400' : 'text-white'
        )}>
          {value.length === 0 
            ? placeholder 
            : isAllSelected 
              ? 'All categories' 
              : value.map(v => {
                  const option = normalizedOptions.find(opt => opt.value === v);
                  return option ? option.label : v.charAt(0).toUpperCase() + v.slice(1);
                }).join(', ')
          }
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform ml-2 flex-shrink-0",
          isOpen && "transform rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute z-[60] mt-1 w-full bg-card-bg border border-gray-600 rounded-lg shadow-lg">
          <div className="p-1">
            {/* All option */}
            <div
              onClick={handleSelectAll}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary-bg rounded cursor-pointer text-white"
            >
              <div className={cn(
                "w-4 h-4 border rounded flex items-center justify-center",
                isAllSelected ? "bg-highlight border-highlight" : "border-gray-500"
              )}>
                {isAllSelected && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="capitalize font-medium">All</span>
            </div>

            {/* Individual options */}
            {normalizedOptions.map((option) => {
              const isSelected = value.includes(option.value) || isAllSelected;
              return (
                <div
                  key={option.value}
                  onClick={() => handleToggle(option.value)}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary-bg rounded cursor-pointer text-white"
                >
                  <div className={cn(
                    "w-4 h-4 border rounded flex items-center justify-center",
                    isSelected ? "bg-highlight border-highlight" : "border-gray-500"
                  )}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="capitalize">{option.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}