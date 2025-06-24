import React, { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
  isGroupHeader?: boolean;
  isPartiallySelected?: boolean;
}

interface DropdownSelectorProps {
  label: string;
  options: Option[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  onGroupHeaderClick?: () => void;
}

const DropdownSelector: React.FC<DropdownSelectorProps> = ({
  label,
  options,
  selectedValues,
  onSelectionChange,
  multiple = false,
  placeholder = "Sélectionner...",
  onGroupHeaderClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOptionClick = (optionValue: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      onSelectionChange(newValues);
    } else {
      onSelectionChange([optionValue]);
      setIsOpen(false);
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    }

    if (multiple) {
      if (selectedValues.length === 1) {
        const option = options.find((opt) => opt.value === selectedValues[0]);
        return option?.label || selectedValues[0];
      }
      return `${selectedValues.length} sélectionné(s)`;
    } else {
      const option = options.find((opt) => opt.value === selectedValues[0]);
      return option?.label || selectedValues[0];
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors text-sm"
      >
        <span
          className={`block truncate ${
            selectedValues.length === 0 ? "text-gray-500" : "text-gray-900"
          }`}
        >
          {getDisplayText()}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-[2000] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
          {options.map((option, index) => (
            <div key={index}>
              {option.disabled ? (
                <div className="px-3 py-1 text-xs text-gray-400 border-b border-gray-100">
                  {option.label}
                </div>
              ) : option.isGroupHeader ? (
                <button
                  type="button"
                  onClick={onGroupHeaderClick}
                  className="w-full px-3 py-1.5 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors text-sm font-medium text-gray-900 cursor-pointer"
                >
                  <div className="flex items-center">
                    {multiple && (
                      <input
                        type="checkbox"
                        checked={option.isPartiallySelected ? false : true}
                        readOnly
                        className="mr-2 h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        style={{
                          backgroundImage: option.isPartiallySelected
                            ? "radial-gradient(circle, #3b82f6 2px, transparent 2px)"
                            : undefined,
                        }}
                      />
                    )}
                    <span className="truncate">{option.label}</span>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOptionClick(option.value)}
                  className={`w-full px-3 py-1.5 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors text-sm ${
                    selectedValues.includes(option.value)
                      ? "bg-blue-50 text-blue-900"
                      : "text-gray-900"
                  }`}
                >
                  <div className="flex items-center">
                    {multiple && (
                      <input
                        type="checkbox"
                        checked={selectedValues.includes(option.value)}
                        readOnly
                        className="mr-2 h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    )}
                    <span
                      className={`truncate ${
                        option.label.startsWith("  ") ? "text-gray-600" : ""
                      }`}
                    >
                      {option.label}
                    </span>
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownSelector;
