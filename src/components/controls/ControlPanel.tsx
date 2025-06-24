import React, { useState } from "react";
import PollutantDropdown from "./PollutantDropdown";
import SourceDropdown from "./SourceDropdown";
import TimeStepDropdown from "./TimeStepDropdown";

interface ControlPanelProps {
  selectedPollutant: string;
  selectedSources: string[];
  selectedTimeStep: string;
  onPollutantChange: (pollutant: string) => void;
  onSourceChange: (sources: string[]) => void;
  onTimeStepChange: (timeStep: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedPollutant,
  selectedSources,
  selectedTimeStep,
  onPollutantChange,
  onSourceChange,
  onTimeStepChange,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

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
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
