import React, { useState, useEffect, useCallback } from "react";
import {
  StationInfo,
  ChartControls,
  HistoricalDataPoint,
  SidePanelState,
  ATMOMICRO_POLLUTANT_MAPPING,
} from "../../types";
import { pollutants } from "../../constants/pollutants";
import { AtmoMicroService } from "../../services/AtmoMicroService";
import { getSensorModelImage } from "../../constants/sensorModels";
import HistoricalChart from "./HistoricalChart";
import HistoricalTimeRangeSelector, {
  TimeRange,
} from "../controls/HistoricalTimeRangeSelector";

interface MicroSidePanelProps {
  isOpen: boolean;
  selectedStation: StationInfo | null;
  onClose: () => void;
  onHidden?: () => void;
  onSizeChange?: (size: "normal" | "fullscreen" | "hidden") => void;
  initialPollutant: string;
  panelSize?: "normal" | "fullscreen" | "hidden";
  onComparisonModeToggle?: () => void;
  isComparisonMode?: boolean;
}

type PanelSize = "normal" | "fullscreen" | "hidden";

const MicroSidePanel: React.FC<MicroSidePanelProps> = ({
  isOpen,
  selectedStation,
  onClose,
  onHidden,
  onSizeChange,
  initialPollutant,
  panelSize: externalPanelSize,
  onComparisonModeToggle,
  isComparisonMode = false,
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
      timeStep: "heure",
    },
    historicalData: {},
    loading: false,
    error: null,
  });

  const [internalPanelSize, setInternalPanelSize] =
    useState<PanelSize>("normal");
  const [showPollutantsList, setShowPollutantsList] = useState(false);
  const [hasCorrectedData, setHasCorrectedData] = useState(false);
  const [showRawData, setShowRawData] = useState(true);
  const [sensorTimeStep, setSensorTimeStep] = useState<number | null>(null);

  // Utiliser la taille externe si fournie, sinon la taille interne
  const currentPanelSize = externalPanelSize || internalPanelSize;

  const atmoMicroService = new AtmoMicroService();

  // Fonction utilitaire pour vérifier si un polluant est disponible dans la station
  const isPollutantAvailable = (pollutantCode: string): boolean => {
    return Object.entries(selectedStation?.variables || {}).some(
      ([code, variable]) => {
        return code === pollutantCode && variable.en_service;
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
      setHasCorrectedData(false);
      setShowRawData(true); // Réinitialiser l'affichage des données brutes

      // Charger le pas de temps par défaut du capteur
      if (selectedPollutants.length > 0) {
        atmoMicroService
          .fetchSensorTimeStep(selectedStation.id, selectedPollutants[0])
          .then((timeStep) => {
            setSensorTimeStep(timeStep);
          })
          .catch((error) => {
            console.error(
              "Erreur lors de la récupération du pas de temps:",
              error
            );
            setSensorTimeStep(null);
          });

        // Charger les données historiques initiales
        loadHistoricalData(
          selectedStation,
          selectedPollutants,
          state.chartControls.timeRange,
          state.chartControls.timeStep
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
      timeRange: TimeRange,
      timeStep: string
    ) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { startDate, endDate } = getDateRange(timeRange);
        const newHistoricalData: Record<string, HistoricalDataPoint[]> = {};

        // Charger les données pour chaque polluant sélectionné
        for (const pollutant of pollutants) {
          const data = await atmoMicroService.fetchHistoricalData({
            siteId: station.id,
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
    [atmoMicroService]
  );

  const getDateRange = (
    timeRange: TimeRange
  ): { startDate: string; endDate: string } => {
    const now = new Date();
    const endDate = now.toISOString();

    // Si c'est une plage personnalisée, utiliser les dates fournies
    if (timeRange.type === "custom" && timeRange.custom) {
      // Créer les dates en heure LOCALE (sans Z), puis convertir en UTC
      // Cela permet d'avoir 00:00-23:59 en heure locale, pas en UTC
      const startDate = new Date(timeRange.custom.startDate + "T00:00:00");
      const endDate = new Date(timeRange.custom.endDate + "T23:59:59.999");

      return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
    }

    // Sinon, utiliser les périodes prédéfinies
    let startDate: Date;

    switch (timeRange.preset) {
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
        state.chartControls.timeRange
      );
      atmoMicroService
        .fetchHistoricalData({
          siteId: selectedStation.id,
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

  const handleTimeRangeChange = (timeRange: TimeRange) => {
    setState((prev) => ({
      ...prev,
      chartControls: {
        ...prev.chartControls,
        timeRange,
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
        state.chartControls.timeRange,
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

  const handleHasCorrectedDataChange = (hasCorrected: boolean) => {
    setHasCorrectedData(hasCorrected);
  };

  // Fonction pour formater le pas de temps en secondes vers un format lisible
  const formatTimeStep = (seconds: number | null): string => {
    if (seconds === null) return "Scan";

    if (seconds < 60) {
      return `scan:${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.round(seconds / 60);
      return `scan ${minutes}min`;
    } else if (seconds < 86400) {
      const hours = Math.round(seconds / 3600);
      return `scan:${hours}h`;
    } else {
      const days = Math.round(seconds / 86400);
      return `scan:${days}j`;
    }
  };

  const getPanelClasses = () => {
    const baseClasses =
      "bg-white shadow-xl flex flex-col border-r border-gray-200 transition-all duration-300 h-[calc(100vh-64px)]";

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

  if (!isOpen || !selectedStation) {
    return null;
  }
  console.log(selectedStation);
  return (
    <div className={getPanelClasses()}>
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
            {selectedStation.name}, Microcapteur Qualifié AtmoSud
          </h2>
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
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-3 sm:space-y-4 md:space-y-6">
          {/* Graphique avec contrôles intégrés */}
          <div className="flex-1 min-h-64 sm:min-h-72 md:min-h-80 lg:min-h-96">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-sm font-medium text-gray-700">
                Évolution temporelle (AtmoMicro)
              </h3>
              
              {/* Bouton mode comparaison - sur la ligne du titre */}
              {onComparisonModeToggle && (
                <button
                  onClick={onComparisonModeToggle}
                  className={`px-3 py-1.5 rounded-md text-xs transition-all duration-200 flex items-center ${
                    isComparisonMode
                      ? "text-green-700 bg-green-50 border border-green-200"
                      : "text-gray-700 hover:bg-gray-50 border border-gray-200"
                  }`}
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  {isComparisonMode ? "Désactiver comparaison" : "Activer comparaison"}
                </button>
              )}
            </div>
            {state.loading ? (
              <div className="flex items-center justify-center h-64 sm:h-72 md:h-80 lg:h-96 bg-gray-50 rounded-lg">
                <div className="flex flex-col items-center space-y-2">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                  <span className="text-xs sm:text-sm text-gray-500">
                    Chargement des données...
                  </span>
                </div>
              </div>
            ) : state.error ? (
              <div className="flex items-center justify-center h-64 sm:h-72 md:h-80 lg:h-96 bg-red-50 rounded-lg">
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
                {/* Sélection des polluants et contrôle d'affichage des données brutes sur la même ligne */}
                <div className="flex flex-row items-start gap-2 sm:gap-4 mb-1 sm:mb-4">
                  {/* Sélection des polluants */}
                  <div className="flex-1 border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setShowPollutantsList(!showPollutantsList)}
                      className="w-full flex items-center justify-between p-2 sm:p-3 text-left hover:bg-gray-50 transition-colors rounded-lg"
                    >
                      <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0 flex-1">
                        <svg
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 flex-shrink-0"
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
                        <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                          Polluants
                        </span>
                        <span className="text-[10px] sm:text-xs text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex-shrink-0">
                          {state.chartControls.selectedPollutants.length}
                        </span>
                      </div>
                      <svg
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 transition-transform flex-shrink-0 ${
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
                            // Vérifier si ce polluant est disponible dans la station
                            const isEnabled = isPollutantAvailable(pollutantCode);
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

                  {/* Contrôle d'affichage des données brutes - seulement si des données corrigées sont disponibles */}
                  {hasCorrectedData && (
                    <div className="flex-1 border border-gray-200 rounded-lg">
                      <div className="p-2 sm:p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                            <svg
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                            <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                              Données brutes
                            </span>
                          </div>
                          <button
                            onClick={() => setShowRawData(!showRawData)}
                            className={`relative inline-flex h-4 w-8 sm:h-5 sm:w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                              showRawData ? "bg-blue-600" : "bg-gray-200"
                            }`}
                          >
                            <span
                              className={`inline-block h-2.5 w-2.5 sm:h-3 sm:w-3 transform rounded-full bg-white transition-transform ${
                                showRawData ? "translate-x-4 sm:translate-x-5" : "translate-x-0.5 sm:translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Graphique */}
                <div className="h-80 sm:h-72 md:h-80 lg:h-96 mb-2 sm:mb-3 md:mb-4">
                  <HistoricalChart
                    data={state.historicalData}
                    selectedPollutants={state.chartControls.selectedPollutants}
                    source="atmoMicro"
                    onHasCorrectedDataChange={handleHasCorrectedDataChange}
                    showRawData={showRawData}
                    stationInfo={selectedStation}
                  />
                </div>

                {/* Contrôles du graphique - en bas du graphique */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                  {/* Contrôles de la période - Utilisation du composant réutilisable */}
                  <div className="flex-1 border border-gray-200 rounded-lg p-2 sm:p-2.5 md:p-3">
                    <HistoricalTimeRangeSelector
                      timeRange={state.chartControls.timeRange}
                      onTimeRangeChange={handleTimeRangeChange}
                    />
                  </div>

                  {/* Contrôles du pas de temps */}
                  <div className="flex-1 border border-gray-200 rounded-lg p-2 sm:p-2.5 md:p-3">
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
                        {
                          key: "instantane",
                          label: "Scan",
                          shortLabel: "Scan",
                        },
                        {
                          key: "quartHeure",
                          label: "15min",
                          shortLabel: "15m",
                        },
                        { key: "heure", label: "1h", shortLabel: "1h" },
                        { key: "jour", label: "1j", shortLabel: "1j" },
                      ].map(({ key, label, shortLabel }) => (
                        <button
                          key={key}
                          onClick={() => handleTimeStepChange(key)}
                          className={`px-1.5 py-1 text-xs rounded-md transition-all duration-200 ${
                            state.chartControls.timeStep === key
                              ? "bg-blue-600 text-white shadow-sm"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                          title={
                            key === "instantane" && sensorTimeStep !== null
                              ? formatTimeStep(sensorTimeStep)
                              : label
                          }
                        >
                          <span className="time-step-button-full">
                            {key === "instantane" && sensorTimeStep !== null
                              ? formatTimeStep(sensorTimeStep)
                              : label}
                          </span>
                          <span className="time-step-button-short">
                            {key === "instantane" && sensorTimeStep !== null
                              ? formatTimeStep(sensorTimeStep)
                              : shortLabel}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section Informations et Photo du capteur */}
          {selectedStation && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Photo du capteur */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {getSensorModelImage(selectedStation.sensorModel) ? (
                  <div className="relative w-full aspect-video">
                    <img
                      src={getSensorModelImage(selectedStation.sensorModel)!}
                      alt={`Capteur ${
                        selectedStation.sensorModel || "AtmoMicro"
                      }`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Masquer l'image si elle ne se charge pas
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    {selectedStation.sensorModel && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className="text-white text-xs sm:text-sm font-medium">
                          Modèle : {selectedStation.sensorModel}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full aspect-video bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                    <div className="text-center">
                      <svg
                        className="w-12 h-12 text-blue-400 mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                        />
                      </svg>
                      <p className="text-blue-600 text-xs font-medium">
                        {selectedStation.sensorModel || "Microcapteur AtmoSud"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Encart Informations (vide pour l'instant) */}
              <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <svg
                    className="w-4 h-4 text-blue-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Informations
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 mr-2"></div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600">
                        Informations supplémentaires à venir
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MicroSidePanel;
