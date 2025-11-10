import React, { useState, useEffect, useCallback } from "react";
import {
  StationInfo,
  ChartControls,
  HistoricalDataPoint,
  ComparisonState,
} from "../../types";
import { pollutants } from "../../constants/pollutants";
import { AtmoRefService } from "../../services/AtmoRefService";
import { AtmoMicroService } from "../../services/AtmoMicroService";
import HistoricalChart from "./HistoricalChart";
import HistoricalTimeRangeSelector, {
  TimeRange,
} from "../controls/HistoricalTimeRangeSelector";

interface ComparisonSidePanelProps {
  isOpen: boolean;
  comparisonState: ComparisonState;
  onClose: () => void;
  onHidden?: () => void;
  onSizeChange?: (size: "normal" | "fullscreen" | "hidden") => void;
  onRemoveStation: (stationId: string) => void;
  onComparisonModeToggle: () => void;
  onLoadComparisonData: (
    stations: StationInfo[],
    pollutant: string,
    timeRange: TimeRange,
    timeStep: string
  ) => Promise<void>;
  panelSize?: "normal" | "fullscreen" | "hidden";
}

type PanelSize = "normal" | "fullscreen" | "hidden";

const ComparisonSidePanel: React.FC<ComparisonSidePanelProps> = ({
  isOpen,
  comparisonState,
  onClose,
  onHidden,
  onSizeChange,
  onRemoveStation,
  onComparisonModeToggle,
  onLoadComparisonData,
  panelSize: externalPanelSize,
}) => {
  const [internalPanelSize, setInternalPanelSize] =
    useState<PanelSize>("normal");
  const [showPollutantsList, setShowPollutantsList] = useState(false);

  // Utiliser la taille externe si fournie, sinon la taille interne
  const currentPanelSize = externalPanelSize || internalPanelSize;

  // Fonction utilitaire pour vérifier si un polluant est disponible dans toutes les stations
  const isPollutantAvailableInAllStations = (
    pollutantCode: string
  ): boolean => {
    return comparisonState.comparedStations.every((station) => {
      return Object.entries(station.variables || {}).some(
        ([code, variable]) => {
          // Mapping des codes selon la source
          let mappedCode = code;
          if (station.source === "atmoRef") {
            // Pour AtmoRef, les clés sont des codes numériques ("01", "03", etc.)
            const atmoRefMapping: Record<string, string> = {
              "01": "so2",
              "03": "no2",
              "08": "o3",
              "24": "pm10",
              "39": "pm25",
              "68": "pm1",
            };
            mappedCode = atmoRefMapping[code] || code;
          }
          // Pour AtmoMicro, les clés sont déjà normalisées ("pm25", "pm10", etc.)
          // Pas besoin de mapping supplémentaire

          return mappedCode === pollutantCode && variable.en_service;
        }
      );
    });
  };

  // Fonction utilitaire pour obtenir les polluants disponibles dans toutes les stations
  const getAvailablePollutants = (): string[] => {
    if (comparisonState.comparedStations.length === 0) return [];

    return Object.entries(pollutants)
      .filter(([pollutantCode]) => {
        return isPollutantAvailableInAllStations(pollutantCode);
      })
      .map(([pollutantCode]) => pollutantCode);
  };

  // Mettre à jour l'état quand les props changent
  useEffect(() => {
    if (isOpen && comparisonState.comparedStations.length > 0) {
      // Déterminer quels polluants sont disponibles dans toutes les stations
      const availablePollutants = getAvailablePollutants();

      // Sélectionner le polluant actuel s'il est disponible, sinon le premier disponible
      const selectedPollutant = availablePollutants.includes(
        comparisonState.selectedPollutant
      )
        ? comparisonState.selectedPollutant
        : availablePollutants.length > 0
        ? availablePollutants[0]
        : "";

      // Charger les données si un polluant est disponible
      if (selectedPollutant) {
        onLoadComparisonData(
          comparisonState.comparedStations,
          selectedPollutant,
          comparisonState.timeRange,
          comparisonState.timeStep
        );
      }

      // Réinitialiser la taille du panel
      setInternalPanelSize("normal");
    } else {
      setInternalPanelSize("hidden");
    }
  }, [
    isOpen,
    comparisonState.comparedStations,
    comparisonState.selectedPollutant,
  ]);

  const handlePollutantChange = (pollutant: string) => {
    // Charger les données pour le nouveau polluant
    onLoadComparisonData(
      comparisonState.comparedStations,
      pollutant,
      comparisonState.timeRange,
      comparisonState.timeStep
    );
  };

  const handleTimeRangeChange = (timeRange: TimeRange) => {
    // Charger les données avec la nouvelle période
    onLoadComparisonData(
      comparisonState.comparedStations,
      comparisonState.selectedPollutant,
      timeRange,
      comparisonState.timeStep
    );
  };

  const handleTimeStepChange = (timeStep: string) => {
    // Charger les données avec le nouveau pas de temps
    onLoadComparisonData(
      comparisonState.comparedStations,
      comparisonState.selectedPollutant,
      comparisonState.timeRange,
      timeStep
    );
  };

  const handlePanelSizeChange = (newSize: PanelSize) => {
    if (onSizeChange) {
      // Si on a un callback externe, l'utiliser
      onSizeChange(newSize);
    } else {
      // Sinon, utiliser l'état interne
      setInternalPanelSize(newSize);
    }

    if (newSize === "hidden" && onHidden) {
      onHidden();
    }
  };

  const getPanelClasses = () => {
    const baseClasses =
      "bg-white shadow-xl flex flex-col border-r border-gray-200 transition-all duration-300 h-full md:h-[calc(100vh-64px)] relative z-[1500]";

    switch (currentPanelSize) {
      case "fullscreen":
        return `${baseClasses} w-full`;
      case "hidden":
        // Retirer complètement du flux pour éviter l'espace réservé
        return `${baseClasses} hidden`;
      case "normal":
      default:
        // Responsive: plein écran sur mobile, largeur réduite pour les petits écrans en paysage
        return `${baseClasses} w-full sm:w-[320px] md:w-[400px] lg:w-[600px] xl:w-[650px]`;
    }
  };

  if (!isOpen || comparisonState.comparedStations.length === 0) {
    return null;
  }

  return (
    <div className={getPanelClasses()}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
            Comparaison multi-sources
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 truncate">
            {comparisonState.comparedStations.length} station(s) sélectionnée(s)
          </p>
        </div>

        {/* Contrôles unifiés du panel */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Bouton agrandir/rétrécir */}
          <button
            onClick={() => 
              handlePanelSizeChange(
                currentPanelSize === "fullscreen" ? "normal" : "fullscreen"
              )
            }
            className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title={
              currentPanelSize === "fullscreen" 
                ? "Rétrécir le panel" 
                : "Agrandir le panel"
            }
          >
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4"
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

          {/* Bouton rabattre */}
          <button
            onClick={() => handlePanelSizeChange("hidden")}
            className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Rabattre le panel"
          >
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4"
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

      {/* Contenu - masqué quand currentPanelSize === 'hidden' */}
      {currentPanelSize !== "hidden" && (
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
          {/* Stations sélectionnées */}
          <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">
                Stations sélectionnées
              </h3>
              
              {/* Bouton désactiver comparaison - repositionné au-dessus de l'encart station */}
              <button
                onClick={onComparisonModeToggle}
                className="px-3 py-1.5 rounded-md text-xs transition-all duration-200 flex items-center text-red-700 hover:bg-red-50 border border-red-200"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Désactiver comparaison
              </button>
            </div>
            <div className="space-y-2">
              {comparisonState.comparedStations.map((station, index) => (
                <div
                  key={station.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {station.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {station.source === "atmoRef"
                        ? "Station de référence"
                        : "Microcapteur"}{" "}
                      - {station.address}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveStation(station.id)}
                    className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Supprimer de la comparaison"
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
              ))}
            </div>
          </div>

          {/* Graphique avec contrôles intégrés */}
          <div className="flex-1 min-h-80 sm:min-h-96">
            <div className="mb-2 sm:mb-3">
              <h3 className="text-sm font-medium text-gray-700">
                Comparaison des données
              </h3>
            </div>
            {comparisonState.loading ? (
              <div className="flex items-center justify-center h-80 sm:h-96 md:h-[28rem] bg-gray-50 rounded-lg">
                <div className="flex flex-col items-center space-y-2">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                  <span className="text-xs sm:text-sm text-gray-500">
                    Chargement des données...
                  </span>
                </div>
              </div>
            ) : comparisonState.error ? (
              <div className="flex items-center justify-center h-80 sm:h-96 md:h-[28rem] bg-red-50 rounded-lg">
                <div className="text-center">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 text-red-400 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-xs sm:text-sm text-red-600">
                    {comparisonState.error}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                {/* Sélection du polluant */}
                <div className="border border-gray-200 rounded-lg mb-3 sm:mb-4">
                  <button
                    onClick={() => setShowPollutantsList(!showPollutantsList)}
                    className="w-full flex items-center justify-between p-2.5 sm:p-3 text-left hover:bg-gray-50 transition-colors rounded-lg"
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
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
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-700 truncate">
                        Polluant comparé
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
                        {pollutants[comparisonState.selectedPollutant]?.name ||
                          comparisonState.selectedPollutant}
                      </span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
                        showPollutantsList ? "rotate-180" : ""
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
                  </button>

                  {showPollutantsList && (
                    <div className="px-2.5 sm:px-3 pb-2.5 sm:pb-3 space-y-1">
                      {getAvailablePollutants().map((pollutantCode) => {
                        const pollutant = pollutants[pollutantCode];
                        const isSelected =
                          comparisonState.selectedPollutant === pollutantCode;

                        return (
                          <button
                            key={pollutantCode}
                            onClick={() => handlePollutantChange(pollutantCode)}
                            className={`w-full flex items-center px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md text-sm transition-all duration-200 ${
                              isSelected
                                ? "text-blue-700 bg-blue-50 border border-blue-200"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <div
                              className={`w-3 h-3 rounded border mr-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                                isSelected
                                  ? "bg-blue-600 border-blue-600"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <svg
                                  className="w-2 h-2 text-white"
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
                            <span className="flex-1 text-left truncate">
                              {pollutant?.name || pollutantCode}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Graphique */}
                <div className="h-80 sm:h-96 md:h-[28rem] mb-3 sm:mb-4">
                  <HistoricalChart
                    data={
                      comparisonState.comparisonData[
                        comparisonState.selectedPollutant
                      ] || {}
                    }
                    selectedPollutants={[comparisonState.selectedPollutant]}
                    source="comparison"
                    stations={comparisonState.comparedStations}
                  />
                </div>

                {/* Contrôles du graphique */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {/* Contrôles de la période */}
                  <div className="flex-1 border border-gray-200 rounded-lg p-2.5 sm:p-3">
                    <HistoricalTimeRangeSelector
                      timeRange={comparisonState.timeRange}
                      onTimeRangeChange={handleTimeRangeChange}
                    />
                  </div>

                  {/* Contrôles du pas de temps */}
                  <div className="flex-1 border border-gray-200 rounded-lg p-2.5 sm:p-3">
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
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">
                        Pas de temps
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { key: "instantane", label: "Scan" },
                        { key: "quartHeure", label: "15min" },
                        { key: "heure", label: "1h" },
                        { key: "jour", label: "1j" },
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => handleTimeStepChange(key)}
                          className={`px-1.5 py-1 text-xs rounded-md transition-all duration-200 ${
                            comparisonState.timeStep === key
                              ? "bg-blue-600 text-white shadow-sm"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonSidePanel;
