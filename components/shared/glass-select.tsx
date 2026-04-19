'use client';

import { useState, useRef, useEffect } from 'react';

interface GlassSelectOption {
  value: string;
  label: string | React.ReactNode;
}

interface GlassSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: GlassSelectOption[];
  label?: string | React.ReactNode;
  placeholder?: string;
  className?: string;
}

export function GlassSelect({
  id,
  value,
  onChange,
  options,
  label,
  placeholder = 'Select Option',
  className = '',
}: GlassSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get selected option label
  const selectedOption = options.find(opt => opt.value === value);
  const selectedLabel = selectedOption?.label || placeholder;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Handle option selection
  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
        </label>
      )}

      {/* Selected Button */}
      <button
        ref={buttonRef}
        id={id}
        type="button"
        onClick={toggleDropdown}
        className="w-full flex justify-between items-center px-4 py-3 rounded-xl backdrop-blur-lg bg-white/30 dark:bg-gray-800/10 border border-white/40 dark:border-gray-700/20 text-gray-900 dark:text-white shadow-lg hover:bg-white/40 dark:hover:bg-gray-800/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span>{selectedLabel}</span>
        <span
          className={`transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          ⌄
        </span>
      </button>

      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className={`absolute mt-2 w-full rounded-xl overflow-hidden backdrop-blur-lg bg-white/30 dark:bg-gray-800/10 border border-white/40 dark:border-gray-700/20 shadow-2xl transition-all duration-300 z-50 ${
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {/* Options */}
        <div className="flex flex-col max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`px-4 py-3 cursor-pointer text-left transition-all duration-200 ${
                option.value === value
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-900 dark:text-white hover:bg-white/20 dark:hover:bg-gray-700/20'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
