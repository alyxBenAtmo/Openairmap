import React, { useMemo, useState } from "react";
import { pollutants } from "../../constants/pollutants";
import SignalAirPeriodSelector from "../controls/SignalAirPeriodSelector";
import { getMarkerPath } from "../../utils";

type PanelSize = "normal" | "fullscreen" | "hidden";

interface SignalAirSelectionPanelProps {
  isOpen: boolean;
  selectedPollutant: string;
  selectedTypes: string[];
  period: { startDate: string; endDate: string };
  onClose: () => void;
  onTypesChange: (types: string[]) => void;
  onPeriodChange: (startDate: string, endDate: string) => void;
  onLoadReports: () => void;
  onSizeChange?: (size: PanelSize) => void;
  onHidden?: () => void;
  panelSize?: PanelSize;
  isLoading?: boolean;
  hasLoaded?: boolean;
  reportsCount?: number;
}

const SIGNAL_TYPES: Array<{
  id: "odeur" | "bruit" | "brulage" | "visuel";
  label: string;
  description: string;
  emoji: string;
}> = [
  {
    id: "odeur",
    label: "Odeurs",
    description: "Nuisances olfactives (odeurs persistantes, fumées...)",
    emoji: "👃",
  },
  {
    id: "bruit",
    label: "Bruits",
    description: "Tapage nocturne, nuisances sonores ponctuelles ou continues",
    emoji: "🔊",
  },
  {
    id: "brulage",
    label: "Brûlage",
    description: "Brûlage à l'air libre, fumées d'incinération",
    emoji: "🔥",
  },
  {
    id: "visuel",
    label: "Visuel",
    description: "Brouillard, poussières, visibilité réduite",
    emoji: "👀",
  },
];

const SignalAirSelectionPanel: React.FC<SignalAirSelectionPanelProps> = ({
  isOpen,
  selectedPollutant,
  selectedTypes,
  period,
  onClose,
  onTypesChange,
  onPeriodChange,
  onLoadReports,
  onSizeChange,
  onHidden,
  panelSize: externalPanelSize,
  isLoading = false,
  hasLoaded = false,
  reportsCount = 0,
}) => {
  const [internalPanelSize, setInternalPanelSize] =
    useState<PanelSize>("normal");

  const currentPanelSize = externalPanelSize || internalPanelSize;

  const markerPreview = useMemo(
    () =>
      SIGNAL_TYPES.map((type) => ({
        ...type,
        markerPath: getMarkerPath("signalair", type.id),
      })),
    []
  );

  const handlePanelSizeChange = (newSize: PanelSize) => {
    if (onSizeChange) {
      onSizeChange(newSize);
    } else {
      setInternalPanelSize(newSize);
    }

    if (newSize === "hidden" && onHidden) {
      onHidden();
    }
  };

  const handleTypeToggle = (typeId: string) => {
    if (selectedTypes.includes(typeId)) {
      onTypesChange(selectedTypes.filter((id) => id !== typeId));
    } else {
      onTypesChange([...selectedTypes, typeId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedTypes.length === SIGNAL_TYPES.length) {
      onTypesChange([]);
    } else {
      onTypesChange(SIGNAL_TYPES.map((type) => type.id));
    }
  };

  const getPanelClasses = () => {
    const baseClasses =
      "bg-white shadow-xl flex flex-col border-l border-gray-200 transition-all duration-300 h-full md:h-[calc(100vh-64px)] relative z-[1500]";

    switch (currentPanelSize) {
      case "fullscreen":
        // En fullscreen, utiliser absolute pour ne pas affecter le layout de la carte
        return `${baseClasses} absolute inset-0 w-full max-w-full`;
      case "hidden":
        return `${baseClasses} hidden`;
      case "normal":
      default:
        return `${baseClasses} w-full sm:w-[360px] md:w-[420px] lg:w-[480px] xl:w-[520px]`;
    }
  };

  if (!isOpen) {
    return null;
  }

  const pollutantLabel =
    pollutants[selectedPollutant]?.name || selectedPollutant;

  const isLoadDisabled = selectedTypes.length === 0 || isLoading;

  return (
    <div className={getPanelClasses()}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
            Sélection SignalAir
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 truncate">
            {pollutantLabel}
          </p>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() =>
              handlePanelSizeChange(
                currentPanelSize === "fullscreen" ? "normal" : "fullscreen"
              )
            }
            className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title={
              currentPanelSize === "fullscreen"
                ? "Réduire le panneau"
                : "Afficher en plein écran"
            }
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {currentPanelSize === "fullscreen" ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              )}
            </svg>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Fermer le panel et désactiver SignalAir"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {currentPanelSize !== "hidden" && (
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
          

          {/* Types */}
          <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">
                Types de signalements ({selectedTypes.length}/
                {SIGNAL_TYPES.length})
              </h3>
              <button
                onClick={handleSelectAll}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                {selectedTypes.length === SIGNAL_TYPES.length
                  ? "Tout désélectionner"
                  : "Tout sélectionner"}
              </button>
            </div>

            <div className="space-y-2">
              {markerPreview.map((type) => {
                const isSelected = selectedTypes.includes(type.id);

                return (
                  <button
                    key={type.id}
                    onClick={() => handleTypeToggle(type.id)}
                    className={`w-full flex items-start space-x-3 rounded-lg border p-3 transition-all ${
                      isSelected
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`mt-1 w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <img
                        src={type.markerPath}
                        alt={`Marqueur ${type.label}`}
                        className="w-8 h-8 object-contain"
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center space-x-1">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {type.label}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {type.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Period */}
          <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Période d&apos;analyse
            </h3>
            <SignalAirPeriodSelector
              startDate={period.startDate}
              endDate={period.endDate}
              onPeriodChange={onPeriodChange}
            />
          </div>

          {/* Load button */}
          <div className="border border-gray-200 rounded-lg p-3 sm:p-4 space-y-2">
            <button
              onClick={onLoadReports}
              disabled={isLoadDisabled}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                isLoadDisabled
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              }`}
            >
              {isLoading
                ? "Chargement en cours..."
                : "Charger les signalements"}
            </button>
            {selectedTypes.length === 0 && (
              <p className="text-xs text-red-600">
                Sélectionnez au moins un type de signalement pour lancer le
                chargement.
              </p>
            )}
            {hasLoaded && selectedTypes.length > 0 && (
              <p className="text-xs text-gray-600">
                {reportsCount > 0
                  ? `${reportsCount} signalement${
                      reportsCount > 1 ? "s" : ""
                    } affiché${reportsCount > 1 ? "s" : ""} sur la carte.`
                  : "Aucun signalement trouvé pour la période sélectionnée."}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SignalAirSelectionPanel;

