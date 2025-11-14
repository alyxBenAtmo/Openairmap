import React, { useState, useMemo, useEffect, useCallback } from "react";
import AirQualityMap from "./components/map/AirQualityMap";
import { useAirQualityData } from "./hooks/useAirQualityData";
import { useTemporalVisualization } from "./hooks/useTemporalVisualization";
import { useDomainConfig } from "./hooks/useDomainConfig";
import {
  pollutants,
  getDefaultPollutant,
  isPollutantSupportedForTimeStep,
  getSupportedPollutantsForTimeStep,
} from "./constants/pollutants";
import { pasDeTemps } from "./constants/timeSteps";
import { getDefaultSources } from "./constants/sources";
import AutoRefreshControl from "./components/controls/AutoRefreshControl";
import PollutantDropdown from "./components/controls/PollutantDropdown";
import SourceDropdown from "./components/controls/SourceDropdown";
import TimeStepDropdown from "./components/controls/TimeStepDropdown";
import HistoricalModeButton from "./components/controls/HistoricalModeButton";
import HistoricalControlPanel from "./components/controls/HistoricalControlPanel";
import MobileMenuBurger from "./components/controls/MobileMenuBurger";
import ModelingLayerControl from "./components/controls/ModelingLayerControl";
import InformationModal from "./components/modals/InformationModal";
import { ModelingLayerType } from "./constants/mapLayers";

