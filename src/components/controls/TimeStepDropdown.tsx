import React, { useEffect, useMemo } from "react";
import { pasDeTemps } from "../../constants/timeSteps";
import { sources } from "../../constants/sources";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "../ui/dropdown-menu";
import { cn } from "../../lib/utils";

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
  // Fonction pour obtenir les pas de temps supportés par les sources sélectionnées
  const supportedTimeSteps = useMemo(() => {
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
  }, [selectedSources]);

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

  const getDisplayText = () => {
    const timeStep = pasDeTemps[selectedTimeStep as keyof typeof pasDeTemps];
    return timeStep ? timeStep.name : "Choisir un pas de temps";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative bg-gradient-to-br from-gray-50 to-white border border-gray-200/60 text-gray-800 hover:from-gray-100 hover:to-gray-50 hover:border-gray-300 shadow-sm backdrop-blur-sm rounded-lg px-3 py-2 text-left text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4271B3]/20 focus:border-[#4271B3] min-w-[110px]"
        >
          <span className="block truncate pr-6">{getDisplayText()}</span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-gray-600">
            <svg
              className="h-4 w-4 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        alignOffset={0}
        className="w-[var(--radix-dropdown-menu-trigger-width)]"
      >
        <DropdownMenuRadioGroup
          value={selectedTimeStep}
          onValueChange={onTimeStepChange}
        >
          {Object.entries(pasDeTemps)
            .filter(([code]) => supportedTimeSteps.includes(code))
            .map(([code, timeStep]) => (
              <DropdownMenuRadioItem
                key={code}
                value={code}
                className={cn(
                  "py-2 pr-3 text-sm",
                  selectedTimeStep === code &&
                    "bg-[#e7eef8] text-[#1f3c6d]"
                )}
              >
                {timeStep.name}
              </DropdownMenuRadioItem>
            ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TimeStepDropdown;
