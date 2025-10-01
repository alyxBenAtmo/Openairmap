import React, { useState, useMemo, useEffect } from "react";
import AirQualityMap from "./components/map/AirQualityMap";
import { useAirQualityData } from "./hooks/useAirQualityData";
import { useTemporalVisualization } from "./hooks/useTemporalVisualization";
import { pollutants, getDefaultPollutant } from "./constants/pollutants";
import { pasDeTemps } from "./constants/timeSteps";
import AutoRefreshControl from "./components/controls/AutoRefreshControl";
import PollutantDropdown from "./components/controls/PollutantDropdown";
import SourceDropdown from "./components/controls/SourceDropdown";
import TimeStepDropdown from "./components/controls/TimeStepDropdown";
import SignalAirPeriodSelector from "./components/controls/SignalAirPeriodSelector";
import HistoricalModeButton from "./components/controls/HistoricalModeButton";
import HistoricalControlPanel from "./components/controls/HistoricalControlPanel";

const App: React.FC = () => {
  // Trouver le pas de temps activé par défaut (calculé une seule fois)
  const defaultTimeStep = useMemo(() => {
    const defaultTimeStep = Object.entries(pasDeTemps).find(
      ([_, timeStep]) => timeStep.activated
    );
    return defaultTimeStep ? defaultTimeStep[0] : "heure";
  }, []);

  // Calculer la période par défaut pour SignalAir (2 derniers jours)
  const defaultSignalAirPeriod = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 2);

    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  }, []);

  // États pour les contrôles avec polluant par défaut
  const [selectedPollutant, setSelectedPollutant] = useState<string>(
    getDefaultPollutant()
  );
  const [selectedSources, setSelectedSources] = useState<string[]>([
    "atmoRef",
    "atmoMicro",
  ]);
  const [selectedTimeStep, setSelectedTimeStep] =
    useState<string>(defaultTimeStep);
  const [signalAirPeriod, setSignalAirPeriod] = useState(
    defaultSignalAirPeriod
  );

  // États pour MobileAir
  const [mobileAirPeriod, setMobileAirPeriod] = useState(
    defaultSignalAirPeriod // Utiliser la même période par défaut
  );
  const [selectedMobileAirSensor, setSelectedMobileAirSensor] = useState<
    string | null
  >(null);

  // Fonction wrapper pour gérer le changement de période SignalAir
  const handleSignalAirPeriodChange = (startDate: string, endDate: string) => {
    setSignalAirPeriod({ startDate, endDate });
  };

  // Fonction pour gérer la sélection d'un capteur MobileAir
  const handleMobileAirSensorSelected = (
    sensorId: string,
    period: { startDate: string; endDate: string }
  ) => {
    setSelectedMobileAirSensor(sensorId);
    setMobileAirPeriod(period);
    // Ajouter communautaire.mobileair aux sources sélectionnées si pas déjà présent
    if (!selectedSources.includes("communautaire.mobileair")) {
      setSelectedSources([...selectedSources, "communautaire.mobileair"]);
    }
  };

  // Effet pour ouvrir automatiquement le side panel MobileAir quand la source est sélectionnée
  useEffect(() => {
    if (
      selectedSources.includes("communautaire.mobileair") &&
      !selectedMobileAirSensor
    ) {
      // MobileAir est sélectionné mais aucun capteur n'est encore choisi
      // Le side panel s'ouvrira automatiquement via le composant AirQualityMap
    }
  }, [selectedSources, selectedMobileAirSensor]);

  // État pour l'auto-refresh
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Hook pour la visualisation temporelle
  const {
    state: temporalState,
    controls: temporalControls,
    toggleHistoricalMode,
    loadHistoricalData,
    getCurrentDevices,
    isHistoricalModeActive,
    hasHistoricalData,
    seekToDate,
    goToPrevious,
    goToNext,
    goToStart,
    goToEnd,
  } = useTemporalVisualization({
    selectedPollutant,
    selectedSources,
    timeStep: selectedTimeStep,
  });

  // Hook pour récupérer les données (mode normal)
  const {
    devices: normalDevices,
    reports,
    loading,
    error,
    loadingSources,
    lastRefresh,
  } = useAirQualityData({
    selectedPollutant,
    selectedSources,
    selectedTimeStep,
    signalAirPeriod,
    mobileAirPeriod,
    selectedMobileAirSensor,
    autoRefreshEnabled: autoRefreshEnabled && !isHistoricalModeActive, // Désactiver l'auto-refresh en mode historique
  });

  // Déterminer quelles données utiliser selon le mode
  const devices = isHistoricalModeActive ? getCurrentDevices() : normalDevices;

  // Fonction pour gérer le chargement des données historiques
  const handleLoadHistoricalData = () => {
    if (temporalState.startDate && temporalState.endDate) {
      loadHistoricalData();
    }
  };

  // Effet pour charger automatiquement les données quand les dates changent en mode historique
  useEffect(() => {
    if (
      isHistoricalModeActive &&
      temporalState.startDate &&
      temporalState.endDate &&
      !temporalState.loading &&
      temporalState.data.length === 0
    ) {
      // Ne pas charger automatiquement, laisser l'utilisateur décider
    }
  }, [
    isHistoricalModeActive,
    temporalState.startDate,
    temporalState.endDate,
    temporalState.loading,
    temporalState.data.length,
  ]);

  const mapCenter: [number, number] = [43.7102, 7.262]; // Nice
  const mapZoom = 9;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header avec contrôles intégrés */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm z-[1000]">
        <div className="flex items-center justify-between">
          {/* Titre et logo groupés à gauche */}
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-semibold text-blue-600">OpenAirMap</h1>
            <img
              src="./logo_atmosud_inspirer_ok_web.png"
              alt="OpenAirMap logo"
              className="h-10"
            />
          </div>

          {/* Contrôles intégrés dans l'en-tête */}
          <div className="flex items-center space-x-4">
            <PollutantDropdown
              selectedPollutant={selectedPollutant}
              onPollutantChange={setSelectedPollutant}
            />
            <SourceDropdown
              selectedSources={selectedSources}
              onSourceChange={setSelectedSources}
            />
            <TimeStepDropdown
              selectedTimeStep={selectedTimeStep}
              selectedSources={selectedSources}
              onTimeStepChange={setSelectedTimeStep}
            />
            <SignalAirPeriodSelector
              startDate={signalAirPeriod.startDate}
              endDate={signalAirPeriod.endDate}
              onPeriodChange={handleSignalAirPeriodChange}
              isVisible={selectedSources.includes("signalair")}
            />

            {/* Bouton mode historique */}
            <HistoricalModeButton
              isActive={isHistoricalModeActive}
              onToggle={toggleHistoricalMode}
            />

            {/* Contrôle auto-refresh */}
            <div className="text-xs text-gray-600 space-x-4 border-l border-gray-300 pl-4">
              <AutoRefreshControl
                enabled={autoRefreshEnabled && !isHistoricalModeActive}
                onToggle={setAutoRefreshEnabled}
                lastRefresh={lastRefresh}
                loading={loading}
                selectedTimeStep={selectedTimeStep}
              />
            </div>
          </div>
        </div>

        {/* Barre de progression pour le chargement */}
        {loading && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div
              className="h-full bg-blue-600 animate-pulse"
              style={{ width: "100%" }}
            ></div>
          </div>
        )}
      </header>

      {/* Carte en plein écran */}
      <main className="flex-1 relative">
        {/* Indicateur de chargement */}
        {loading && (
          <div className="absolute top-4 right-4 z-[1500]">
            <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <div className="flex flex-col">
                  <span className="text-blue-600 text-sm font-medium">
                    {devices.length === 0
                      ? "Chargement des données..."
                      : "Mise à jour en cours..."}
                  </span>
                  {loadingSources.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {loadingSources.length} source
                      {loadingSources.length > 1 ? "s" : ""} en cours
                      {loadingSources.length > 0 && (
                        <span className="ml-1">
                          ({loadingSources.slice(0, 2).join(", ")}
                          {loadingSources.length > 2 && "..."})
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-2 rounded-md shadow-lg z-[1500] max-w-xs">
            <p className="text-xs">Erreur: {error}</p>
          </div>
        )}
        {/* Carte */}
        <AirQualityMap
          devices={devices}
          reports={reports}
          center={mapCenter}
          zoom={mapZoom}
          selectedPollutant={selectedPollutant}
          selectedSources={selectedSources}
          loading={loading || temporalState.loading}
          onMobileAirSensorSelected={handleMobileAirSensorSelected}
        />

        {/* Panel de contrôle historique */}
        <HistoricalControlPanel
          isVisible={isHistoricalModeActive}
          onToggleHistoricalMode={toggleHistoricalMode}
          state={temporalState}
          controls={temporalControls}
          onLoadData={handleLoadHistoricalData}
          onSeekToDate={seekToDate}
          onGoToPrevious={goToPrevious}
          onGoToNext={goToNext}
        />

        {/* Informations de la carte (nombre d'appareils et de signalements) */}
        <div className="absolute bottom-4 right-4 bg-white px-3 py-2 rounded-md shadow-lg z-[1000]">
          <p className="text-xs text-gray-600">
            {devices.length} appareil{devices.length > 1 ? "s" : ""}
            {reports.length > 0 && (
              <span className="ml-2">
                • {reports.length} signalement{reports.length > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;
