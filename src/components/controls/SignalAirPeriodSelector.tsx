import React, { useState, useRef, useEffect } from "react";

interface SignalAirPeriodSelectorProps {
  startDate: string;
  endDate: string;
  onPeriodChange: (startDate: string, endDate: string) => void;
  isVisible: boolean;
}

const SignalAirPeriodSelector: React.FC<SignalAirPeriodSelectorProps> = ({
  startDate,
  endDate,
  onPeriodChange,
  isVisible,
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getDisplayText = () => {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const handleQuickSelect = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    const formatDateForInput = (date: Date): string => {
      return date.toISOString().split("T")[0];
    };

    onPeriodChange(formatDateForInput(start), formatDateForInput(end));
    setIsOpen(false);
  };

  const handleCustomDateChange = (type: "start" | "end", value: string) => {
    if (type === "start") {
      onPeriodChange(value, endDate);
    } else {
      onPeriodChange(startDate, value);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="relative flex items-center space-x-2" ref={dropdownRef}>
      <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
        Période
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-[#4271B3] focus:border-[#4271B3] hover:border-[#4271B3]/70 transition-colors text-sm min-w-[140px]"
      >
        <span className="block truncate text-gray-900">{getDisplayText()}</span>
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
        <div className="absolute z-[2000] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg right-0 top-full">
          <div className="p-3 space-y-3">
            {/* Sélections rapides */}
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Sélections rapides
              </div>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => handleQuickSelect(1)}
                  className="w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                >
                  Dernières 24h
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect(2)}
                  className="w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                >
                  Derniers 2 jours
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect(7)}
                  className="w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                >
                  Dernière semaine
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect(30)}
                  className="w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                >
                  Dernier mois
                </button>
              </div>
            </div>

            {/* Séparateur */}
            <div className="border-t border-gray-200"></div>

            {/* Sélection personnalisée */}
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Période personnalisée
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) =>
                      handleCustomDateChange("start", e.target.value)
                    }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#4271B3] focus:border-[#4271B3]"
                    max={endDate}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) =>
                      handleCustomDateChange("end", e.target.value)
                    }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#4271B3] focus:border-[#4271B3]"
                    min={startDate}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignalAirPeriodSelector;
