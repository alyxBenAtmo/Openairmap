import React, { useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "geoportal-extensions-leaflet";
import "leaflet-velocity";
import "leaflet-velocity/dist/leaflet-velocity.css";

// Déclaration de type pour l'extension Geoportal
declare module "leaflet" {
  namespace L {
    namespace geoportalControl {
      function SearchEngine(options?: any): any;
    }
  }
}
import {
  MeasurementDevice,
  SignalAirReport,
  StationInfo,
  WildfireReport,
} from "../../types";
import { BaseLayerKey } from "../../constants/mapLayers";
import BaseLayerControl from "../controls/BaseLayerControl";
import ClusterControl from "../controls/ClusterControl";
import CustomSearchControl from "../controls/CustomSearchControl";
import ScaleControl from "../controls/ScaleControl";
import NorthArrow from "../controls/NorthArrow";
import SourceSettingsControl from "../controls/SourceSettingsControl";
import Legend from "./Legend";
import StationSidePanel from "../panels/StationSidePanel";
import MicroSidePanel from "../panels/MicroSidePanel";
import NebuleAirSidePanel from "../panels/NebuleAirSidePanel";
import SensorCommunitySidePanel from "../panels/SensorCommunitySidePanel";
import PurpleAirSidePanel from "../panels/PurpleAirSidePanel";
import ComparisonSidePanel from "../panels/ComparisonSidePanel";
import MobileAirSelectionPanel from "../panels/MobileAirSelectionPanel";
import MobileAirDetailPanel from "../panels/MobileAirDetailPanel";
import SignalAirSelectionPanel from "../panels/SignalAirSelectionPanel";
import SignalAirDetailPanel from "../panels/SignalAirDetailPanel";
import MobileAirRoutes from "./MobileAirRoutes";
import CustomSpiderfiedMarkers from "./CustomSpiderfiedMarkers";
import CustomSpiderfiedSignalAirMarkers from "./CustomSpiderfiedSignalAirMarkers";
import MarkerTooltip from "./MarkerTooltip";
import DeviceStatistics from "./DeviceStatistics";

import { AtmoRefService } from "../../services/AtmoRefService";
import { AtmoMicroService } from "../../services/AtmoMicroService";
import { NebuleAirService } from "../../services/NebuleAirService";
import MarkerClusterGroup from "react-leaflet-cluster";

// Hooks personnalisés
import { useMapView } from "./hooks/useMapView";
import { useMapLayers } from "./hooks/useMapLayers";
import { useWildfireLayer } from "./hooks/useWildfireLayer";
import { useMapAttribution } from "./hooks/useMapAttribution";
import { useSidePanels } from "./hooks/useSidePanels";
import { useSignalAir } from "./hooks/useSignalAir";
import { useMobileAir } from "./hooks/useMobileAir";
import { useMarkerTooltip } from "./hooks/useMarkerTooltip";
import { useVisibleDevices } from "./hooks/useVisibleDevices";

// Utilitaires
import {
  createCustomIcon,
  createSignalIcon,
  createWildfireIcon,
  formatWildfireDate,
  getMarkerKey,
  isDeviceSelected,
} from "./utils/mapIconUtils";
import { getOptimalZoomLevel } from "./utils/mapMarkerUtils";
import {
  createLoadComparisonDataHandler,
  createRemoveStationFromComparisonHandler,
} from "./handlers/comparisonHandlers";

// Correction pour les icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface AirQualityMapProps {
  devices: MeasurementDevice[];
  reports: SignalAirReport[];
  center: [number, number];
  zoom: number;
  selectedPollutant: string;
  selectedSources: string[];
  selectedTimeStep: string;
  currentModelingLayer: "icaireh" | "pollutant" | "vent" | null;
  loading?: boolean;
  signalAirPeriod: { startDate: string; endDate: string };
  signalAirSelectedTypes: string[];
  onSignalAirPeriodChange: (startDate: string, endDate: string) => void;
  onSignalAirTypesChange: (types: string[]) => void;
  onSignalAirLoadRequest: () => void;
  isSignalAirLoading?: boolean;
  signalAirHasLoaded?: boolean;
  signalAirReportsCount?: number;
  onSignalAirSourceDeselected?: () => void;
  onMobileAirSensorSelected?: (
    sensorId: string,
    period: { startDate: string; endDate: string }
  ) => void;
  onMobileAirSourceDeselected?: () => void;
  isHistoricalModeActive?: boolean;
  onSourceChange?: (sources: string[]) => void;
}

const defaultClusterConfig = {
  enabled: false, // active/desactive le clustering par defaut
  maxClusterRadius: 60, // rayon de clustering
  spiderfyOnMaxZoom: true, // éclatement des clusters au zoom maximum
  showCoverageOnHover: true, // affichage de la zone du cluster au survol
  zoomToBoundsOnClick: true, // zoom sur la zone du cluster au clic
  animate: true, // animations lors du clustering
  animateAddingMarkers: true, // animations lors de l'ajout de marqueurs
};

const defaultSpiderfyConfig = {
  enabled: true, // active/desactive le spiderfier par defaut
  autoSpiderfy: true, // activation automatique du spiderfier au zoom
  autoSpiderfyZoomThreshold: 12, // seuil de zoom pour activer/désactiver le spiderfier
};

// Composant interne pour gérer les événements de la carte
const MapClickHandler: React.FC<{ onMapClick: () => void }> = ({ onMapClick }) => {
  useMapEvents({
    click: () => {
      onMapClick();
    },
  });
  return null;
};

