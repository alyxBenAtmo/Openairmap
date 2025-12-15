/**
 * EXEMPLE D'IMPLÉMENTATION - SourceDropdown avec système de notifications hybride
 * 
 * Cette version combine :
 * - Indicateurs visuels inline (badges d'avertissement)
 * - Notification contextuelle dans le dropdown
 * - Intégration avec le système de toast
 * 
 * Pour utiliser cette version, remplacez SourceDropdown par SourceDropdownWithNotifications
 * dans ControlPanel.tsx et App.tsx
 */

import React, { useMemo, useRef, useEffect, useState } from "react";
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

interface SourceDropdownWithNotificationsProps {
  selectedSources: string[];
  selectedTimeStep: string;
  onSourceChange: (sources: string[]) => void;
  onTimeStepChange?: (timeStep: string) => void;
  onToast?: (toast: Omit<Toast, "id">) => void; // Callback pour les toasts
}

const SourceDropdownWithNotifications: React.FC<
  SourceDropdownWithNotificationsProps
> = ({
  selectedSources,
  selectedTimeStep,
  onSourceChange,
  onTimeStepChange,
  onToast,
}) => {
  const [incompatibleSource, setIncompatibleSource] = useState<string | null>(
    null
  );

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

  // Vérifier les sources incompatibles
  const incompatibleSources = useMemo(() => {
    return selectedSources.filter(
      (source) => !isSourceCompatibleWithTimeStep(source, selectedTimeStep)
    );
  }, [selectedSources, selectedTimeStep]);

  const handleSourceToggle = (sourceCode: string) => {
    const isCurrentlySelected = selectedSources.includes(sourceCode);
    const isCompatible = isSourceCompatibleWithTimeStep(
      sourceCode,
      selectedTimeStep
    );

    if (!isCurrentlySelected && !isCompatible) {
      // L'utilisateur essaie d'activer une source incompatible
      setIncompatibleSource(sourceCode);

      // Afficher une notification toast
      if (onToast) {
        const supportedSteps = getSupportedTimeStepNames(sourceCode);
        const firstCompatibleStep = getFirstCompatibleTimeStep(sourceCode);
        const sourceName = getSourceDisplayName(sourceCode);

        onToast({
          title: `${sourceName} non disponible`,
          description: `Cette source n'est disponible qu'aux pas de temps : ${supportedSteps.join(", ")}.`,
          variant: "warning",
          action: firstCompatibleStep && onTimeStepChange
            ? {
                label: `Changer vers "${pasDeTemps[firstCompatibleStep]?.name || firstCompatibleStep}"`,
                onClick: () => {
                  onTimeStepChange(firstCompatibleStep);
                  setIncompatibleSource(null);
                },
              }
            : undefined,
          duration: 6000,
        });
      }

      // Ne pas activer la source, mais laisser l'utilisateur voir le message
      return;
    }

    // Comportement normal : activer/désactiver
    const newSources = isCurrentlySelected
      ? selectedSources.filter((s) => s !== sourceCode)
      : [...selectedSources, sourceCode];
    onSourceChange(newSources);
    setIncompatibleSource(null);
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
          className={cn(
            "relative bg-gradient-to-br from-gray-50 to-white border text-gray-800 hover:from-gray-100 hover:to-gray-50 hover:border-gray-300 shadow-sm backdrop-blur-sm rounded-lg px-3 py-2 text-left text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4271B3]/20 focus:border-[#4271B3] min-w-[180px]",
            incompatibleSources.length > 0
              ? "border-amber-300 bg-amber-50/50"
              : "border-gray-200/60"
          )}
        >
          <span className="block truncate pr-6">{getDisplayText()}</span>
          {incompatibleSources.length > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
              !
            </span>
          )}
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
        className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-96 overflow-auto"
      >
        {/* Notification contextuelle pour source incompatible */}
        {incompatibleSource && (
          <>
            <div className="mx-2 mt-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <div className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-900">
                    Source non disponible
                  </p>
                  <p className="mt-1 text-xs text-amber-800">
                    {getSourceDisplayName(incompatibleSource)} n'est disponible
                    qu'aux pas de temps :{" "}
                    {getSupportedTimeStepNames(incompatibleSource).join(", ")}.
                  </p>
                  {getFirstCompatibleTimeStep(incompatibleSource) &&
                    onTimeStepChange && (
                      <button
                        onClick={() => {
                          const step = getFirstCompatibleTimeStep(
                            incompatibleSource
                          );
                          if (step) {
                            onTimeStepChange(step);
                            setIncompatibleSource(null);
                          }
                        }}
                        className="mt-2 text-xs font-medium text-amber-900 underline hover:text-amber-950"
                      >
                        Changer le pas de temps
                      </button>
                    )}
                </div>
                <button
                  onClick={() => setIncompatibleSource(null)}
                  className="text-amber-600 hover:text-amber-800"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Stations de référence */}
        <div className="p-1">
          <SourceItem
            code="atmoRef"
            name="Station de référence atmosud"
            isSelected={selectedSources.includes("atmoRef")}
            isCompatible={isSourceCompatibleWithTimeStep(
              "atmoRef",
              selectedTimeStep
            )}
            onToggle={() => handleSourceToggle("atmoRef")}
          />
        </div>

        <DropdownMenuSeparator />

        {/* NebuleAir */}
        <div className="p-1">
          <SourceItem
            code="microcapteursQualifies"
            name="NebuleAir"
            isSelected={allMicrocapteursQualifiesSelected}
            isCompatible={true}
            onToggle={() =>
              handleGroupToggle(
                "microcapteursQualifies",
                microcapteursQualifiesSources
              )
            }
          />
        </div>

        <DropdownMenuSeparator />

        {/* Autre capteur communautaire */}
        <div className="p-1">
          <SourceItem
            code="autreCapteurCommunautaire"
            name="Autre capteur communautaire"
            isSelected={allAutreCapteurCommunautaireSelected}
            isCompatible={true}
            onToggle={() =>
              handleGroupToggle(
                "autreCapteurCommunautaire",
                autreCapteurCommunautaireSources
              )
            }
          />
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
            <SourceItem
              code="capteurEnMobilite.mobileair"
              name="MobileAir"
              isSelected={selectedSources.includes("capteurEnMobilite.mobileair")}
              isCompatible={isSourceCompatibleWithTimeStep(
                "capteurEnMobilite.mobileair",
                selectedTimeStep
              )}
              supportedTimeSteps={getSupportedTimeStepNames("capteurEnMobilite.mobileair")}
              onToggle={() => handleSourceToggle("capteurEnMobilite.mobileair")}
            />
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
            <SourceItem
              code="signalementCommunautaire.signalair"
              name="SignalAir"
              isSelected={selectedSources.includes(
                "signalementCommunautaire.signalair"
              )}
              isCompatible={isSourceCompatibleWithTimeStep(
                "signalementCommunautaire.signalair",
                selectedTimeStep
              )}
              supportedTimeSteps={getSupportedTimeStepNames("signalementCommunautaire.signalair")}
              onToggle={() =>
                handleSourceToggle("signalementCommunautaire.signalair")
              }
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Composant pour un item de source avec indicateur visuel
interface SourceItemProps {
  code: string;
  name: string;
  isSelected: boolean;
  isCompatible: boolean;
  supportedTimeSteps?: string[];
  onToggle: () => void;
}

const SourceItem: React.FC<SourceItemProps> = ({
  name,
  isSelected,
  isCompatible,
  supportedTimeSteps,
  onToggle,
}) => {
  return (
    <div className="relative">
      <DropdownMenuCheckboxItem
        checked={isSelected}
        onCheckedChange={onToggle}
        className={cn(
          "py-1.5 pr-3 text-sm",
          isSelected && "bg-[#e7eef8] text-[#1f3c6d]",
          !isCompatible && !isSelected && "opacity-60"
        )}
        disabled={!isCompatible && !isSelected}
      >
        <div className="flex items-center justify-between w-full">
          <span>{name}</span>
          {!isCompatible && (
            <span
              className="ml-2 flex items-center gap-1 text-amber-600"
              title={`Disponible uniquement en : ${supportedTimeSteps?.join(", ")}`}
            >
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          )}
        </div>
      </DropdownMenuCheckboxItem>
    </div>
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
      if (isIndeterminate) {
        checkboxRef.current.setAttribute("data-state", "indeterminate");
      } else if (allSelected) {
        checkboxRef.current.setAttribute("data-state", "checked");
      } else {
        checkboxRef.current.setAttribute("data-state", "unchecked");
      }
    }
  }, [allSelected, isIndeterminate]);

  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center pl-2 pr-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center relative">
        <div className="relative mr-3 flex-shrink-0">
          <Checkbox
            ref={checkboxRef}
            checked={allSelected}
            onCheckedChange={onToggle}
          />
          {isIndeterminate && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-2 h-0.5 bg-[#325a96] rounded" />
            </div>
          )}
        </div>
        <span className="font-medium">{label}</span>
      </div>
    </button>
  );
};

export default SourceDropdownWithNotifications;
