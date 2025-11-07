import React, { useState, useRef, useEffect } from "react";
import { pasDeTemps } from "../../constants/timeSteps";
import { sources } from "../../constants/sources";

interface TimeStepDropdownProps {
  selectedTimeStep: string;
  selectedSources: string[];
  onTimeStepChange: (timeStep: string) => void;
}

const TimeStepDropdown: React.FC<TimeStepDropdownProps> = ({
  selectedTimeStep,
  selectedSources,
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

  // Fonction pour obtenir les pas de temps supportés par les sources sélectionnées
  const getSupportedTimeSteps = () => {
    if (!selectedSources || selectedSources.length === 0) {
      return Object.keys(pasDeTemps);
    }

    const allSupportedTimeSteps = new Set<string>();

    selectedSources.forEach((sourceCode) => {
      // Gérer les sources communautaires (communautaire.nebuleair -> nebuleair)
      let actualSourceCode = sourceCode;
      if (sourceCode.startsWith("communautaire.")) {
        actualSourceCode = sourceCode.split(".")[1];
      }

      const source = sources[actualSourceCode];
      if (source) {
        // Ajouter les pas de temps de la source principale
        if (source.supportedTimeSteps) {
          source.supportedTimeSteps.forEach((timeStep) => {
            allSupportedTimeSteps.add(timeStep);
          });
        }

        // Ajouter les pas de temps des sous-sources si c'est un groupe
        if (source.isGroup && source.subSources) {
          Object.values(source.subSources).forEach((subSource) => {
            if (subSource.supportedTimeSteps) {
              subSource.supportedTimeSteps.forEach((timeStep) => {
                allSupportedTimeSteps.add(timeStep);
              });
            }
          });
        }
      } else {
        // Si c'est une source communautaire, chercher dans le groupe communautaire
        const communautaireSource = sources["communautaire"];
        if (communautaireSource && communautaireSource.subSources) {
          const subSource = communautaireSource.subSources[actualSourceCode];
          if (subSource && subSource.supportedTimeSteps) {
            subSource.supportedTimeSteps.forEach((timeStep) => {
              allSupportedTimeSteps.add(timeStep);
            });
          }
        }
      }
    });

    return Array.from(allSupportedTimeSteps);
  };

  const supportedTimeSteps = getSupportedTimeSteps();

  // Vérifier si le pas de temps actuel est toujours supporté
  useEffect(() => {
    if (selectedTimeStep && !supportedTimeSteps.includes(selectedTimeStep)) {
      // Si le pas de temps actuel n'est plus supporté, passer au premier disponible
      const firstSupported = supportedTimeSteps[0];
      if (firstSupported) {
        onTimeStepChange(firstSupported);
      }
    }
  }, [selectedTimeStep, supportedTimeSteps, onTimeStepChange]);

  const handleTimeStepSelect = (code: string) => {
    onTimeStepChange(code);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    const timeStep = pasDeTemps[selectedTimeStep as keyof typeof pasDeTemps];
    return timeStep ? timeStep.name : "Choisir un pas de temps";
  };

  return (
    <div className="relative flex items-center space-x-2" ref={dropdownRef}>
      {/* <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
        Pas de temps
      </label> */}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-[#4271B3] border border-[#4271B3] rounded-md px-2.5 py-1 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-[#4271B3] focus:border-[#4271B3] hover:bg-[#325a96] hover:border-[#325a96] transition-colors text-sm min-w-[110px]"
      >
        <span
          className={`block truncate ${
            selectedTimeStep ? "text-white" : "text-white/80"
          }`}
        >
          {getDisplayText()}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className={`h-4 w-4 text-white/80 transition-transform ${
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
        <div className="absolute z-[2000] w-48 mt-1 bg-white border border-gray-300 rounded-md shadow-lg right-0 top-full">
          <div className="p-1">
            {Object.entries(pasDeTemps)
              .filter(([code]) => supportedTimeSteps.includes(code))
              .map(([code, timeStep]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleTimeStepSelect(code)}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedTimeStep === code
                      ? "bg-[#e7eef8] text-[#1f3c6d] border border-[#c1d3eb]"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border mr-3 flex items-center justify-center ${
                    selectedTimeStep === code
                        ? "bg-[#325a96] border-[#325a96]"
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
