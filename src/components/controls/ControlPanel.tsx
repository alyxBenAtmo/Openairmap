import React, { useState } from "react";
import PollutantDropdown from "./PollutantDropdown";
import SourceDropdown from "./SourceDropdown";
import TimeStepDropdown from "./TimeStepDropdown";
import SignalAirPeriodSelector from "./SignalAirPeriodSelector";

interface ControlPanelProps {
  selectedPollutant: string;
  selectedSources: string[];
  selectedTimeStep: string;
  signalAirPeriod: { startDate: string; endDate: string };
  onPollutantChange: (pollutant: string) => void;
  onSourceChange: (sources: string[]) => void;
  onTimeStepChange: (timeStep: string) => void;
  onSignalAirPeriodChange: (startDate: string, endDate: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedPollutant,
  selectedSources,
  selectedTimeStep,
  signalAirPeriod,
  onPollutantChange,
  onSourceChange,
  onTimeStepChange,
  onSignalAirPeriodChange,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Vérifier si SignalAir est sélectionné
  const isSignalAirSelected = selectedSources.includes("signalair");

  return (
    <div className="absolute top-4 right-4 z-[1000]">
      <div
        className={`bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-300 ${
          isCollapsed ? "w-12 h-12" : "w-80 p-4"
        }`}
      >
        {/* Bouton de toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-700 transition-colors shadow-md z-[1001]"
        >
          {isCollapsed ? "⚙️" : "×"}
        </button>

        {!isCollapsed && (
          <div className="space-y-3">
            <PollutantDropdown
              selectedPollutant={selectedPollutant}
              onPollutantChange={onPollutantChange}
            />
            <SourceDropdown
              selectedSources={selectedSources}
              onSourceChange={onSourceChange}
            />
            <TimeStepDropdown
              selectedTimeStep={selectedTimeStep}
              onTimeStepChange={onTimeStepChange}
            />
            <SignalAirPeriodSelector
              startDate={signalAirPeriod.startDate}
              endDate={signalAirPeriod.endDate}
              onPeriodChange={onSignalAirPeriodChange}
              isVisible={isSignalAirSelected}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