const App: React.FC = () => {
  // Configuration basée sur le domaine
  const domainConfig = useDomainConfig();

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

  const SIGNAL_AIR_DEFAULT_TYPES = useMemo(
    () => ["odeur", "bruit", "brulage", "visuel"],
    []
  );

  // États pour les contrôles avec polluant par défaut
  const [selectedPollutant, setSelectedPollutant] = useState<string>(
    getDefaultPollutant()
  );
  const [selectedSources, setSelectedSources] = useState<string[]>(
    getDefaultSources()
  );
  const [selectedTimeStep, setSelectedTimeStep] =
    useState<string>(defaultTimeStep);
  const [signalAirPeriod, setSignalAirPeriod] = useState(
    defaultSignalAirPeriod
  );
  const [signalAirDraftPeriod, setSignalAirDraftPeriod] = useState(
    defaultSignalAirPeriod
  );
  const [signalAirSelectedTypes, setSignalAirSelectedTypes] = useState<string[]>(
    SIGNAL_AIR_DEFAULT_TYPES
  );
  const [signalAirLoadTrigger, setSignalAirLoadTrigger] = useState(0);
  const [currentModelingLayer, setCurrentModelingLayer] =
    useState<ModelingLayerType | null>(null);

  const resetSignalAirSettings = useCallback(() => {
    const resetPeriod = {
      startDate: defaultSignalAirPeriod.startDate,
      endDate: defaultSignalAirPeriod.endDate,
    };
    setSignalAirSelectedTypes([...SIGNAL_AIR_DEFAULT_TYPES]);
    setSignalAirLoadTrigger(0);
    setSignalAirPeriod(resetPeriod);
    setSignalAirDraftPeriod(resetPeriod);
  }, [SIGNAL_AIR_DEFAULT_TYPES, defaultSignalAirPeriod]);

  // États pour MobileAir
  const [mobileAirPeriod, setMobileAirPeriod] = useState(
    defaultSignalAirPeriod // Utiliser la même période par défaut
  );
  const [selectedMobileAirSensor, setSelectedMobileAirSensor] = useState<
    string | null
  >(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Fonction wrapper pour gérer le changement de période SignalAir
  const handleSignalAirDraftPeriodChange = (
    startDate: string,
    endDate: string
  ) => {
    setSignalAirDraftPeriod({ startDate, endDate });
  };

  const handleSignalAirTypesChange = (types: string[]) => {
    setSignalAirSelectedTypes(types);
  };

  const handleSignalAirLoadRequest = () => {
    if (signalAirSelectedTypes.length === 0) {
      return;
    }
    setSignalAirPeriod({
      startDate: signalAirDraftPeriod.startDate,
      endDate: signalAirDraftPeriod.endDate,
    });
    setSignalAirLoadTrigger((prev) => prev + 1);
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

  // Fonction pour désélectionner la source MobileAir
  const handleMobileAirSourceDeselected = () => {
    // Retirer communautaire.mobileair des sources sélectionnées
    setSelectedSources(selectedSources.filter(source => source !== "communautaire.mobileair"));
    // Réinitialiser les états MobileAir
    setSelectedMobileAirSensor(null);
    setMobileAirPeriod(defaultSignalAirPeriod);
  };

  const handleSignalAirSourceDeselected = () => {
    setSelectedSources((sources) =>
      sources.filter((source) => source !== "signalair")
    );
    resetSignalAirSettings();
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

  useEffect(() => {
    if (!selectedSources.includes("signalair")) {
      resetSignalAirSettings();
    }
  }, [selectedSources, resetSignalAirSettings]);

  // État pour l'auto-refresh - désactivé par défaut
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

  const isSignalAirSelected = selectedSources.includes("signalair");

  const signalAirOptions = useMemo(
    () => ({
      selectedTypes: signalAirSelectedTypes,
      loadTrigger: signalAirLoadTrigger,
      isSourceSelected: isSignalAirSelected,
    }),
    [signalAirSelectedTypes, signalAirLoadTrigger, isSignalAirSelected]
  );

  useEffect(() => {
    if (
      !isPollutantSupportedForTimeStep(selectedPollutant, selectedTimeStep)
    ) {
      const supportedPollutants =
        getSupportedPollutantsForTimeStep(selectedTimeStep);
      if (supportedPollutants.length > 0) {
        setSelectedPollutant((current) =>
          supportedPollutants.includes(current)
            ? current
            : supportedPollutants[0]
        );
      }
    }
  }, [selectedPollutant, selectedTimeStep]);

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
    signalAirOptions,
    autoRefreshEnabled: autoRefreshEnabled && !isHistoricalModeActive, // Désactiver l'auto-refresh en mode historique
  });

  // Déterminer quelles données utiliser selon le mode
  const devices = isHistoricalModeActive ? getCurrentDevices() : normalDevices;

  const signalAirReports = useMemo(
    () => reports.filter((report) => report.source === "signalair"),
    [reports]
  );

  const isSignalAirLoading = loadingSources.includes("signalair");
  const hasSignalAirLoaded = signalAirLoadTrigger > 0;

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

  // Configuration de la carte basée sur le domaine
  const mapCenter = domainConfig.mapCenter;
  const mapZoom = domainConfig.mapZoom;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header avec contrôles intégrés */}
      <header className="bg-white border-b border-gray-200 px-4 py-1 z-[1000]">
        <div className="flex items-center justify-between">
          {/* Titre et logo groupés à gauche */}
          <div className="flex items-start space-x-3 md:space-x-4">
            <div className="flex items-center space-x-2">
              <img
                src={domainConfig.logo}
                alt={`${domainConfig.organization} logo principal`}
                className="h-8 md:h-11"
              />
            </div>

            <h1 className="text-lg md:text-xl font-semibold text-[#4271B3] leading-none">
              {domainConfig.title}
            </h1>
          </div>

          {/* Menu burger sur mobile */}
          <MobileMenuBurger
            selectedPollutant={selectedPollutant}
            onPollutantChange={setSelectedPollutant}
            selectedSources={selectedSources}
            onSourceChange={setSelectedSources}
            selectedTimeStep={selectedTimeStep}
            onTimeStepChange={setSelectedTimeStep}
            isHistoricalModeActive={isHistoricalModeActive}
            onToggleHistoricalMode={toggleHistoricalMode}
            autoRefreshEnabled={autoRefreshEnabled}
            onToggleAutoRefresh={setAutoRefreshEnabled}
            lastRefresh={lastRefresh}
            loading={loading}
            currentModelingLayer={currentModelingLayer}
            onModelingLayerChange={setCurrentModelingLayer}
          />

          {/* Contrôles intégrés dans l'en-tête - Desktop uniquement */}
          <div className="hidden lg:flex items-center space-x-2">
            <div className="flex items-center space-x-3">              
              <PollutantDropdown
                selectedPollutant={selectedPollutant}
                onPollutantChange={setSelectedPollutant}
                selectedTimeStep={selectedTimeStep}
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
            </div>

            <div className="flex items-center space-x-4 border-gray-300 pl-6 text-xs text-gray-600">
              <AutoRefreshControl
                enabled={autoRefreshEnabled && !isHistoricalModeActive}
                onToggle={setAutoRefreshEnabled}
                lastRefresh={lastRefresh}
                loading={loading}
                selectedTimeStep={selectedTimeStep}
              />
            </div>
            <div className="flex items-center space-x-4 border-gray-300 pl-2 border-l">

              <ModelingLayerControl
                  currentModelingLayer={currentModelingLayer}
                  onModelingLayerChange={setCurrentModelingLayer}
                  selectedPollutant={selectedPollutant}
                  selectedTimeStep={selectedTimeStep}
                />
            </div>
            <div className="flex items-center space-x-3 border-l border-r border-gray-300 pl-2 pr-2">
              
              <HistoricalModeButton
                isActive={isHistoricalModeActive}
                onToggle={toggleHistoricalMode}
              />
            </div>

            <button
              type="button"
              onClick={() => setIsInfoModalOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#325A96] text-sm font-semibold text-[#325A96] transition hover:bg-gray-100 hover:text-gray-900"
              aria-label="Informations sur OpenAirMap"
            >
              i
            </button>
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
          selectedTimeStep={selectedTimeStep}
          currentModelingLayer={currentModelingLayer}
          loading={loading || temporalState.loading}
          signalAirPeriod={signalAirDraftPeriod}
          signalAirSelectedTypes={signalAirSelectedTypes}
          onSignalAirPeriodChange={handleSignalAirDraftPeriodChange}
          onSignalAirTypesChange={handleSignalAirTypesChange}
          onSignalAirLoadRequest={handleSignalAirLoadRequest}
          isSignalAirLoading={isSignalAirLoading}
          signalAirHasLoaded={hasSignalAirLoaded}
          signalAirReportsCount={signalAirReports.length}
          onSignalAirSourceDeselected={handleSignalAirSourceDeselected}
          onMobileAirSensorSelected={handleMobileAirSensorSelected}
          onMobileAirSourceDeselected={handleMobileAirSourceDeselected}
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
      </main>

      <InformationModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        domainConfig={domainConfig}
      />
    </div>
  );
};

export default App;
