import React, { useState, useRef, useEffect } from "react";

interface TemporalSpeedSelectorProps {
  currentSpeed: number;
  onSpeedChange: (speed: number) => void;
  disabled?: boolean;
}

const TemporalSpeedSelector: React.FC<TemporalSpeedSelectorProps> = ({
  currentSpeed,
  onSpeedChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Vitesses de lecture disponibles
  const speeds = [
    { value: 0.25, label: "0.25x", description: "Très lent" },
    { value: 0.5, label: "0.5x", description: "Lent" },
    { value: 1, label: "1x", description: "Normal" },
    { value: 2, label: "2x", description: "Rapide" },
    { value: 4, label: "4x", description: "Très rapide" },
    { value: 8, label: "8x", description: "Ultra rapide" },
  ];

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Trouver la vitesse actuelle
  const currentSpeedOption =
    speeds.find((speed) => speed.value === currentSpeed) || speeds[2];

  const handleSpeedSelect = (speed: number) => {
    onSpeedChange(speed);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton de sélection */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-md border transition-all duration-200
          ${
            disabled
              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              : isOpen
              ? "bg-blue-50 text-blue-700 border-blue-300 shadow-sm"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
          }
        `}
      >
        {/* Icône vitesse */}
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>

        {/* Vitesse actuelle */}
        <span className="font-medium">{currentSpeedOption.label}</span>

        {/* Flèche */}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
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
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-48 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-1">
            {speeds.map((speed) => (
              <button
                key={speed.value}
                type="button"
                onClick={() => handleSpeedSelect(speed.value)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors
                  ${
                    currentSpeed === speed.value
                      ? "bg-blue-50 text-blue-900 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-50"
                  }
                `}
              >
                <div className="flex items-center space-x-2">
                  {/* Icône de vitesse */}
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(4, speed.value) }).map(
                      (_, i) => (
                        <div
                          key={i}
                          className={`w-1 h-3 rounded-full ${
                            currentSpeed === speed.value
                              ? "bg-blue-600"
                              : "bg-gray-400"
                          }`}
                          style={{
                            opacity: 1 - i * 0.2,
                          }}
                        />
                      )
                    )}
                  </div>

                  <span className="font-medium">{speed.label}</span>
                </div>

                <span className="text-xs text-gray-500">
                  {speed.description}
                </span>
              </button>
            ))}
          </div>

          {/* Informations supplémentaires */}
          <div className="border-t border-gray-200 p-2">
            <div className="text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Vitesse de lecture temporelle</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemporalSpeedSelector;
