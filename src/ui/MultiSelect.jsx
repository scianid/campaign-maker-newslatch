import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

export function MultiSelect({ options, value = [], onChange, placeholder = "Select options..." }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (option) => {
    const newValue = value.includes(option) 
      ? value.filter(v => v !== option)
      : [...value, option];
    onChange(newValue);
  };

  const isAllSelected = value.includes('all') || value.length === options.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onChange([]);
    } else {
      onChange(['all']);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      >
        <div className={cn(
          "flex-1 text-left truncate",
          value.length === 0 ? 'text-gray-400' : 'text-gray-900'
        )}>
          {value.length === 0 
            ? placeholder 
            : isAllSelected 
              ? 'All categories' 
              : value.map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(', ')
          }
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform ml-2 flex-shrink-0",
          isOpen && "transform rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-1">
            {/* All option */}
            <div
              onClick={handleSelectAll}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 rounded cursor-pointer"
            >
              <div className={cn(
                "w-4 h-4 border rounded flex items-center justify-center",
                isAllSelected ? "bg-blue-600 border-blue-600" : "border-gray-300"
              )}>
                {isAllSelected && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="capitalize font-medium">All</span>
            </div>

            {/* Individual options */}
            {options.map((option) => {
              const isSelected = value.includes(option) || isAllSelected;
              return (
                <div
                  key={option}
                  onClick={() => handleToggle(option)}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 rounded cursor-pointer"
                >
                  <div className={cn(
                    "w-4 h-4 border rounded flex items-center justify-center",
                    isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300"
                  )}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="capitalize">{option}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}