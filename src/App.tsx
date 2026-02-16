import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import AirQualityMap from "./components/map/AirQualityMap";
import { useAirQualityData } from "./hooks/useAirQualityData";
import { useTemporalVisualization } from "./hooks/useTemporalVisualization";
import { useDomainConfig } from "./hooks/useDomainConfig";
import { useFavicon } from "./hooks/useFavicon";
import { useDocumentTitle } from "./hooks/useDocumentTitle";
import {
  pollutants,
  getDefaultPollutant,
  isPollutantSupportedForTimeStep,
  getSupportedPollutantsForTimeStep,
} from "./constants/pollutants";
import { pasDeTemps, isHistoricalModeAllowedForTimeStep } from "./constants/timeSteps";
import { getDefaultSources } from "./constants/sources";
import AutoRefreshControl from "./components/controls/AutoRefreshControl";
import PollutantDropdown from "./components/controls/PollutantDropdown";
import SourceDropdown from "./components/controls/SourceDropdown";
import TimeStepDropdown from "./components/controls/TimeStepDropdown";
import HistoricalModeButton from "./components/controls/HistoricalModeButton";
import HistoricalControlPanel from "./components/controls/HistoricalControlPanel";
import HistoricalPlaybackControl from "./components/controls/HistoricalPlaybackControl";
import MobileMenuBurger from "./components/controls/MobileMenuBurger";
import ModelingLayerControl from "./components/controls/ModelingLayerControl";
import InformationModal from "./components/modals/InformationModal";
import { ModelingLayerType } from "./constants/mapLayers";
import { useToast } from "./hooks/useToast";
import { ToastContainer } from "./components/ui/toast";

