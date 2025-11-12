import React, { useState, useRef, useEffect } from "react";

export interface TimeRange {
  type: "preset" | "custom";
  preset?: "3h" | "24h" | "7d" | "1y";
  custom?: {
    startDate: string;
    endDate: string;
  };
}

interface HistoricalTimeRangeSelectorProps {
  timeRange: TimeRange;
  onTimeRangeChange: (timeRange: TimeRange) => void;
  className?: string;
}

const HistoricalTimeRangeSelector: React.FC<
  HistoricalTimeRangeSelectorProps
> = ({ timeRange, onTimeRangeChange, className = "" }) => {
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialiser les dates personnalisées si elles existent
  useEffect(() => {
    if (timeRange.type === "custom" && timeRange.custom) {
      setCustomStartDate(timeRange.custom.startDate);
      setCustomEndDate(timeRange.custom.endDate);
    } else {
      // Initialiser avec des valeurs par défaut (dernières 24h)
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      setCustomStartDate(yesterday.toISOString().split("T")[0]);
      setCustomEndDate(now.toISOString().split("T")[0]);
    }
  }, [timeRange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsCustomOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePresetChange = (preset: "3h" | "24h" | "7d" | "1y") => {
    onTimeRangeChange({
      type: "preset",
      preset,
    });
  };

  const handleCustomToggle = () => {
    setIsCustomOpen(!isCustomOpen);
  };

  const handleCustomDateChange = (type: "start" | "end", value: string) => {
    if (type === "start") {
      setCustomStartDate(value);
    } else {
      setCustomEndDate(value);
    }
    // Ne pas charger automatiquement les données
    // L'utilisateur devra cliquer sur "Charger les données"
  };

  const handleLoadCustomRange = () => {
    if (customStartDate && customEndDate) {
      onTimeRangeChange({
        type: "custom",
        custom: {
          startDate: customStartDate,
          endDate: customEndDate,
        },
      });
      setIsCustomOpen(false);
    }
  };

  const handleQuickSelect = (option: { type: "days" | "months"; value: number }) => {
    const end = new Date();
    const start = new Date();

    if (option.type === "days") {
      start.setDate(start.getDate() - option.value);
    } else {
      const currentDay = start.getDate();
      start.setMonth(start.getMonth() - option.value);
      // Corriger les mois avec moins de jours en se rabattant sur le dernier jour disponible
      if (start.getDate() !== currentDay) {
        start.setDate(0);
      }
    }

    const formatDateForInput = (date: Date): string => {
      return date.toISOString().split("T")[0];
    };

    const startDateStr = formatDateForInput(start);
    const endDateStr = formatDateForInput(end);

    setCustomStartDate(startDateStr);
    setCustomEndDate(endDateStr);

    onTimeRangeChange({
      type: "custom",
      custom: {
        startDate: startDateStr,
        endDate: endDateStr,
      },
    });
    setIsCustomOpen(false);
  };

  const getDisplayText = () => {
    if (timeRange.type === "custom" && timeRange.custom) {
      const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      };
      return `${formatDate(timeRange.custom.startDate)} - ${formatDate(
        timeRange.custom.endDate
      )}`;
    }

    const presetLabels: Record<string, string> = {
      "3h": "3h",
      "24h": "24h",
      "7d": "7j",
      "1y": "1an",
    };

    return presetLabels[timeRange.preset || "24h"] || "24h";
  };

  const isCustomSelected = timeRange.type === "custom";

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="flex items-center space-x-2 mb-2.5 sm:mb-3">
        <svg
          className="w-4 h-4 text-gray-600 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-sm font-medium text-gray-700">Historique</span>
      </div>

      {/* Boutons des périodes prédéfinies */}
      <div className="grid grid-cols-4 gap-1 mb-2">
        {[
          { key: "3h", label: "3h" },
          { key: "24h", label: "24h" },
          { key: "7d", label: "7j" },
          { key: "1y", label: "1an" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() =>
              handlePresetChange(key as "3h" | "24h" | "7d" | "1y")
            }
            className={`px-1.5 py-1 text-xs rounded-md transition-all duration-200 ${
              timeRange.type === "preset" && timeRange.preset === key
                ? "bg-[#4271B3] text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Bouton pour la sélection personnalisée */}
      <button
        onClick={handleCustomToggle}
        className={`w-full px-2.5 py-1.5 text-xs rounded-md transition-all duration-200 border ${
          isCustomSelected
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center">
            <svg
              className="w-3 h-3 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {isCustomSelected ? getDisplayText() : "Période personnalisée"}
          </span>
          <svg
            className={`w-3 h-3 transition-transform ${
              isCustomOpen ? "rotate-180" : ""
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
        </div>
      </button>

      {/* Dropdown pour la sélection personnalisée */}
      {isCustomOpen && (
        <div className="absolute z-[2000] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-3 space-y-3">
            {/* Sélections rapides */}
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Sélections rapides
              </div>
              <div className="grid grid-cols-1 gap-1">
                <button
                  type="button"
                  onClick={() => handleQuickSelect({ type: "days", value: 30 })}
                  className="text-left px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 rounded transition-colors"
                >
                  30 derniers jours
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect({ type: "months", value: 3 })}
                  className="text-left px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 rounded transition-colors"
                >
                  3 derniers mois
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
                    value={customStartDate}
                    onChange={(e) =>
                      handleCustomDateChange("start", e.target.value)
                    }
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    max={
                      customEndDate || new Date().toISOString().split("T")[0]
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) =>
                      handleCustomDateChange("end", e.target.value)
                    }
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    min={customStartDate}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              {/* Bouton Charger les données */}
              <button
                type="button"
                onClick={handleLoadCustomRange}
                disabled={!customStartDate || !customEndDate}
                className={`w-full mt-3 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
                  customStartDate && customEndDate
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Charger les données
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalTimeRangeSelector;
