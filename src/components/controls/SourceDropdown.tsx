import React, { useMemo, useRef, useEffect } from "react";
import { sources } from "../../constants/sources";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Checkbox } from "../ui/checkbox";
import { cn } from "../../lib/utils";
import {
  isSourceCompatibleWithTimeStep,
  getSourceDisplayName,
  getSupportedTimeStepNames,
  getFirstCompatibleTimeStep,
} from "../../utils/sourceCompatibility";
import { pasDeTemps } from "../../constants/timeSteps";
import { Toast } from "../ui/toast";

interface SourceDropdownProps {
  selectedSources: string[];
  selectedTimeStep?: string;
  onSourceChange: (sources: string[]) => void;
  onTimeStepChange?: (timeStep: string) => void;
  onToast?: (toast: Omit<Toast, "id">) => void;
}

const SourceDropdown: React.FC<SourceDropdownProps> = ({
  selectedSources,
  selectedTimeStep,
  onSourceChange,
  onTimeStepChange,
  onToast,
}) => {
  // Définir les groupes et leurs sources
  const microcapteursQualifiesSources = [
    "microcapteursQualifies.atmoMicro",
    "microcapteursQualifies.nebuleair",
  ];

  const autreCapteurCommunautaireSources = [
    "autreCapteurCommunautaire.purpleair",
    "autreCapteurCommunautaire.sensorCommunity",
  ];

  const capteurEnMobiliteSources = [
    "capteurEnMobilite.mobileair",
  ];

  const signalementCommunautaireSources = [
    "signalementCommunautaire.signalair",
  ];

  // Vérifier l'état des groupes
  const allMicrocapteursQualifiesSelected = useMemo(
    () =>
      microcapteursQualifiesSources.every((source) =>
        selectedSources.includes(source)
      ),
    [selectedSources]
  );
  const someMicrocapteursQualifiesSelected = useMemo(
    () =>
      microcapteursQualifiesSources.some((source) =>
        selectedSources.includes(source)
      ),
    [selectedSources]
  );

  const allAutreCapteurCommunautaireSelected = useMemo(
    () =>
      autreCapteurCommunautaireSources.every((source) =>
        selectedSources.includes(source)
      ),
    [selectedSources]
  );
  const someAutreCapteurCommunautaireSelected = useMemo(
    () =>
      autreCapteurCommunautaireSources.some((source) =>
        selectedSources.includes(source)
      ),
    [selectedSources]
  );

  const allCapteurEnMobiliteSelected = useMemo(
    () =>
      capteurEnMobiliteSources.every((source) =>
        selectedSources.includes(source)
      ),
    [selectedSources]
  );
  const someCapteurEnMobiliteSelected = useMemo(
    () =>
      capteurEnMobiliteSources.some((source) =>
        selectedSources.includes(source)
      ),
    [selectedSources]
  );

  const allSignalementCommunautaireSelected = useMemo(
    () =>
      signalementCommunautaireSources.every((source) =>
        selectedSources.includes(source)
      ),
    [selectedSources]
  );
  const someSignalementCommunautaireSelected = useMemo(
    () =>
      signalementCommunautaireSources.some((source) =>
        selectedSources.includes(source)
      ),
    [selectedSources]
  );

  const handleSourceToggle = (sourceCode: string) => {
    const isCurrentlySelected = selectedSources.includes(sourceCode);

    // Si on essaie d'activer une source
    if (!isCurrentlySelected) {
      // Vérifier la compatibilité si le pas de temps est fourni
      if (selectedTimeStep && onToast) {
        const isCompatible = isSourceCompatibleWithTimeStep(
          sourceCode,
          selectedTimeStep
        );

        if (!isCompatible) {
          // Afficher une notification toast
          const supportedSteps = getSupportedTimeStepNames(sourceCode);
          const firstCompatibleStep = getFirstCompatibleTimeStep(sourceCode);
          const sourceName = getSourceDisplayName(sourceCode);

          onToast({
            title: `${sourceName} non disponible`,
            description: `Cette source n'est disponible qu'aux pas de temps : ${supportedSteps.join(", ")}.`,
            variant: "warning",
            action:
              firstCompatibleStep && onTimeStepChange
                ? {
                    label: `Changer vers "${pasDeTemps[firstCompatibleStep]?.name || firstCompatibleStep}"`,
                    onClick: () => {
                      onTimeStepChange(firstCompatibleStep);
                    },
                  }
                : undefined,
            duration: 6000,
          });

          // Ne pas activer la source si elle n'est pas compatible
          return;
        }
      }
    }

    // Comportement normal : activer/désactiver
    const newSources = isCurrentlySelected
      ? selectedSources.filter((s) => s !== sourceCode)
      : [...selectedSources, sourceCode];
    onSourceChange(newSources);
  };

  const handleGroupToggle = (
    groupCode: string,
    groupSources: string[]
  ) => {
    const allSelected = groupSources.every((source) =>
      selectedSources.includes(source)
    );

    if (allSelected) {
      // Désélectionner toutes les sources du groupe
      const newSources = selectedSources.filter(
        (source) => !groupSources.includes(source)
      );
      onSourceChange(newSources);
    } else {
      // Sélectionner toutes les sources du groupe
      const newSources = [...selectedSources];
      groupSources.forEach((source) => {
        if (!newSources.includes(source)) {
          newSources.push(source);
        }
      });
      onSourceChange(newSources);
    }
  };

  const getDisplayText = () => {
    if (selectedSources.length === 0) {
      return "Choisir des sources";
    }
    
    // Compter les sources en groupant les sous-sources de microcapteursQualifies
    const hasAtmoRef = selectedSources.includes("atmoRef");
    const hasMicrocapteursQualifies = selectedSources.some(s => 
      s.includes("microcapteursQualifies")
    );
    const hasAutreCapteurCommunautaire = selectedSources.some(s => 
      s.includes("autreCapteurCommunautaire")
    );
    const hasCapteurEnMobilite = selectedSources.some(s => 
      s.includes("capteurEnMobilite")
    );
    const hasSignalementCommunautaire = selectedSources.some(s => 
      s.includes("signalementCommunautaire")
    );
    
    const visibleSourcesCount = [
      hasAtmoRef,
      hasMicrocapteursQualifies,
      hasAutreCapteurCommunautaire,
      hasCapteurEnMobilite,
      hasSignalementCommunautaire,
    ].filter(Boolean).length;
    
    if (visibleSourcesCount === 0) {
      return "Choisir des sources";
    }
    if (visibleSourcesCount === 1) {
      if (hasAtmoRef) return "Station de référence atmosud";
      if (hasMicrocapteursQualifies) return "NebuleAir";
      if (hasAutreCapteurCommunautaire) return "Autre capteur communautaire";
      if (hasCapteurEnMobilite) return "Capteur en mobilité";
      if (hasSignalementCommunautaire) return "Signalement communautaire";
    }
    return `${visibleSourcesCount} sources sélectionnées`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative bg-gradient-to-br from-gray-50 to-white border border-gray-200/60 text-gray-800 hover:from-gray-100 hover:to-gray-50 hover:border-gray-300 shadow-sm backdrop-blur-sm rounded-lg px-3 py-2 text-left text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4271B3]/20 focus:border-[#4271B3] min-w-[180px]"
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
        className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-64 overflow-auto"
      >
        {/* Stations de référence */}
        <div className="p-1">
          <DropdownMenuCheckboxItem
            checked={selectedSources.includes("atmoRef")}
            onCheckedChange={() => handleSourceToggle("atmoRef")}
            className={cn(
              "py-2 pr-3 text-sm",
              selectedSources.includes("atmoRef") &&
                "bg-[#e7eef8] text-[#1f3c6d]"
            )}
          >
            Station de référence atmosud
          </DropdownMenuCheckboxItem>
        </div>

        <DropdownMenuSeparator />

        {/* NebuleAir */}
        <div className="p-1">
          <DropdownMenuCheckboxItem
            checked={allMicrocapteursQualifiesSelected}
            onCheckedChange={() =>
              handleGroupToggle(
                "microcapteursQualifies",
                microcapteursQualifiesSources
              )
            }
            className={cn(
              "py-2 pr-3 text-sm",
              allMicrocapteursQualifiesSelected &&
                "bg-[#e7eef8] text-[#1f3c6d]"
            )}
          >
            NebuleAir
          </DropdownMenuCheckboxItem>
        </div>

        <DropdownMenuSeparator />

        {/* Autre capteur communautaire */}
        <div className="p-1">
          <DropdownMenuCheckboxItem
            checked={allAutreCapteurCommunautaireSelected}
            onCheckedChange={() =>
              handleGroupToggle(
                "autreCapteurCommunautaire",
                autreCapteurCommunautaireSources
              )
            }
            className={cn(
              "py-2 pr-3 text-sm",
              allAutreCapteurCommunautaireSelected &&
                "bg-[#e7eef8] text-[#1f3c6d]"
            )}
          >
            Autre capteur communautaire
          </DropdownMenuCheckboxItem>
        </div>

        <DropdownMenuSeparator />

        {/* Capteur en mobilité */}
        <div className="p-1">
          <GroupCheckbox
            allSelected={allCapteurEnMobiliteSelected}
            someSelected={someCapteurEnMobiliteSelected}
            onToggle={() =>
              handleGroupToggle("capteurEnMobilite", capteurEnMobiliteSources)
            }
            label="Capteur en mobilité"
          />

          {/* Sous-menu capteur en mobilité */}
          <div className="ml-6 mt-1 space-y-1">
            <DropdownMenuCheckboxItem
              checked={selectedSources.includes("capteurEnMobilite.mobileair")}
              onCheckedChange={() =>
                handleSourceToggle("capteurEnMobilite.mobileair")
              }
              className={cn(
                "py-1.5 pr-3 text-sm",
                selectedSources.includes("capteurEnMobilite.mobileair") &&
                  "bg-[#e7eef8] text-[#1f3c6d]"
              )}
            >
              MobileAir
            </DropdownMenuCheckboxItem>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Signalement communautaire */}
        <div className="p-1">
          <GroupCheckbox
            allSelected={allSignalementCommunautaireSelected}
            someSelected={someSignalementCommunautaireSelected}
            onToggle={() =>
              handleGroupToggle(
                "signalementCommunautaire",
                signalementCommunautaireSources
              )
            }
            label="Signalement communautaire"
          />

          {/* Sous-menu signalement communautaire */}
          <div className="ml-6 mt-1 space-y-1">
            <DropdownMenuCheckboxItem
              checked={selectedSources.includes(
                "signalementCommunautaire.signalair"
              )}
              onCheckedChange={() =>
                handleSourceToggle("signalementCommunautaire.signalair")
              }
              className={cn(
                "py-1.5 pr-3 text-sm",
                selectedSources.includes(
                  "signalementCommunautaire.signalair"
                ) && "bg-[#e7eef8] text-[#1f3c6d]"
              )}
            >
              SignalAir
            </DropdownMenuCheckboxItem>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Composant réutilisable pour gérer l'état indéterminé du checkbox d'un groupe
const GroupCheckbox: React.FC<{
  allSelected: boolean;
  someSelected: boolean;
  onToggle: () => void;
  label: string;
}> = ({ allSelected, someSelected, onToggle, label }) => {
  const checkboxRef = useRef<HTMLButtonElement>(null);
  const isIndeterminate = someSelected && !allSelected;

  useEffect(() => {
    if (checkboxRef.current) {
      // Gérer l'état indéterminé pour Radix UI
      if (isIndeterminate) {
        checkboxRef.current.setAttribute("data-state", "indeterminate");
      } else if (allSelected) {
        checkboxRef.current.setAttribute("data-state", "checked");
      } else {
        checkboxRef.current.setAttribute("data-state", "unchecked");
      }
    }
  }, [allSelected, isIndeterminate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      className="w-full flex items-center pl-2 pr-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4271B3]/20 focus:ring-offset-1"
    >
      <div className="flex items-center relative">
        <div className="relative mr-3 flex-shrink-0">
          <Checkbox
            ref={checkboxRef}
            checked={allSelected}
            onCheckedChange={onToggle}
          />
          {/* Indicateur visuel pour l'état indéterminé - centré dans le checkbox */}
          {isIndeterminate && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-2 h-0.5 bg-[#325a96] rounded" />
            </div>
          )}
        </div>
        <span className="font-medium">{label}</span>
      </div>
    </div>
  );
};

export default SourceDropdown;
