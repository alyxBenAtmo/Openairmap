import React, { useState, useEffect, useCallback } from "react";
import {
  StationInfo,
  ChartControls,
  HistoricalDataPoint,
  SidePanelState,
  ATMOREF_POLLUTANT_MAPPING,
} from "../../types";
import { pollutants } from "../../constants/pollutants";
import { pasDeTemps } from "../../constants/timeSteps";
import { AtmoRefService } from "../../services/AtmoRefService";
import HistoricalChart from "./HistoricalChart";

interface StationSidePanelProps {
  isOpen: boolean;
  selectedStation: StationInfo | null;
  onClose: () => void;
  onHidden?: () => void;
  onSizeChange?: (size: "normal" | "fullscreen" | "hidden") => void;
  initialPollutant: string;
  panelSize?: "normal" | "fullscreen" | "hidden";
}

type PanelSize = "normal" | "fullscreen" | "hidden";

const StationSidePanel: React.FC<StationSidePanelProps> = ({
  isOpen,
  selectedStation,
  onClose,
  onHidden,
  onSizeChange,
  initialPollutant,
  panelSize: externalPanelSize,
}) => {
  const [state, setState] = useState<SidePanelState>({
    isOpen: false,
    selectedStation: null,
    chartControls: {
      selectedPollutants: [initialPollutant],
      timeRange: {
        type: "preset",
        preset: "24h",
      },
      timeStep: "quartHeure",
    },
    historicalData: {},
    loading: false,
    error: null,
  });

  const [internalPanelSize, setInternalPanelSize] =
    useState<PanelSize>("normal");
  const [showPollutantsList, setShowPollutantsList] = useState(false);

  // Utiliser la taille externe si fournie, sinon la taille interne
  const currentPanelSize = externalPanelSize || internalPanelSize;

  const atmoRefService = new AtmoRefService();

  // Fonction utilitaire pour vérifier si un polluant est disponible dans la station
  const isPollutantAvailable = (pollutantCode: string): boolean => {
    return Object.entries(selectedStation?.variables || {}).some(
      ([code, variable]) => {
        const mappedCode = ATMOREF_POLLUTANT_MAPPING[code];
        return mappedCode === pollutantCode && variable.en_service;
      }
    );
  };

  // Fonction utilitaire pour obtenir les polluants disponibles dans la station
  const getAvailablePollutants = (): string[] => {
    if (!selectedStation) return [];

    return Object.entries(pollutants)
      .filter(([pollutantCode]) => {
        return isPollutantAvailable(pollutantCode);
      })
      .map(([pollutantCode]) => pollutantCode);
  };

  // Mettre à jour l'état quand les props changent
  useEffect(() => {
    if (isOpen && selectedStation) {
      // Déterminer quels polluants sont disponibles dans cette station
      const availablePollutants = getAvailablePollutants();

      // Sélectionner le polluant initial s'il est disponible, sinon le premier disponible
      const selectedPollutants = availablePollutants.includes(initialPollutant)
        ? [initialPollutant]
        : availablePollutants.length > 0
        ? [availablePollutants[0]]
        : [];

      setState((prev) => ({
        ...prev,
        isOpen,
        selectedStation,
        chartControls: {
          ...prev.chartControls,
          selectedPollutants,
        },
        historicalData: {},
        loading: false,
        error: null,
      }));

      // Réinitialiser la taille du panel
      setInternalPanelSize("normal");

      // Charger les données historiques initiales si des polluants sont disponibles
      if (selectedPollutants.length > 0) {
        loadHistoricalData(
          selectedStation,
          selectedPollutants,
          "24h",
          "quartHeure"
        );
      }
    } else {
      setState((prev) => ({
        ...prev,
        isOpen: false,
        selectedStation: null,
      }));
      setInternalPanelSize("hidden");
    }
  }, [isOpen, selectedStation, initialPollutant]);

  const loadHistoricalData = useCallback(
    async (
      station: StationInfo,
      pollutants: string[],
      timeRange: string,
      timeStep: string
    ) => {
      // Pour l'instant, on ne supporte que AtmoRef
      // TODO: Ajouter le support pour d'autres sources
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { startDate, endDate } = getDateRange(timeRange);
        const newHistoricalData: Record<string, HistoricalDataPoint[]> = {};

        // Charger les données pour chaque polluant sélectionné
        for (const pollutant of pollutants) {
          const data = await atmoRefService.fetchHistoricalData({
            stationId: station.id,
            pollutant,
            timeStep,
            startDate,
            endDate,
          });
          newHistoricalData[pollutant] = data;
        }

        setState((prev) => ({
          ...prev,
          historicalData: newHistoricalData,
          loading: false,
        }));
      } catch (error) {
        console.error(
          "Erreur lors du chargement des données historiques:",
          error
        );
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Erreur lors du chargement des données historiques",
        }));
      }
    },
    [atmoRefService]
  );

  const getDateRange = (
    timeRange: string
  ): { startDate: string; endDate: string } => {
    const now = new Date();
    const endDate = now.toISOString();

    let startDate: Date;

    switch (timeRange) {
      case "3h":
        startDate = new Date(now.getTime() - 3 * 60 * 60 * 1000);
        break;
      case "24h":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    return {
      startDate: startDate.toISOString(),
      endDate,
    };
  };

  const handlePollutantToggle = (pollutant: string) => {
    setState((prev) => {
      const newSelectedPollutants =
        prev.chartControls.selectedPollutants.includes(pollutant)
          ? prev.chartControls.selectedPollutants.filter((p) => p !== pollutant)
          : [...prev.chartControls.selectedPollutants, pollutant];

      return {
        ...prev,
        chartControls: {
          ...prev.chartControls,
          selectedPollutants: newSelectedPollutants,
        },
      };
    });

    // Recharger les données si le polluant n'était pas encore chargé
    if (selectedStation && !state.historicalData[pollutant]) {
      const { startDate, endDate } = getDateRange(
        state.chartControls.timeRange.preset || "24h"
      );
      atmoRefService
        .fetchHistoricalData({
          stationId: selectedStation.id,
          pollutant,
          timeStep: state.chartControls.timeStep,
          startDate,
          endDate,
        })
        .then((data) => {
          setState((prev) => ({
            ...prev,
            historicalData: {
              ...prev.historicalData,
              [pollutant]: data,
            },
          }));
        });
    }
  };

  const handleTimeRangeChange = (timeRange: string) => {
    setState((prev) => ({
      ...prev,
      chartControls: {
        ...prev.chartControls,
        timeRange: {
          type: "preset",
          preset: timeRange as "3h" | "24h" | "7d" | "1y",
        },
      },
    }));

    if (selectedStation) {
      loadHistoricalData(
        selectedStation,
        state.chartControls.selectedPollutants,
        timeRange,
        state.chartControls.timeStep
      );
    }
  };

  const handleTimeStepChange = (timeStep: string) => {
    setState((prev) => ({
      ...prev,
      chartControls: {
        ...prev.chartControls,
        timeStep,
      },
    }));

    if (selectedStation) {
      loadHistoricalData(
        selectedStation,
        state.chartControls.selectedPollutants,
        state.chartControls.timeRange.preset || "24h",
        timeStep
      );
    }
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
      "fixed inset-y-0 left-0 bg-white shadow-xl z-[2000] flex flex-col border-r border-gray-200 transition-all duration-300";

    switch (currentPanelSize) {
      case "fullscreen":
        return `${baseClasses} w-full`;
      case "hidden":
        return `${baseClasses} w-0 overflow-hidden`;
      case "normal":
      default:
        // Responsive: plein écran sur mobile, largeur fixe plus large sur desktop
        return `${baseClasses} w-full sm:w-[500px] md:w-[650px] lg:w-[700px]`;
    }
  };

  if (!isOpen || !selectedStation) {
    return null;
  }

  return (
    <div className={getPanelClasses()}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
            {selectedStation.name}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 truncate">
            {selectedStation.address}
          </p>
        </div>

        {/* Contrôles de taille du panel - masqués sur mobile */}
        <div className="hidden sm:flex items-center space-x-1 sm:space-x-2 mr-2">
          <button
            onClick={() => handlePanelSizeChange("normal")}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
              currentPanelSize === "normal"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
            title="Taille normale"
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
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>

          <button
            onClick={() => handlePanelSizeChange("fullscreen")}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
              currentPanelSize === "fullscreen"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
            title="Plein écran"
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
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>

          <button
            onClick={() => handlePanelSizeChange("hidden")}
            className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Masquer"
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

        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 sm:p-1 rounded-full hover:bg-gray-200 ml-2"
          title="Fermer"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
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

      {/* Contenu - masqué quand currentPanelSize === 'hidden' */}
      {currentPanelSize !== "hidden" && (
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
          {/* Graphique avec contrôles intégrés */}
          <div className="flex-1 min-h-80 sm:min-h-96 md:min-h-[28rem]">
            <h3 className="text-sm font-medium text-gray-700 mb-2 sm:mb-3">
              Évolution temporelle
            </h3>
            {state.loading ? (
              <div className="flex items-center justify-center h-80 sm:h-96 md:h-[28rem] bg-gray-50 rounded-lg">
                <div className="flex flex-col items-center space-y-2">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                  <span className="text-xs sm:text-sm text-gray-500">
                    Chargement des données...
                  </span>
                </div>
              </div>
            ) : state.error ? (
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
                    {state.error}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                {/* Sélection des polluants - en haut du graphique */}
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
                        Polluants affichés
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
                        {state.chartControls.selectedPollutants.length}{" "}
                        sélectionné(s)
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
                      {Object.entries(pollutants).map(
                        ([pollutantCode, pollutant]) => {
                          // Trouver si ce polluant est disponible dans la station
                          const availableVariable = Object.entries(
                            selectedStation.variables
                          ).find(([code, variable]) => {
                            const mappedCode = ATMOREF_POLLUTANT_MAPPING[code];
                            return (
                              mappedCode === pollutantCode &&
                              variable.en_service
                            );
                          });

                          const isEnabled = !!availableVariable;
                          const isSelected =
                            state.chartControls.selectedPollutants.includes(
                              pollutantCode
                            );

                          return (
                            <button
                              key={pollutantCode}
                              onClick={() =>
                                isEnabled &&
                                handlePollutantToggle(pollutantCode)
                              }
                              disabled={!isEnabled}
                              className={`w-full flex items-center px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md text-sm transition-all duration-200 ${
                                !isEnabled
                                  ? "text-gray-400 cursor-not-allowed"
                                  : isSelected
                                  ? "text-blue-700 bg-blue-50 border border-blue-200"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <div
                                className={`w-3 h-3 rounded border mr-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                                  !isEnabled
                                    ? "border-gray-300 bg-gray-100"
                                    : isSelected
                                    ? "bg-blue-600 border-blue-600"
                                    : "border-gray-300"
                                }`}
                              >
                                {isSelected && isEnabled && (
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
                                {pollutant.name}
                              </span>
                              {!isEnabled && (
                                <span className="text-xs text-gray-400 flex-shrink-0">
                                  Non disponible
                                </span>
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>

                {/* Graphique */}
                <div className="h-80 sm:h-96 md:h-[28rem] mb-3 sm:mb-4">
                  <HistoricalChart
                    data={state.historicalData}
                    selectedPollutants={state.chartControls.selectedPollutants}
                  />
                </div>

                {/* Contrôles du graphique - en bas du graphique */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {/* Contrôles de la période */}
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
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">
                        Historique
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { key: "3h", label: "3h" },
                        { key: "24h", label: "24h" },
                        { key: "7d", label: "7j" },
                        { key: "1y", label: "1an" },
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => handleTimeRangeChange(key)}
                          className={`px-1.5 py-1 text-xs rounded-md transition-all duration-200 ${
                            state.chartControls.timeRange.preset === key
                              ? "bg-blue-600 text-white shadow-sm"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
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
                            state.chartControls.timeStep === key
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

export default StationSidePanel;