const App: React.FC = () => {
  // Configuration basée sur le domaine
  const domainConfig = useDomainConfig();

  // Gestion dynamique de la favicon et du titre
  useFavicon(domainConfig.favicon);
  useDocumentTitle(domainConfig.title);

  // Hook pour les notifications toast
  const { toasts, addToast, removeToast } = useToast();

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
  const [signalAirSelectedTypes, setSignalAirSelectedTypes] = useState<
    string[]
  >(SIGNAL_AIR_DEFAULT_TYPES);
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

  // États pour gérer SignalAir et MobileAir indépendamment du système de sources
  const [isSignalAirEnabled, setIsSignalAirEnabled] = useState(false);
  const [isMobileAirEnabled, setIsMobileAirEnabled] = useState(false);
  const [isSignalAirVisible, setIsSignalAirVisible] = useState(true);
  const [isMobileAirVisible, setIsMobileAirVisible] = useState(true);

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
    // Toujours mettre à jour pour forcer le rechargement même si les valeurs sont identiques
    // Cela permet de recharger les données qui remplaceront celles existantes
    setSelectedMobileAirSensor(sensorId);
    setMobileAirPeriod(period);
    // Activer MobileAir
    setIsMobileAirEnabled(true);
    setIsMobileAirVisible(true);
  };

  // Fonction pour désélectionner la source MobileAir
  const handleMobileAirSourceDeselected = () => {
    // Réinitialiser les états MobileAir
    setSelectedMobileAirSensor(null);
    setMobileAirPeriod(defaultSignalAirPeriod);
    setIsMobileAirEnabled(false);
    setIsMobileAirVisible(false);
  };

  const handleSignalAirSourceDeselected = () => {
    resetSignalAirSettings();
    setIsSignalAirEnabled(false);
    setIsSignalAirVisible(false);
  };

  // Gérer l'ouverture des panels
  const handleSignalAirPanelOpen = () => {
    setIsSignalAirEnabled(true);
  };

  const handleMobileAirPanelOpen = () => {
    setIsMobileAirEnabled(true);
  };

  // Gérer le chargement des données SignalAir quand activé
  useEffect(() => {
    if (isSignalAirEnabled && signalAirLoadTrigger > 0) {
      // Les données seront chargées via useAirQualityData avec signalAirOptions
    }
  }, [isSignalAirEnabled, signalAirLoadTrigger]);

  // État pour l'auto-refresh - désactivé par défaut
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

  const signalAirOptions = useMemo(
    () => ({
      selectedTypes: signalAirSelectedTypes,
      loadTrigger: signalAirLoadTrigger,
      isSourceSelected: isSignalAirEnabled, // Utiliser isSignalAirEnabled au lieu de selectedSources
    }),
    [signalAirSelectedTypes, signalAirLoadTrigger, isSignalAirEnabled]
  );

  useEffect(() => {
    if (!isPollutantSupportedForTimeStep(selectedPollutant, selectedTimeStep)) {
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

  // État pour contrôler la visibilité du panel de sélection de date
  // Note: Le panel ne se ferme plus complètement, il se rabat juste
  const [isDatePanelVisible, setIsDatePanelVisible] = useState(true);
  const expandPanelRef = useRef<(() => void) | null>(null);

  // Hook pour la visualisation temporelle
  const {
    state: temporalState,
    controls: temporalControls,
    toggleHistoricalMode,
    exitHistoricalMode,
    loadHistoricalData,
    getCurrentDevices,
    getCurrentSignalAirReports,
    isHistoricalModeActive,
    hasHistoricalData,
    seekToDate,
    goToPrevious,
    goToNext,
  } = useTemporalVisualization({
    selectedPollutant,
    selectedSources,
    timeStep: selectedTimeStep,
    signalAirEnabled: isSignalAirEnabled,
    signalAirSelectedTypes,
  });

  // Mode historique autorisé uniquement pour les pas 15 min, heure et jour
  const isHistoricalModeAllowed = isHistoricalModeAllowedForTimeStep(selectedTimeStep);

  // Désactiver le mode historique si l'utilisateur passe sur Scan ou ≤2 min
  useEffect(() => {
    if (!isHistoricalModeAllowed && isHistoricalModeActive) {
      exitHistoricalMode();
    }
  }, [isHistoricalModeAllowed, isHistoricalModeActive, exitHistoricalMode]);

  // Réinitialiser la visibilité du panel quand le mode historique est activé
  useEffect(() => {
    if (isHistoricalModeActive) {
      setIsDatePanelVisible(true);
    }
  }, [isHistoricalModeActive]);

  // Cacher le panel de sélection quand les données historiques sont chargées (sauf si explicitement réouvert)
  useEffect(() => {
    if (hasHistoricalData && isHistoricalModeActive) {
      // Cacher le panel de sélection quand les données sont chargées pour la première fois
      // (l'utilisateur peut le rouvrir via le bouton calendrier)
      setIsDatePanelVisible(false);
    }
  }, [hasHistoricalData, isHistoricalModeActive]);

  // En mode historique avec signalements chargés : afficher automatiquement les marqueurs SignalAir
  useEffect(() => {
    if (
      isHistoricalModeActive &&
      hasHistoricalData &&
      (temporalState.historicalSignalAirReports?.length ?? 0) > 0
    ) {
      setIsSignalAirVisible(true);
    }
  }, [
    isHistoricalModeActive,
    hasHistoricalData,
    temporalState.historicalSignalAirReports?.length,
  ]);

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

  // En mode historique avec données : afficher les signalements filtrés par fenêtre temporelle (période locale)
  const reportsForMap = useMemo(() => {
    if (isHistoricalModeActive && hasHistoricalData) {
      return getCurrentSignalAirReports();
    }
    return reports;
  }, [isHistoricalModeActive, hasHistoricalData, getCurrentSignalAirReports, reports]);

  const isSignalAirLoading = loadingSources.includes("signalair");
  // En mode historique : considérer "chargé" si des signalements ont été récupérés
  const hasSignalAirLoaded =
    signalAirLoadTrigger > 0 ||
    (isHistoricalModeActive &&
      hasHistoricalData &&
      temporalState.historicalSignalAirReports?.length > 0);

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
      <header className="bg-white border-b border-gray-200 px-4 py-1 z-[1600]">
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
            isHistoricalModeAllowed={isHistoricalModeAllowed}
            autoRefreshEnabled={autoRefreshEnabled}
            onToggleAutoRefresh={setAutoRefreshEnabled}
            lastRefresh={lastRefresh}
            loading={loading}
            currentModelingLayer={currentModelingLayer}
            onModelingLayerChange={setCurrentModelingLayer}
            onToast={addToast}
          />

          {/* Contrôles intégrés dans l'en-tête - Desktop uniquement */}
          <div className="hidden lg:flex items-center space-x-2">
            <div className={`flex items-center space-x-3 ${isHistoricalModeActive && temporalState.isPlaying ? "opacity-50 pointer-events-none" : ""}`}>
              <PollutantDropdown
                selectedPollutant={selectedPollutant}
                onPollutantChange={setSelectedPollutant}
                selectedTimeStep={selectedTimeStep}
              />
              <SourceDropdown
                selectedSources={selectedSources}
                selectedTimeStep={selectedTimeStep}
                onSourceChange={setSelectedSources}
                onTimeStepChange={setSelectedTimeStep}
                onToast={addToast}
              />
              <TimeStepDropdown
                selectedTimeStep={selectedTimeStep}
                selectedSources={selectedSources}
                onTimeStepChange={setSelectedTimeStep}
                onSourceChange={setSelectedSources}
                onToast={addToast}
              />
            </div>

            <div className={`flex items-center space-x-4 border-gray-300 pl-6 text-xs text-gray-600 ${isHistoricalModeActive && temporalState.isPlaying ? "opacity-50 pointer-events-none" : ""}`}>
              <AutoRefreshControl
                enabled={autoRefreshEnabled && !isHistoricalModeActive}
                onToggle={setAutoRefreshEnabled}
                lastRefresh={lastRefresh}
                loading={loading}
                selectedTimeStep={selectedTimeStep}
                historicalCurrentDate={isHistoricalModeActive && temporalState.isPlaying ? temporalState.currentDate : undefined}
              />
            </div>
            <div className={`flex items-center space-x-4 border-gray-300 pl-2 border-l ${isHistoricalModeActive && temporalState.isPlaying ? "opacity-50 pointer-events-none" : ""}`}>
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
                disabled={!isHistoricalModeAllowed}
              />
            </div>

            <button
              type="button"
              onClick={() => setIsInfoModalOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#325A96] text-medium font-semibold text-[#325A96] transition hover:bg-gray-100 hover:text-gray-900"
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
          reports={reportsForMap}
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
          signalAirReportsCount={reportsForMap.filter((r) => r.source === "signalair").length}
          isHistoricalModeWithSignalAirData={
            isHistoricalModeActive &&
            hasHistoricalData &&
            (temporalState.historicalSignalAirReports?.length ?? 0) > 0
          }
          onSignalAirSourceDeselected={handleSignalAirSourceDeselected}
          onMobileAirSensorSelected={handleMobileAirSensorSelected}
          onMobileAirSourceDeselected={handleMobileAirSourceDeselected}
          isHistoricalModeActive={isHistoricalModeActive}
          isSignalAirEnabled={isSignalAirEnabled}
          isMobileAirEnabled={isMobileAirEnabled}
          isSignalAirVisible={isSignalAirVisible}
          isMobileAirVisible={isMobileAirVisible}
          onSignalAirToggle={setIsSignalAirVisible}
          onMobileAirToggle={setIsMobileAirVisible}
          onSignalAirPanelOpen={handleSignalAirPanelOpen}
          onMobileAirPanelOpen={handleMobileAirPanelOpen}
        />

        {/* Panel de contrôle historique (sélection de date) - Visible si mode historique actif ET panel de date visible */}
        <HistoricalControlPanel
          isVisible={isHistoricalModeActive && isDatePanelVisible}
          onToggleHistoricalMode={toggleHistoricalMode}
          state={temporalState}
          controls={temporalControls}
          onLoadData={handleLoadHistoricalData}
          onSeekToDate={seekToDate}
          onGoToPrevious={goToPrevious}
          onGoToNext={goToNext}
          onPanelVisibilityChange={(visible) => {
            setIsDatePanelVisible(visible);
          }}
          onOpenPlaybackPanel={() => {
            setIsDatePanelVisible(false);
          }}
          onExpandRequest={(expandFn) => {
            expandPanelRef.current = expandFn;
          }}
          selectedPollutant={selectedPollutant}
        />

        {/* Panneau de lecture draggable - Visible si données historiques chargées ET panel de sélection caché */}
        {isHistoricalModeActive && hasHistoricalData && !isDatePanelVisible && (
          <HistoricalPlaybackControl
            state={temporalState}
            controls={temporalControls}
            onToggleHistoricalMode={toggleHistoricalMode}
            onOpenDatePanel={() => {
              // Arrêter la lecture si elle est en cours
              if (temporalState.isPlaying) {
                temporalControls.onPlayPause();
              }
              // Ouvrir le panel de sélection
              setIsDatePanelVisible(true);
              // Développer le panel en grand (avec un délai pour s'assurer que le panel est visible)
              setTimeout(() => {
                if (expandPanelRef.current) {
                  expandPanelRef.current();
                }
              }, 0);
            }}
            onSeekToDate={seekToDate}
            onGoToPrevious={goToPrevious}
            onGoToNext={goToNext}
          />
        )}
      </main>

      <InformationModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        domainConfig={domainConfig}
      />

      {/* Conteneur de notifications toast */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default App;