const AirQualityMap: React.FC<AirQualityMapProps> = ({
  devices,
  reports,
  center,
  zoom,
  selectedPollutant,
  selectedSources,
  selectedTimeStep,
  currentModelingLayer,
  loading,
  signalAirPeriod,
  signalAirSelectedTypes,
  onSignalAirPeriodChange,
  onSignalAirTypesChange,
  onSignalAirLoadRequest,
  isSignalAirLoading = false,
  signalAirHasLoaded = false,
  signalAirReportsCount = 0,
  onSignalAirSourceDeselected,
  onMobileAirSensorSelected,
  onMobileAirSourceDeselected,
  isHistoricalModeActive = false,
  onSourceChange,
}) => {
  // Configuration des clusters et spiderfier
  const [clusterConfig, setClusterConfig] = useState(defaultClusterConfig);
  const [spiderfyConfig, setSpiderfyConfig] = useState(defaultSpiderfyConfig);
  const [currentBaseLayer, setCurrentBaseLayer] =
    useState<BaseLayerKey>("Carte standard");

  // État pour les données PurpleAir (stockées par ID de station)
  const [purpleAirDeviceData, setPurpleAirDeviceData] = useState<
    Record<
      string,
      {
        rssi: number;
        uptime: number;
        confidence: number;
        temperature: number;
        humidity: number;
        pm1Value: number;
        pm25Value: number;
        pm10Value: number;
      }
    >
  >({});

  // Hooks personnalisés
  const mapView = useMapView({
    center,
    zoom,
    spiderfyConfig,
  });

  const mapLayers = useMapLayers({
    mapRef: mapView.mapRef,
    currentBaseLayer,
    selectedTimeStep,
    selectedPollutant,
    currentModelingLayer,
  });

  const wildfire = useWildfireLayer();

  const sidePanels = useSidePanels({
    initialSelectedPollutant: selectedPollutant,
  });

  const signalAir = useSignalAir({
    selectedSources,
    signalAirHasLoaded,
    signalAirReportsCount,
    isSignalAirLoading,
    reports,
    mapRef: mapView.mapRef,
    onSignalAirLoadRequest,
  });

  const mobileAir = useMobileAir({
    selectedSources,
    devices,
    mapRef: mapView.mapRef,
    onMobileAirSensorSelected,
  });

  // Hook pour gérer le tooltip au hover sur les marqueurs
  const { tooltip, showTooltip, hideTooltip } = useMarkerTooltip({
    minZoom: 11,
    mapRef: mapView.mapRef,
  });

  // Hook pour filtrer les appareils visibles dans le viewport
  const { visibleDevices, visibleReports } = useVisibleDevices({
    mapRef: mapView.mapRef,
    devices,
    reports,
    debounceMs: 100,
  });
  const [tooltipMetadata, setTooltipMetadata] = useState<{
    sensorModel?: string;
    sensorBrand?: string;
    measuredPollutants?: string[];
  } | null>(null);

  // Charger les métadonnées du capteur quand le tooltip est affiché
  useEffect(() => {
    if (tooltip.device) {
      const loadMetadata = async () => {
        try {
          const { getSensorMetadata } = await import(
            '../../utils/sensorMetadataUtils'
          );
          const metadata = await getSensorMetadata(tooltip.device!);
          setTooltipMetadata(metadata);
        } catch (error) {
          console.error('Erreur lors du chargement des métadonnées:', error);
          setTooltipMetadata(null);
        }
      };
      loadMetadata();
    } else {
      setTooltipMetadata(null);
    }
  }, [tooltip.device]);

  // Analyser et afficher les modèles de capteurs dans la console
  useEffect(() => {
    const analyzeModels = async () => {
      if (devices.length === 0) return;

      const { getSensorMetadata } = await import(
        '../../utils/sensorMetadataUtils'
      );

      // Récupérer les métadonnées pour tous les devices
      const metadataPromises = devices.map((device) =>
        getSensorMetadata(device).catch((error) => {
          console.warn(`Erreur pour ${device.source}-${device.id}:`, error);
          return { sensorModel: undefined, sensorBrand: undefined };
        })
      );

      const allMetadata = await Promise.all(metadataPromises);

      // Compter les modèles
      const modelCounts: Record<string, number> = {};
      const brandModelCounts: Record<string, number> = {};

      devices.forEach((device, index) => {
        const metadata = allMetadata[index];
        const model = metadata.sensorModel || 'Non spécifié';
        const brand = metadata.sensorBrand || 'Non spécifié';
        const brandModel = brand !== 'Non spécifié' && model !== 'Non spécifié'
          ? `${brand} ${model}`
          : model;

        // Compter par modèle seul
        modelCounts[model] = (modelCounts[model] || 0) + 1;

        // Compter par marque + modèle
        brandModelCounts[brandModel] = (brandModelCounts[brandModel] || 0) + 1;
      });

      // Afficher dans la console
      console.log('=== Analyse des modèles de capteurs ===');
      console.log(`Total de devices: ${devices.length}`);
      console.log('\n📊 Modèles (détail):');
      Object.entries(brandModelCounts)
        .sort(([, a], [, b]) => b - a)
        .forEach(([model, count]) => {
          console.log(`  ${model}: ${count}`);
        });
      console.log('\n📊 Modèles (résumé):');
      Object.entries(modelCounts)
        .sort(([, a], [, b]) => b - a)
        .forEach(([model, count]) => {
          console.log(`  ${model}: ${count}`);
        });
      console.log('========================================');
    };

    analyzeModels();
  }, [devices]);

  const shouldShowStandardLegend =
    selectedSources.length > 0 || mapLayers.currentModelingWMTSLayer === null;

  const isComparisonPanelVisible =
    sidePanels.comparisonState.isComparisonMode &&
    sidePanels.comparisonState.comparedStations.length > 0;

  // Référence pour suivre l'état précédent du mode historique
  const prevHistoricalModeRef = useRef(isHistoricalModeActive);

  // Refs pour empêcher les clics multiples rapides
  const isProcessingClickRef = useRef(false);
  const lastClickedDeviceIdRef = useRef<string | null>(null);

  // Effet pour fermer tous les side panels quand le mode historique est activé
  useEffect(() => {
    // Ne fermer les panels que lors du passage de false à true
    if (isHistoricalModeActive && !prevHistoricalModeRef.current) {
      // Fermer complètement tous les side panels (pas juste rabattus)
      sidePanels.handleCloseSidePanel();
      
      // Fermer les panels SignalAir
      signalAir.handleCloseSignalAirPanel();
      signalAir.handleCloseSignalAirDetailPanel();
      
      // Fermer les panels MobileAir
      mobileAir.handleCloseMobileAirSelectionPanel();
      mobileAir.handleCloseMobileAirDetailPanel();
    }
    
    // Mettre à jour la référence
    prevHistoricalModeRef.current = isHistoricalModeActive;
  }, [isHistoricalModeActive]);

  // Gestion de l'attribution Leaflet
  useMapAttribution({
    shouldHide:
      (sidePanels.isSidePanelOpen && sidePanels.panelSize !== "hidden") ||
      (isComparisonPanelVisible && sidePanels.panelSize !== "hidden") ||
      (mobileAir.isMobileAirSelectionPanelOpen &&
        mobileAir.mobileAirSelectionPanelSize !== "hidden") ||
      (mobileAir.isMobileAirDetailPanelOpen &&
        mobileAir.mobileAirDetailPanelSize !== "hidden") ||
      (signalAir.isSignalAirPanelOpen &&
        signalAir.signalAirPanelSize !== "hidden") ||
      (signalAir.isSignalAirDetailPanelOpen &&
        signalAir.signalAirDetailPanelSize !== "hidden"),
  });

  // Effet pour redimensionner la carte quand les panneaux latéraux changent de taille
  useEffect(() => {
    if (!mapView.mapRef.current) return;

    // Appel immédiat pour les changements rapides
    const immediateTimeout = setTimeout(() => {
      if (mapView.mapRef.current) {
        mapView.mapRef.current.invalidateSize();
      }
    }, 0);

    // Appel après la transition CSS (300ms + marge)
    const transitionTimeout = setTimeout(() => {
      if (mapView.mapRef.current) {
        mapView.mapRef.current.invalidateSize();
      }
    }, 350);

    // Appel supplémentaire pour s'assurer que tout est bien redimensionné
    const finalTimeout = setTimeout(() => {
      if (mapView.mapRef.current) {
        mapView.mapRef.current.invalidateSize();
      }
    }, 500);

    return () => {
      clearTimeout(immediateTimeout);
      clearTimeout(transitionTimeout);
      clearTimeout(finalTimeout);
    };
  }, [
    sidePanels.panelSize,
    sidePanels.isSidePanelOpen,
    mobileAir.mobileAirSelectionPanelSize,
    mobileAir.mobileAirDetailPanelSize,
    mobileAir.isMobileAirSelectionPanelOpen,
    mobileAir.isMobileAirDetailPanelOpen,
    signalAir.signalAirPanelSize,
    signalAir.isSignalAirPanelOpen,
    signalAir.signalAirDetailPanelSize,
    signalAir.isSignalAirDetailPanelOpen,
    isComparisonPanelVisible,
  ]);

  const handleBaseLayerChange = (layerKey: BaseLayerKey) => {
    setCurrentBaseLayer(layerKey);
  };

  // Handlers pour la comparaison
  const handleLoadComparisonData = createLoadComparisonDataHandler(
    sidePanels.setComparisonState
  );
  const handleRemoveStationFromComparison = createRemoveStationFromComparisonHandler(
    sidePanels.comparisonState,
    sidePanels.setComparisonState,
    sidePanels.setIsSidePanelOpen,
    sidePanels.setSelectedStation
  );

  // Handler pour ajouter une station à la comparaison
  const handleAddStationToComparison = async (device: MeasurementDevice) => {
    // Vérifier que la station n'est pas déjà dans la liste
    const isAlreadyAdded = sidePanels.comparisonState.comparedStations.some(
      (station) => station.id === device.id
    );
    
    // Si la station est déjà ajoutée, la retirer (désélection)
    if (isAlreadyAdded) {
      handleRemoveStationFromComparison(device.id);
      return;
    }

    // Vérifier les limites (max 5 stations) seulement si on ajoute une nouvelle station
    if (sidePanels.comparisonState.comparedStations.length >= 5) {
      console.warn("Maximum 5 stations autorisées en comparaison");
      return;
    }

    try {
      let variables: Record<
        string,
        { label: string; code_iso: string; en_service: boolean }
      > = {};

      // Récupérer les informations détaillées selon la source
      let sensorModel: string | undefined;
      let lastSeenSec: number | undefined;

      if (device.source === "atmoRef") {
        const atmoRefService = new AtmoRefService();
        variables = await atmoRefService.fetchStationVariables(device.id);
      } else if (device.source === "atmoMicro") {
        const atmoMicroService = new AtmoMicroService();
        const siteInfo = await atmoMicroService.fetchSiteVariables(device.id);
        variables = siteInfo.variables;
        sensorModel = siteInfo.sensorModel;
      } else if (device.source === "nebuleair") {
        const nebuleAirService = new NebuleAirService();
        const siteInfo = await nebuleAirService.fetchSiteInfo(device.id);
        variables = siteInfo.variables;
        lastSeenSec = siteInfo.lastSeenSec;
      }

      const stationInfo: StationInfo = {
        id: device.id,
        name: device.name,
        address: device.address || "",
        departmentId: device.departmentId || "",
        source: device.source,
        variables,
        sensorModel,
        ...(lastSeenSec !== undefined && { lastSeenSec }),
      };

      sidePanels.setComparisonState((prev) => ({
        ...prev,
        comparedStations: [...prev.comparedStations, stationInfo],
      }));
    } catch (error) {
      console.error(
        "Erreur lors de l'ajout de la station à la comparaison:",
        error
      );
    }
  };

  // Wrapper pour createCustomIcon avec les états du composant
  // Wrappers pour les fonctions utilitaires avec les états du composant
  const createCustomIconWrapper = (device: MeasurementDevice) => {
    return createCustomIcon(device, {
      loading,
      comparisonState: sidePanels.comparisonState,
      selectedStation: sidePanels.selectedStation,
    });
  };

  const createSignalIconWrapper = (report: SignalAirReport) => {
    return createSignalIcon(report, loading);
  };

  const createWildfireIconWrapper = (report: WildfireReport) => {
    return createWildfireIcon(
      report,
      wildfire.wildfireLoading,
      wildfire.wildfireReports.length
    );
  };

  const getMarkerKeyWrapper = (device: MeasurementDevice) => {
    return getMarkerKey(
      device,
      sidePanels.comparisonState,
      sidePanels.selectedStation
    );
  };

  // Wrapper pour désactiver les clics SignalAir en mode historique
  const handleSignalAirMarkerClickWrapper = (report: SignalAirReport) => {
    if (isHistoricalModeActive) {
      return;
    }
    signalAir.handleSignalAirMarkerClick(report);
  };

  // Wrappers pour désactiver les clics MobileAir en mode historique
  const handleMobileAirPointClickWrapper = (
    route: any,
    point: any
  ) => {
    if (isHistoricalModeActive) {
      return;
    }
    mobileAir.handleMobileAirPointClick(route, point);
  };

  const handleMobileAirRouteClickWrapper = (route: any) => {
    if (isHistoricalModeActive) {
      return;
    }
    mobileAir.handleMobileAirRouteClick(route);
  };

  const handleMarkerClick = useCallback(async (device: MeasurementDevice) => {
    // Empêcher les clics multiples rapides sur le même device
    if (isProcessingClickRef.current && lastClickedDeviceIdRef.current === device.id) {
      console.log('Clic ignoré : traitement en cours pour ce device');
      return;
    }

    // Masquer le tooltip immédiatement lors d'un clic
    hideTooltip(true);

    // Désactiver les clics sur les marqueurs en mode historique
    if (isHistoricalModeActive) {
      return;
    }

    // Exclure SignalAir
    if (device.source === "signalair") {
      return;
    }

    // Marquer comme en cours de traitement
    isProcessingClickRef.current = true;
    lastClickedDeviceIdRef.current = device.id;

    try {
      // Gérer PurpleAir avec side panel
      if (device.source === "purpleair") {
        const purpleAirDevice = device as any;
        
        // Extraire les données PurpleAir
        const deviceData = {
          rssi: purpleAirDevice.rssi,
          uptime: purpleAirDevice.uptime,
          confidence: purpleAirDevice.confidence,
          temperature: purpleAirDevice.temperature,
          humidity: purpleAirDevice.humidity,
          pm1Value: purpleAirDevice.pm1Value,
          pm25Value: purpleAirDevice.pm25Value,
          pm10Value: purpleAirDevice.pm10Value,
        };

        // Stocker les données PurpleAir
        setPurpleAirDeviceData((prev) => ({
          ...prev,
          [device.id]: deviceData,
        }));

        const stationInfo: StationInfo = {
          id: device.id,
          name: device.name,
          address: device.address || "",
          departmentId: device.departmentId || "",
          source: device.source,
          variables: {}, // PurpleAir ne fournit pas de variables contrôlables
        };

        sidePanels.setSelectedStation(stationInfo);
        sidePanels.setIsSidePanelOpen(true);
        
        // Si le panneau est caché, le rouvrir automatiquement
        if (sidePanels.panelSize === "hidden") {
          sidePanels.setPanelSize("normal");
        }
        return;
      }

      // Gérer Sensor Community avec side panel
      if (device.source === "sensorCommunity") {
        // Extraire l'ID du capteur depuis l'ID du device (format: sensorId_locationId)
        // On stocke l'ID complet pour pouvoir l'afficher, mais le sensorId sera extrait dans le side panel
        const stationInfo: StationInfo = {
          id: device.id, // Format: sensorId_locationId ou sensorId directement
          name: device.name,
          address: device.address || "",
          departmentId: device.departmentId || "",
          source: device.source,
          variables: {}, // SensorCommunity ne fournit pas de variables contrôlables
        };

        sidePanels.setSelectedStation(stationInfo);
        sidePanels.setIsSidePanelOpen(true);
        
        // Si le panneau est caché, le rouvrir automatiquement
        if (sidePanels.panelSize === "hidden") {
          sidePanels.setPanelSize("normal");
        }
        return;
      }

      // En mode comparaison, gérer AtmoRef, AtmoMicro et NebuleAir
      if (sidePanels.comparisonState.isComparisonMode) {
        if (device.source === "atmoRef" || device.source === "atmoMicro" || device.source === "nebuleair") {
          await handleAddStationToComparison(device);
        }
        return;
      }

      // Supporter AtmoRef, AtmoMicro et NebuleAir en mode normal
      if (
        device.source !== "atmoRef" &&
        device.source !== "atmoMicro" &&
        device.source !== "nebuleair"
      ) {
        return;
      }

      // Initialiser les variables par défaut
      let variables: Record<
        string,
        { label: string; code_iso: string; en_service: boolean }
      > = {};
      let sensorModel: string | undefined;
      let lastSeenSec: number | undefined;

      try {
        // Récupérer les informations détaillées selon la source
        if (device.source === "atmoRef") {
          const atmoRefService = new AtmoRefService();
          variables = await atmoRefService.fetchStationVariables(device.id);
        } else if (device.source === "atmoMicro") {
          const atmoMicroService = new AtmoMicroService();
          const siteInfo = await atmoMicroService.fetchSiteVariables(device.id);
          variables = siteInfo.variables;
          sensorModel = siteInfo.sensorModel;
        } else if (device.source === "nebuleair") {
          const nebuleAirService = new NebuleAirService();
          const siteInfo = await nebuleAirService.fetchSiteInfo(device.id);
          variables = siteInfo.variables;
          lastSeenSec = siteInfo.lastSeenSec;
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des informations de la station:",
          error
        );
        // Continuer avec des variables vides - le sidepanel s'ouvrira quand même
      }

      // Toujours ouvrir le sidepanel, même en cas d'erreur
      const stationInfo: StationInfo = {
        id: device.id,
        name: device.name,
        address: device.address || "",
        departmentId: device.departmentId || "",
        source: device.source,
        variables,
        sensorModel,
        ...(lastSeenSec !== undefined && { lastSeenSec }),
      };

      sidePanels.setSelectedStation(stationInfo);
      sidePanels.setIsSidePanelOpen(true);
      
      // Si le panneau est caché, le rouvrir automatiquement
      if (sidePanels.panelSize === "hidden") {
        sidePanels.setPanelSize("normal");
      }
    } finally {
      // Réinitialiser le flag après un court délai pour permettre les clics sur d'autres devices
      setTimeout(() => {
        isProcessingClickRef.current = false;
        // Ne réinitialiser lastClickedDeviceIdRef que si c'est toujours le même device
        if (lastClickedDeviceIdRef.current === device.id) {
          lastClickedDeviceIdRef.current = null;
        }
      }, 500); // Délai de 500ms pour éviter les clics multiples rapides
    }
  }, [isHistoricalModeActive, hideTooltip, sidePanels, handleAddStationToComparison]);

  // Callback pour la sélection d'un capteur depuis la recherche
  const handleSensorSelected = useCallback(
    (device: MeasurementDevice) => {
      // Centrer la carte sur le capteur
      if (mapView.mapRef.current) {
        mapView.mapRef.current.setView([device.latitude, device.longitude], 16, {
          animate: true,
          duration: 1.5,
        });
      }

      // Sélectionner le capteur et ouvrir le sidepanel
      handleMarkerClick(device);
    },
    [handleMarkerClick]
  );

  // Les handlers SignalAir et MobileAir sont maintenant dans leurs hooks respectifs
  // Utiliser signalAir.* et mobileAir.* pour accéder aux handlers

  return (
    <div className="w-full h-full flex items-stretch relative">
      {/* Side Panel - Comparaison */}
      {sidePanels.comparisonState.isComparisonMode &&
        sidePanels.comparisonState.comparedStations.length > 0 && (
          <ComparisonSidePanel
            isOpen={true}
            comparisonState={sidePanels.comparisonState}
            onClose={sidePanels.handleCloseSidePanel}
            onHidden={() => sidePanels.handleSidePanelSizeChange("hidden")}
            onSizeChange={sidePanels.handleSidePanelSizeChange}
            panelSize={sidePanels.panelSize}
            onRemoveStation={handleRemoveStationFromComparison}
            onComparisonModeToggle={sidePanels.handleComparisonModeToggle}
            onLoadComparisonData={handleLoadComparisonData}
          />
        )}

      {/* Side Panel - AtmoRef */}
      {!sidePanels.comparisonState.isComparisonMode &&
        sidePanels.selectedStation?.source === "atmoRef" && (
          <StationSidePanel
            isOpen={sidePanels.isSidePanelOpen}
            selectedStation={sidePanels.selectedStation}
            onClose={sidePanels.handleCloseSidePanel}
            onHidden={() => sidePanels.handleSidePanelSizeChange("hidden")}
            onSizeChange={sidePanels.handleSidePanelSizeChange}
            panelSize={sidePanels.panelSize}
            initialPollutant={selectedPollutant}
            onComparisonModeToggle={sidePanels.handleComparisonModeToggle}
            isComparisonMode={sidePanels.comparisonState.isComparisonMode}
          />
        )}

      {/* Side Panel - AtmoMicro */}
      {!sidePanels.comparisonState.isComparisonMode &&
        sidePanels.selectedStation?.source === "atmoMicro" && (
          <MicroSidePanel
            isOpen={sidePanels.isSidePanelOpen}
            selectedStation={sidePanels.selectedStation}
            onClose={sidePanels.handleCloseSidePanel}
            onHidden={() => sidePanels.handleSidePanelSizeChange("hidden")}
            onSizeChange={sidePanels.handleSidePanelSizeChange}
            panelSize={sidePanels.panelSize}
            initialPollutant={selectedPollutant}
            onComparisonModeToggle={sidePanels.handleComparisonModeToggle}
            isComparisonMode={sidePanels.comparisonState.isComparisonMode}
          />
        )}

      {/* Side Panel - NebuleAir */}
      {!sidePanels.comparisonState.isComparisonMode &&
        sidePanels.selectedStation?.source === "nebuleair" && (
          <NebuleAirSidePanel
            isOpen={sidePanels.isSidePanelOpen}
            selectedStation={sidePanels.selectedStation}
            onClose={sidePanels.handleCloseSidePanel}
            onHidden={() => sidePanels.handleSidePanelSizeChange("hidden")}
            onSizeChange={sidePanels.handleSidePanelSizeChange}
            panelSize={sidePanels.panelSize}
            initialPollutant={selectedPollutant}
            onComparisonModeToggle={sidePanels.handleComparisonModeToggle}
            isComparisonMode={sidePanels.comparisonState.isComparisonMode}
          />
        )}

      {/* Side Panel - Sensor Community */}
      {!sidePanels.comparisonState.isComparisonMode &&
        sidePanels.selectedStation?.source === "sensorCommunity" && (
          <SensorCommunitySidePanel
            isOpen={sidePanels.isSidePanelOpen}
            selectedStation={sidePanels.selectedStation}
            onClose={sidePanels.handleCloseSidePanel}
            onHidden={() => sidePanels.handleSidePanelSizeChange("hidden")}
            onSizeChange={sidePanels.handleSidePanelSizeChange}
            panelSize={sidePanels.panelSize}
            initialPollutant={selectedPollutant}
          />
        )}

      {/* Side Panel - PurpleAir */}
      {!sidePanels.comparisonState.isComparisonMode &&
        sidePanels.selectedStation?.source === "purpleair" && (
          <PurpleAirSidePanel
            isOpen={sidePanels.isSidePanelOpen}
            selectedStation={sidePanels.selectedStation}
            deviceData={
              sidePanels.selectedStation
                ? purpleAirDeviceData[sidePanels.selectedStation.id]
                : undefined
            }
            onClose={sidePanels.handleCloseSidePanel}
            onHidden={() => sidePanels.handleSidePanelSizeChange("hidden")}
            onSizeChange={sidePanels.handleSidePanelSizeChange}
            panelSize={sidePanels.panelSize}
            initialPollutant={selectedPollutant}
          />
        )}

      {/* Side Panel - SignalAir Detail */}
      <SignalAirDetailPanel
        isOpen={signalAir.isSignalAirDetailPanelOpen}
        report={signalAir.selectedSignalAirReport}
        onClose={signalAir.handleCloseSignalAirDetailPanel}
        onSizeChange={signalAir.handleSignalAirDetailPanelSizeChange}
        panelSize={signalAir.signalAirDetailPanelSize}
        onCenterMap={signalAir.handleCenterOnSignalAirReport}
      />

      {/* Side Panel - SignalAir Selection */}
      <SignalAirSelectionPanel
        isOpen={signalAir.isSignalAirPanelOpen}
        selectedPollutant={selectedPollutant}
        selectedTypes={signalAirSelectedTypes}
        period={signalAirPeriod}
        onClose={signalAir.handleCloseSignalAirPanel}
        onTypesChange={onSignalAirTypesChange}
        onPeriodChange={onSignalAirPeriodChange}
        onLoadReports={signalAir.handleSignalAirLoad}
        onSizeChange={signalAir.handleSignalAirPanelSizeChange}
        onHidden={signalAir.handleSignalAirPanelHidden}
        panelSize={signalAir.signalAirPanelSize}
        isLoading={isSignalAirLoading}
        hasLoaded={signalAirHasLoaded}
        reportsCount={signalAirReportsCount}
      />

      {/* Side Panel - MobileAir Selection (droite) */}
      <MobileAirSelectionPanel
        isOpen={mobileAir.isMobileAirSelectionPanelOpen}
        initialPollutant={selectedPollutant}
        onClose={mobileAir.handleCloseMobileAirSelectionPanel}
        onHidden={() => mobileAir.handleMobileAirSelectionPanelSizeChange("hidden")}
        onSizeChange={mobileAir.handleMobileAirSelectionPanelSizeChange}
        panelSize={mobileAir.mobileAirSelectionPanelSize}
        onSensorSelected={mobileAir.handleMobileAirSensorsSelected}
      />

      {/* Side Panel - MobileAir Detail (gauche) */}
      <MobileAirDetailPanel
        isOpen={mobileAir.isMobileAirDetailPanelOpen}
        selectedRoute={mobileAir.selectedMobileAirRoute}
        activeRoute={mobileAir.activeMobileAirRoute}
        allRoutes={mobileAir.mobileAirRoutes}
        initialPollutant={selectedPollutant}
        highlightedPoint={mobileAir.highlightedMobileAirPoint}
        onClose={mobileAir.handleCloseMobileAirDetailPanel}
        onHidden={() => mobileAir.handleMobileAirDetailPanelSizeChange("hidden")}
        onSizeChange={mobileAir.handleMobileAirDetailPanelSizeChange}
        panelSize={mobileAir.mobileAirDetailPanelSize}
        onPointHover={mobileAir.handleMobileAirPointHover}
        onPointHighlight={mobileAir.handleMobileAirPointHighlight}
        onRouteSelect={mobileAir.openMobileAirDetailPanelForRoute}
      />

      {/* Conteneur de la carte */}
      <div className="flex-1 relative">
        {/* Contrôle de recherche personnalisé */}
        <CustomSearchControl
          devices={devices}
          mapRef={mapView.mapRef}
          onSensorSelected={handleSensorSelected}
        />

        <MapContainer
          center={center}
          zoom={zoom}
          style={{
            height: "100%",
            width: "100%",
            minHeight: "100%",
          }}
          ref={mapView.mapRef}
          zoomControl={false}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          dragging={true}
          touchZoom={true}
          minZoom={1}
          maxZoom={18}
        >
          {/* Gestionnaire d'événements pour masquer le tooltip lors d'un clic sur la carte */}
          <MapClickHandler onMapClick={() => hideTooltip(true)} />
          {/* Fond de carte initial */}
          <TileLayer
            attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
            minZoom={0}
            maxZoom={20}
          />

          {/* Contrôle d'échelle */}
          <ScaleControl
            isSidePanelOpen={sidePanels.isSidePanelOpen}
            panelSize={sidePanels.panelSize}
          />

          {/* Flèche du nord */}
          <NorthArrow isSidePanelOpen={sidePanels.isSidePanelOpen} panelSize={sidePanels.panelSize} />

          {/* Marqueurs pour les appareils de mesure */}
          {clusterConfig.enabled ? (
            <MarkerClusterGroup
              maxClusterRadius={clusterConfig.maxClusterRadius}
              spiderfyOnMaxZoom={
                mapView.isSpiderfyActive || clusterConfig.spiderfyOnMaxZoom
              }
              showCoverageOnHover={clusterConfig.showCoverageOnHover}
              zoomToBoundsOnClick={clusterConfig.zoomToBoundsOnClick}
              animate={clusterConfig.animate}
              animateAddingMarkers={clusterConfig.animateAddingMarkers}
            >
              {devices
                .filter((device) => {
                  // Filtrer complètement les devices MobileAir (gérés par MobileAirRoutes)
                  if (device.source === "mobileair") {
                    return false;
                  }
                  return true;
                })
                .map((device) => (
                  <Marker
                    key={getMarkerKeyWrapper(device)}
                    position={[device.latitude, device.longitude]}
                    icon={createCustomIconWrapper(device)}
                    eventHandlers={{
                      click: () => {
                        hideTooltip(true);
                        handleMarkerClick(device);
                      },
                      mouseover: (e) => showTooltip(device, e),
                      mouseout: () => hideTooltip(),
                    }}
                  />
                ))}
            </MarkerClusterGroup>
          ) : // Spiderfier automatique personnalisé - éclatement automatique des marqueurs qui se chevauchent
          spiderfyConfig.enabled ? (
            <CustomSpiderfiedMarkers
              devices={devices.filter((device) => {
                // Filtrer complètement les devices MobileAir (gérés par MobileAirRoutes)
                if (device.source === "mobileair") {
                  return false;
                }
                return true;
              })}
              createCustomIcon={createCustomIconWrapper}
              handleMarkerClick={handleMarkerClick}
              enabled={spiderfyConfig.enabled}
              nearbyDistance={10} // Distance en pixels pour considérer les marqueurs comme se chevauchant
              zoomThreshold={spiderfyConfig.autoSpiderfyZoomThreshold} // Seuil de zoom pour activer/désactiver le spiderfier
              getMarkerKey={getMarkerKeyWrapper}
              onMarkerHover={showTooltip}
              onMarkerHoverOut={hideTooltip}
              onMarkerClick={() => hideTooltip(true)}
            />
          ) : (
            devices
              .filter((device) => {
                // Filtrer complètement les devices MobileAir (gérés par MobileAirRoutes)
                if (device.source === "mobileair") {
                  return false;
                }
                return true;
              })
              .map((device) => (
                <Marker
                  key={getMarkerKeyWrapper(device)}
                  position={[device.latitude, device.longitude]}
                  icon={createCustomIconWrapper(device)}
                  eventHandlers={{
                    click: () => {
                      hideTooltip(true);
                      handleMarkerClick(device);
                    },
                    mouseover: (e) => showTooltip(device, e),
                    mouseout: () => hideTooltip(),
                  }}
                />
              ))
          )}

          {/* Parcours MobileAir - Afficher seulement la route active */}
          <MobileAirRoutes
            routes={mobileAir.activeMobileAirRoute ? [mobileAir.activeMobileAirRoute] : []}
            selectedPollutant={selectedPollutant}
            onPointClick={handleMobileAirPointClickWrapper}
            onPointHover={mobileAir.handleMobileAirPointHover}
            onRouteClick={handleMobileAirRouteClickWrapper}
            highlightedPoint={mobileAir.highlightedMobileAirPoint}
            hoveredPoint={mobileAir.hoveredMobileAirPoint}
          />

          {/* Marqueurs pour les incendies en cours */}
          {wildfire.isWildfireLayerEnabled &&
            wildfire.wildfireReports.map((incident) => (
              <Marker
                key={`wildfire-${incident.id}`}
                position={[incident.latitude, incident.longitude]}
                icon={createWildfireIconWrapper(incident)}
              >
                <Popup>
                  <div className="device-popup min-w-[280px]">
                    <h3 className="font-bold text-lg mb-2">{incident.title}</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Commune:</strong> {incident.commune}
                      </p>
                      <p>
                        <strong>Type:</strong> {incident.type || "Non spécifié"}
                      </p>
                      <p>
                        <strong>Statut:</strong> {incident.status || "Inconnu"}
                      </p>
                      {incident.fireState && (
                        <p>
                          <strong>État du feu:</strong> {incident.fireState}
                        </p>
                      )}
                      <p>
                        <strong>Déclaré:</strong> {formatWildfireDate(incident)}
                      </p>
                      {incident.description && (
                        <p className="whitespace-pre-line">
                          <strong>Description:</strong> {incident.description}
                        </p>
                      )}
                      <p>
                        <a
                          href={incident.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 underline"
                        >
                          Voir le signalement complet
                        </a>
                      </p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Marqueurs pour les signalements SignalAir avec spiderfier */}
          <CustomSpiderfiedSignalAirMarkers
            reports={reports}
            createSignalIcon={createSignalIconWrapper}
            handleMarkerClick={handleSignalAirMarkerClickWrapper}
            enabled={spiderfyConfig.enabled}
            zoomThreshold={spiderfyConfig.autoSpiderfyZoomThreshold}
          />
        </MapContainer>

        {/* Tooltip au hover sur les marqueurs */}
        {tooltip.device && (
          <MarkerTooltip
            device={tooltip.device}
            position={tooltip.position}
            sensorMetadata={tooltipMetadata || undefined}
          />
        )}

        {signalAir.signalAirFeedback && (
          <div className="absolute top-24 right-4 z-[1000] max-w-sm bg-white border border-blue-200 text-blue-800 text-sm px-3 py-2 rounded-lg shadow-lg">
            <div className="flex items-start space-x-2">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
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
              <div className="flex-1">
                <p>{signalAir.signalAirFeedback}</p>
              </div>
              <button
                type="button"
                onClick={signalAir.handleDismissSignalAirFeedback}
                className="text-blue-600 hover:text-blue-800"
                aria-label="Fermer le message SignalAir"
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
        )}



        {/* Contrôles de la carte */}
        <div
          className={`absolute bottom-20 left-4 z-[1000] flex flex-col space-y-2 transition-all duration-300 ${
            sidePanels.isSidePanelOpen && sidePanels.panelSize !== "hidden"
              ? "hidden md:flex"
              : "flex"
          }`}
        >
          {/* Contrôle du clustering */}
          <ClusterControl
            config={clusterConfig}
            onConfigChange={setClusterConfig}
          />

          {/* Contrôle du fond de carte */}
          <BaseLayerControl
            currentBaseLayer={currentBaseLayer}
            onBaseLayerChange={setCurrentBaseLayer}
          />

          {/* Réglage source capteurs */}
          {onSourceChange && (
            <SourceSettingsControl
              selectedSources={selectedSources}
              onSourceChange={onSourceChange}
            />
          )}
        </div>

        {/* Légende */}
        {shouldShowStandardLegend && (
          <Legend
            selectedPollutant={selectedPollutant}
            isSidePanelOpen={sidePanels.isSidePanelOpen}
            panelSize={sidePanels.panelSize}
            isComparisonPanelVisible={
              isComparisonPanelVisible && sidePanels.panelSize !== "hidden"
            }
          />
        )}

        {mapLayers.currentModelingLegendUrl && (
          <div
            className={`absolute hidden lg:block ${
              sidePanels.isSidePanelOpen && sidePanels.panelSize !== "hidden"
                ? "bottom-28 right-4"
                : "bottom-24 right-0"
            } z-[1000] transition-all duration-300`}
          >
            <div className="bg-white px-3 py-2 rounded-md shadow-lg border border-gray-200/70">
              <p className="text-xs text-gray-600 font-medium mb-1 whitespace-pre-line">
                {mapLayers.currentModelingLegendTitle ?? "Légende modélisation"}
              </p>
              <img
                src={mapLayers.currentModelingLegendUrl}
                alt="Légende de la couche de modélisation"
                className="max-h-32 w-auto"
              />
            </div>
          </div>
        )}

        {wildfire.isWildfireLayerEnabled &&
          wildfire.wildfireLoading &&
          wildfire.wildfireReports.length === 0 && (
          <div className="absolute top-24 right-4 z-[1000] max-w-xs bg-white border border-orange-200 text-orange-700 text-xs px-3 py-2 rounded-md shadow-lg">
            Chargement des signalements d'incendies…
          </div>
          )}

        {wildfire.isWildfireLayerEnabled && wildfire.wildfireError && (
          <div className="absolute top-36 right-4 z-[1000] max-w-xs bg-white border border-red-200 text-red-700 text-xs px-3 py-2 rounded-md shadow-lg">
            {wildfire.wildfireError}
          </div>
        )}

        {/* Informations de la carte (nombre d'appareils et de signalements) */}
        <div
          className={`absolute ${
            sidePanels.isSidePanelOpen && sidePanels.panelSize !== "hidden"
              ? "bottom-8 right-4 hidden lg:block"
              : "bottom-6 right-0 hidden lg:block"
          } bg-white px-3 py-2 rounded-md shadow-lg z-[1000] transition-all duration-300`}
        >
          <DeviceStatistics
            visibleDevices={visibleDevices}
            visibleReports={visibleReports}
            totalDevices={devices.length}
            totalReports={reports.length}
            selectedPollutant={selectedPollutant}
            showDetails={false}
          />
          {wildfire.isWildfireLayerEnabled && wildfire.wildfireReports.length > 0 && (
            <div className="mt-1 text-xs text-gray-600">
              • {wildfire.wildfireReports.length} incendie
              {wildfire.wildfireReports.length > 1 ? "s" : ""} en cours
            </div>
          )}
        </div>

        {/* Indicateur de spiderfier actif supprimé */}
      </div>

      {/* Fonction pour obtenir l'icône SignalAir selon le type */}
      {(() => {
        const getSignalAirIconPath = (signalType?: string | null): string => {
          if (!signalType) return "/markers/signalAirMarkers/odeur.png";
          
          const typeMap: Record<string, string> = {
            odeur: "odeur",
            bruit: "bruits",
            brulage: "brulage",
            visuel: "visuel",
            pollen: "pollen",
          };
          
          const mappedType = typeMap[signalType.toLowerCase()] || "odeur";
          return `/markers/signalAirMarkers/${mappedType}.png`;
        };

        // Calculer quels boutons doivent être affichés
        const buttons: Array<{ key: string; element: React.ReactElement }> = [];
        const spacing = 60; // Espacement entre les boutons

        // Bouton pour rouvrir le panel de station masqué
        if ((sidePanels.isSidePanelOpen || isComparisonPanelVisible) && 
            sidePanels.panelSize === "hidden") {
          buttons.push({
            key: "station-panel",
            element: (
              <button
                key="station-panel"
                onClick={() => sidePanels.handleSidePanelSizeChange("normal")}
                className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                title={
                  sidePanels.comparisonState.isComparisonMode
                    ? "Rouvrir le panneau de comparaison"
                    : "Rouvrir le panneau de données"
                }
                aria-label={
                  sidePanels.comparisonState.isComparisonMode
                    ? "Rouvrir le panneau de comparaison"
                    : "Rouvrir le panneau de données"
                }
              >
                <svg
                  className="w-5 h-5"
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
              </button>
            ),
          });
        }

        // Bouton pour rouvrir le panel SignalAir masqué
        if (signalAir.isSignalAirDetailPanelOpen &&
            signalAir.signalAirDetailPanelSize === "hidden" &&
            signalAir.selectedSignalAirReport) {
          buttons.push({
            key: "signalair-panel",
            element: (
              <button
                key="signalair-panel"
                onClick={() => signalAir.handleSignalAirDetailPanelSizeChange("normal")}
                className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors border-2 border-gray-300"
                title="Rouvrir le panneau SignalAir"
                aria-label="Rouvrir le panneau SignalAir"
              >
                <img
                  src={getSignalAirIconPath(signalAir.selectedSignalAirReport.signalType)}
                  alt={`Type: ${signalAir.selectedSignalAirReport.signalType || "signalement"}`}
                  className="w-6 h-6"
                  onError={(e) => {
                    // Fallback vers une icône par défaut si l'image ne charge pas
                    (e.target as HTMLImageElement).src = "/markers/signalAirMarkers/odeur.png";
                  }}
                />
              </button>
            ),
          });
        }

        // Bouton pour rouvrir le panel MobileAir de détail masqué
        if (mobileAir.mobileAirRoutes.length > 0 &&
            mobileAir.mobileAirDetailPanelSize === "hidden") {
          buttons.push({
            key: "mobileair-detail-panel",
            element: (
              <button
                key="mobileair-detail-panel"
                onClick={mobileAir.handleOpenMobileAirDetailPanel}
                className="bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors"
                title="Rouvrir le panneau MobileAir (détail)"
                aria-label="Rouvrir le panneau MobileAir (détail)"
              >
                <svg
                  className="w-5 h-5"
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
              </button>
            ),
          });
        }

        // Bouton pour rouvrir le panel MobileAir Selection masqué
        // Afficher si la source est sélectionnée ET que le panel n'est pas visible
        if (selectedSources.some(s => s.includes("mobileair")) &&
            (!mobileAir.isMobileAirSelectionPanelOpen || 
             mobileAir.mobileAirSelectionPanelSize === "hidden")) {
          buttons.push({
            key: "mobileair-selection-panel",
            element: (
              <button
                key="mobileair-selection-panel"
                onClick={() => {
                  // Si le panel n'est pas ouvert, l'ouvrir d'abord
                  if (!mobileAir.isMobileAirSelectionPanelOpen) {
                    mobileAir.handleOpenMobileAirSelectionPanel();
                  }
                  // Ensuite changer la taille à normal
                  mobileAir.handleMobileAirSelectionPanelSizeChange("normal");
                }}
                className="bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors"
                title="Rouvrir le panneau de sélection MobileAir"
                aria-label="Rouvrir le panneau de sélection MobileAir"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect
                    x="5"
                    y="4"
                    width="14"
                    height="16"
                    rx="2"
                    ry="2"
                    strokeWidth={1.5}
                  />
                  <path
                    strokeLinecap="round"
                    strokeWidth={1.5}
                    d="M9 8h6M9 12h6M9 16h3"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 16c1.2-1 1.2-3 0-4"
                  />
                </svg>
              </button>
            ),
          });
        }

        // Bouton pour rouvrir le panel SignalAir Selection masqué
        // Afficher si la source est sélectionnée ET que le panel n'est pas visible
        if (selectedSources.some(s => s.includes("signalair")) &&
            (!signalAir.isSignalAirPanelOpen || 
             signalAir.signalAirPanelSize === "hidden")) {
          buttons.push({
            key: "signalair-selection-panel",
            element: (
              <button
                key="signalair-selection-panel"
                onClick={() => {
                  // Si le panel n'est pas ouvert, l'ouvrir d'abord
                  if (!signalAir.isSignalAirPanelOpen) {
                    signalAir.handleOpenSignalAirPanel();
                  }
                  // Ensuite changer la taille à normal
                  signalAir.handleSignalAirPanelSizeChange("normal");
                }}
                className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                title="Rouvrir le panneau de sélection SignalAir"
                aria-label="Rouvrir le panneau de sélection SignalAir"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect
                    x="5"
                    y="4"
                    width="14"
                    height="16"
                    rx="2"
                    ry="2"
                    strokeWidth={1.5}
                  />
                  <path
                    strokeLinecap="round"
                    strokeWidth={1.5}
                    d="M9 8h6M9 12h6M9 16h3"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 16c1.2-1 1.2-3 0-4"
                  />
                </svg>
              </button>
            ),
          });
        }

        // Calculer les positions maintenant qu'on connaît le nombre total de boutons
        const totalButtons = buttons.length;
        if (totalButtons === 0) return null;

        return (
          <>
            {buttons.map((btn, index) => {
              // Calculer l'offset depuis le centre vertical
              // Si 1 bouton: index 0, offset 0 (centré)
              // Si 2 boutons: index 0 offset -spacing/2, index 1 offset +spacing/2
              // Si 3 boutons: index 0 offset -spacing, index 1 offset 0, index 2 offset +spacing
              const centerIndex = (totalButtons - 1) / 2;
              const offset = (index - centerIndex) * spacing;
              
              return (
                <div
                  key={btn.key}
                  className="fixed left-2 z-[2001]"
                  style={{
                    top: "50%",
                    transform: `translateY(calc(-50% + ${offset}px))`,
                  }}
                >
                  {btn.element}
                </div>
              );
            })}
          </>
        );
      })()}

    </div>
  );
};

export default AirQualityMap;
