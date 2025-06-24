import React, { useState, useRef, useEffect } from "react";
import { pasDeTemps } from "../../constants/timeSteps";

interface TimeStepDropdownProps {
  selectedTimeStep: string;
  onTimeStepChange: (timeStep: string) => void;
}

const TimeStepDropdown: React.FC<TimeStepDropdownProps> = ({
  selectedTimeStep,
  onTimeStepChange,
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

  const handleTimeStepSelect = (code: string) => {
    onTimeStepChange(code);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    const timeStep = pasDeTemps[selectedTimeStep as keyof typeof pasDeTemps];
    return timeStep ? timeStep.name : "Choisir un pas de temps";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Pas de temps
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors text-sm"
      >
        <span
          className={`block truncate ${
            selectedTimeStep ? "text-gray-900" : "text-gray-500"
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
        <div className="absolute z-[2000] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg right-0">
          <div className="p-1">
            {Object.entries(pasDeTemps).map(([code, timeStep]) => (
              <button
                key={code}
                type="button"
                onClick={() => handleTimeStepSelect(code)}
                className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedTimeStep === code
                    ? "bg-blue-50 text-blue-900 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border mr-3 flex items-center justify-center ${
                    selectedTimeStep === code
                      ? "bg-blue-600 border-blue-600"
                      : "border-gray-300"
                  }`}
                >
                  {selectedTimeStep === code && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <span>{timeStep.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeStepDropdown;
