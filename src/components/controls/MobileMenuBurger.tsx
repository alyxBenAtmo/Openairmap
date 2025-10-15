import React, { useState, useEffect, useRef } from "react";
import PollutantDropdown from "./PollutantDropdown";
import SourceDropdown from "./SourceDropdown";
import TimeStepDropdown from "./TimeStepDropdown";
import SignalAirPeriodSelector from "./SignalAirPeriodSelector";
import HistoricalModeButton from "./HistoricalModeButton";
import AutoRefreshControl from "./AutoRefreshControl";

interface MobileMenuBurgerProps {
  selectedPollutant: string;
  onPollutantChange: (pollutant: string) => void;
  selectedSources: string[];
  onSourceChange: (sources: string[]) => void;
  selectedTimeStep: string;
  onTimeStepChange: (timeStep: string) => void;
  signalAirPeriod: {
    startDate: string;
    endDate: string;
  };
  onSignalAirPeriodChange: (startDate: string, endDate: string) => void;
  isHistoricalModeActive: boolean;
  onToggleHistoricalMode: () => void;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: (enabled: boolean) => void;
  lastRefresh: Date | null;
  loading: boolean;
}

const MobileMenuBurger: React.FC<MobileMenuBurgerProps> = ({
  selectedPollutant,
  onPollutantChange,
  selectedSources,
  onSourceChange,
  selectedTimeStep,
  onTimeStepChange,
  signalAirPeriod,
  onSignalAirPeriodChange,
  isHistoricalModeActive,
  onToggleHistoricalMode,
  autoRefreshEnabled,
  onToggleAutoRefresh,
  lastRefresh,
  loading,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  return (
    <div className="relative lg:hidden" ref={menuRef}>
      {/* Bouton burger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        aria-label="Menu"
      >
        <svg
          className="w-6 h-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Menu déroulant */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-screen max-w-sm sm:max-w-md bg-white rounded-lg shadow-xl border border-gray-200 z-[2000] max-h-[80vh] overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Titre */}
            <div className="border-b border-gray-200 pb-2">
              <h3 className="font-semibold text-gray-800">Contrôles</h3>
            </div>

            {/* Polluant */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Polluant
              </label>
              <PollutantDropdown
                selectedPollutant={selectedPollutant}
                onPollutantChange={onPollutantChange}
              />
            </div>

            {/* Sources */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Sources de données
              </label>
              <SourceDropdown
                selectedSources={selectedSources}
                onSourceChange={onSourceChange}
              />
            </div>

            {/* Pas de temps */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Pas de temps
              </label>
              <TimeStepDropdown
                selectedTimeStep={selectedTimeStep}
                selectedSources={selectedSources}
                onTimeStepChange={onTimeStepChange}
              />
            </div>

            {/* Période SignalAir */}
            {selectedSources.includes("signalair") && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Période SignalAir
                </label>
                <SignalAirPeriodSelector
                  startDate={signalAirPeriod.startDate}
                  endDate={signalAirPeriod.endDate}
                  onPeriodChange={onSignalAirPeriodChange}
                  isVisible={true}
                />
              </div>
            )}

            {/* Mode historique */}
            <div className="space-y-2 border-t border-gray-200 pt-4">
              <label className="text-sm font-medium text-gray-700">Mode</label>
              <HistoricalModeButton
                isActive={isHistoricalModeActive}
                onToggle={onToggleHistoricalMode}
              />
            </div>

            {/* Auto-refresh */}
            <div className="space-y-2 border-t border-gray-200 pt-4">
              <label className="text-sm font-medium text-gray-700">
                Actualisation
              </label>
              <AutoRefreshControl
                enabled={autoRefreshEnabled && !isHistoricalModeActive}
                onToggle={onToggleAutoRefresh}
                lastRefresh={lastRefresh}
                loading={loading}
                selectedTimeStep={selectedTimeStep}
              />
            </div>

            {/* Bouton fermer */}
            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileMenuBurger;
