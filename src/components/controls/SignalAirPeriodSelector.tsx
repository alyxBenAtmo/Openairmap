import React from "react";

interface SignalAirPeriodSelectorProps {
  startDate: string;
  endDate: string;
  onPeriodChange: (startDate: string, endDate: string) => void;
  disabled?: boolean;
}

const QUICK_RANGES: Array<{ label: string; days: number }> = [
  { label: "Dernières 24h", days: 1 },
  { label: "Derniers 2 jours", days: 2 },
  { label: "Dernière semaine", days: 7 },
  { label: "Dernier mois", days: 30 },
];

const formatDateForInput = (date: Date): string =>
  date.toISOString().split("T")[0];

const normalizeStartDate = (date: Date) => {
  date.setHours(0, 0, 0, 0);
  return date;
};

const normalizeEndDate = (date: Date) => {
  date.setHours(23, 59, 59, 999);
  return date;
};

const SignalAirPeriodSelector: React.FC<SignalAirPeriodSelectorProps> = ({
  startDate,
  endDate,
  onPeriodChange,
  disabled = false,
}) => {
  const handleQuickSelect = (days: number) => {
    const end = normalizeEndDate(new Date());
    const start = normalizeStartDate(new Date());
    start.setDate(start.getDate() - (days - 1));

    onPeriodChange(formatDateForInput(start), formatDateForInput(end));
  };

  const handleStartDateChange = (value: string) => {
    if (!value) return;
    // Empêcher une date de début supérieure à la date de fin
    if (new Date(value) > new Date(endDate)) {
      onPeriodChange(value, value);
      return;
    }
    onPeriodChange(value, endDate);
  };

  const handleEndDateChange = (value: string) => {
    if (!value) return;
    const today = formatDateForInput(new Date());
    const sanitizedValue =
      new Date(value) > new Date(today) ? today : value;

    if (new Date(sanitizedValue) < new Date(startDate)) {
      onPeriodChange(sanitizedValue, sanitizedValue);
      return;
    }

    onPeriodChange(startDate, sanitizedValue);
  };

  return (
    <div
      className={`space-y-3 ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Sélections rapides
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {QUICK_RANGES.map((range) => (
            <button
              key={range.days}
              type="button"
              onClick={() => handleQuickSelect(range.days)}
              className="px-3 py-2 rounded-md border border-gray-200 text-sm text-gray-700 bg-white hover:border-[#4271B3] hover:text-[#4271B3] transition-colors"
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Période personnalisée
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-600">
              Date de début
            </label>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(event) => handleStartDateChange(event.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4271B3] focus:border-transparent transition-shadow"
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-600">
              Date de fin
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={formatDateForInput(new Date())}
              onChange={(event) => handleEndDateChange(event.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4271B3] focus:border-transparent transition-shadow"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Les signalements SignalAir sont disponibles sur un horizon glissant de
          30 jours maximum.
        </p>
      </div>
    </div>
  );
};

export default SignalAirPeriodSelector;
