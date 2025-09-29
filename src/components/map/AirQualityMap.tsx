import React, { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MeasurementDevice,
  SignalAirReport,
  StationInfo,
  SignalAirProperties,
  MobileAirRoute,
  MobileAirDataPoint,
} from "../../types";
import { baseLayers, BaseLayerKey } from "../../constants/mapLayers";
import BaseLayerControl from "../controls/BaseLayerControl";
import ClusterControl from "../controls/ClusterControl";
import ScaleControl from "../controls/ScaleControl";
import NorthArrow from "../controls/NorthArrow";
import Legend from "./Legend";
import StationSidePanel from "./StationSidePanel";
import MicroSidePanel from "./MicroSidePanel";
import NebuleAirSidePanel from "./NebuleAirSidePanel";
import MobileAirSidePanel from "./MobileAirSidePanel";
import MobileAirSelectionPanel from "./MobileAirSelectionPanel";
import MobileAirDetailPanel from "./MobileAirDetailPanel";
import MobileAirRoutes from "./MobileAirRoutes";
import PurpleAirPopup from "./PurpleAirPopup";
import SensorCommunityPopup from "./SensorCommunityPopup";

import { getMarkerPath } from "../../utils";
import { AtmoRefService } from "../../services/AtmoRefService";
import { AtmoMicroService } from "../../services/AtmoMicroService";
import { NebuleAirService } from "../../services/NebuleAirService";
import MarkerClusterGroup from "react-leaflet-cluster";

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
  loading?: boolean;
  onMobileAirSensorSelected?: (
    sensorId: string,
    period: { startDate: string; endDate: string }
  ) => void;
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

const AirQualityMap: React.FC<AirQualityMapProps> = ({
  devices,
  reports,
  center,
  zoom,
  selectedPollutant,
  selectedSources,
  loading,
  onMobileAirSensorSelected,
}) => {
  // Debug: Log des sources sélectionnées (à supprimer en production)
  // console.log("🔍 [SOURCES] Sources sélectionnées:", {
  //   selectedSources,
  //   mobileAirSelected: selectedSources.includes("communautaire.mobileair"),
  //   mobileAirDirect: selectedSources.includes("mobileair"),
  //   allSources: selectedSources,
  //   mobileAirInSources: selectedSources.filter((s) => s.includes("mobileair")),
  // });
  const mapRef = useRef<L.Map | null>(null);
  const previousCenterRef = useRef<[number, number] | null>(null);
  const previousZoomRef = useRef<number | null>(null);
  const [currentBaseLayer, setCurrentBaseLayer] =
    useState<BaseLayerKey>("Carte standard");
  const [currentTileLayer, setCurrentTileLayer] = useState<L.TileLayer | null>(
    null
  );
  const [selectedStation, setSelectedStation] = useState<StationInfo | null>(
    null
  );
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [panelSize, setPanelSize] = useState<
    "normal" | "fullscreen" | "hidden"
  >("normal");
  const [clusterConfig, setClusterConfig] = useState(defaultClusterConfig);

  // États pour MobileAir
  const [mobileAirRoutes, setMobileAirRoutes] = useState<MobileAirRoute[]>([]);
  const [isMobileAirSelectionPanelOpen, setIsMobileAirSelectionPanelOpen] =
    useState(false);
  const [mobileAirSelectionPanelSize, setMobileAirSelectionPanelSize] =
    useState<"normal" | "fullscreen" | "hidden">("normal");
  const [isMobileAirDetailPanelOpen, setIsMobileAirDetailPanelOpen] =
    useState(false);
  const [mobileAirDetailPanelSize, setMobileAirDetailPanelSize] = useState<
    "normal" | "fullscreen" | "hidden"
  >("normal");

  // État pour la popup PurpleAir
  const [selectedPurpleAirDevice, setSelectedPurpleAirDevice] = useState<
    | (MeasurementDevice & {
        qualityLevel: string;
        rssi: number;
        uptime: number;
        confidence: number;
        temperature: number;
        humidity: number;
        pm1Value: number;
        pm25Value: number;
        pm10Value: number;
      })
    | null
  >(null);

  // État pour la popup Sensor Community
  const [selectedSensorCommunityDevice, setSelectedSensorCommunityDevice] =
    useState<
      | (MeasurementDevice & {
          qualityLevel: string;
          sensorId?: string;
          manufacturer?: string;
          sensorType?: string;
          altitude?: string;
        })
      | null
    >(null);

  const [selectedMobileAirRoute, setSelectedMobileAirRoute] =
    useState<MobileAirRoute | null>(null);
  const [hoveredMobileAirPoint, setHoveredMobileAirPoint] =
    useState<MobileAirDataPoint | null>(null);
  const [highlightedMobileAirPoint, setHighlightedMobileAirPoint] =
    useState<MobileAirDataPoint | null>(null);
  const [activeMobileAirRoute, setActiveMobileAirRoute] =
    useState<MobileAirRoute | null>(null);

  // États pour suivre les actions manuelles de l'utilisateur
  const [userClosedSelectionPanel, setUserClosedSelectionPanel] =
    useState(false);
  const [userClosedDetailPanel, setUserClosedDetailPanel] = useState(false);

  // État pour forcer un nouveau choix lors de la réactivation
  const [forceNewChoice, setForceNewChoice] = useState(false);

  // Effet pour extraire les routes MobileAir des devices
  useEffect(() => {
    const isMobileAirSelected = selectedSources.includes(
      "communautaire.mobileair"
    );

    if (!isMobileAirSelected) {
      console.log(
        "🚫 [ROUTES] MobileAir non sélectionné, suppression des routes"
      );
      setMobileAirRoutes([]);
      setForceNewChoice(false);
      return;
    }

    // Si on force un nouveau choix, ne pas créer de routes
    if (forceNewChoice) {
      console.log(
        "🔄 [ROUTES] Forçage d'un nouveau choix - suppression des routes existantes"
      );
      setMobileAirRoutes([]);
      return;
    }

    const routes: MobileAirRoute[] = [];

    devices.forEach((device) => {
      if (device.source === "mobileair" && (device as any).mobileAirRoute) {
        routes.push((device as any).mobileAirRoute);
      }
    });

    // console.log("🔄 [ROUTES] Mise à jour des routes MobileAir:", {
    //   routesCount: routes.length,
    //   routes: routes.map((r) => ({
    //     sensorId: r.sensorId,
    //     sessionId: r.sessionId,
    //   })),
    //   selectedSources: selectedSources.filter((s) => s.includes("mobileair")),
    // });
    setMobileAirRoutes(routes);

    // Définir automatiquement la route la plus récente comme active
    if (routes.length > 0 && !activeMobileAirRoute) {
      const mostRecentRoute = routes.reduce((latest, current) => {
        return new Date(current.startTime) > new Date(latest.startTime)
          ? current
          : latest;
      });
      setActiveMobileAirRoute(mostRecentRoute);
    }
  }, [devices, activeMobileAirRoute, selectedSources, forceNewChoice]);

  // Effet pour ouvrir automatiquement le side panel de sélection MobileAir
  useEffect(() => {
    // Vérifier si MobileAir est dans les sources sélectionnées
    const isMobileAirSelected = selectedSources.includes(
      "communautaire.mobileair"
    );
    const hasMobileAirRoutes = mobileAirRoutes.length > 0;

    // Debug: Logs d'ouverture de panel (à supprimer en production)
    // if (isMobileAirSelected) {
    //   console.log("🔍 [DEBUG] Effet ouverture panel sélection:", {
    //     isMobileAirSelected,
    //     hasMobileAirRoutes,
    //     isMobileAirSelectionPanelOpen,
    //     userClosedSelectionPanel,
    //     selectedSources: selectedSources.filter((s) => s.includes("mobileair")),
    //     allSelectedSources: selectedSources,
    //   });
    // }

    // Si MobileAir est sélectionné mais qu'il n'y a pas encore de routes chargées,
    // ouvrir le side panel de sélection (seulement si l'utilisateur ne l'a pas fermé manuellement)
    if (
      isMobileAirSelected &&
      !hasMobileAirRoutes &&
      !isMobileAirSelectionPanelOpen &&
      !userClosedSelectionPanel
    ) {
      // console.log("✅ [AUTO-OPEN] Ouverture automatique du panel de sélection MobileAir");
      setIsMobileAirSelectionPanelOpen(true);
    }

    // Si MobileAir est sélectionné ET qu'il y a des routes, s'assurer que le panel de sélection est fermé
    // MAIS seulement si l'utilisateur n'a pas fermé manuellement le panel de sélection
    if (
      isMobileAirSelected &&
      hasMobileAirRoutes &&
      isMobileAirSelectionPanelOpen &&
      !userClosedSelectionPanel
    ) {
      // console.log("🔄 [AUTO-CLOSE] Fermeture du panel de sélection car routes disponibles");
      setIsMobileAirSelectionPanelOpen(false);
    }
  }, [
    selectedSources,
    mobileAirRoutes.length,
    isMobileAirSelectionPanelOpen,
    userClosedSelectionPanel,
  ]);

  // Effet pour fermer automatiquement le side panel de sélection quand les routes sont chargées
  // Seulement si l'utilisateur n'a pas fermé manuellement le panel
  useEffect(() => {
    // Vérifier que MobileAir est toujours sélectionné
    const isMobileAirSelected = selectedSources.includes(
      "communautaire.mobileair"
    );

    if (
      isMobileAirSelected &&
      mobileAirRoutes.length > 0 &&
      isMobileAirSelectionPanelOpen &&
      !userClosedSelectionPanel
    ) {
      // console.log("✅ [AUTO-CLOSE] Fermeture automatique du panel de sélection MobileAir");
      // Délai pour éviter les conflits avec les actions manuelles
      const timer = setTimeout(() => {
        setIsMobileAirSelectionPanelOpen(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [
    selectedSources,
    mobileAirRoutes.length,
    isMobileAirSelectionPanelOpen,
    userClosedSelectionPanel,
  ]);

  // Effet pour ouvrir automatiquement le side panel de détail quand les routes sont chargées
  // Seulement si l'utilisateur n'a pas fermé manuellement le panel
  useEffect(() => {
    // Vérifier que MobileAir est toujours sélectionné
    const isMobileAirSelected = selectedSources.includes(
      "communautaire.mobileair"
    );

    if (
      isMobileAirSelected &&
      mobileAirRoutes.length > 0 &&
      activeMobileAirRoute &&
      !isMobileAirDetailPanelOpen &&
      !userClosedDetailPanel
    ) {
      console.log(
        "✅ [AUTO-OPEN] Ouverture automatique du panel de détail MobileAir"
      );
      // Délai pour éviter les conflits avec les actions manuelles
      const timer = setTimeout(() => {
        setIsMobileAirDetailPanelOpen(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [
    selectedSources,
    mobileAirRoutes.length,
    activeMobileAirRoute,
    isMobileAirDetailPanelOpen,
    userClosedDetailPanel,
  ]);

  // Effet pour centrer la carte sur la route active
  useEffect(() => {
    if (
      activeMobileAirRoute &&
      activeMobileAirRoute.points.length > 0 &&
      mapRef.current
    ) {
      const bounds = activeMobileAirRoute.points.map(
        (point) => [point.lat, point.lon] as [number, number]
      );
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [activeMobileAirRoute]);

  // Effet pour réinitialiser les états de fermeture manuelle quand les sources changent
  useEffect(() => {
    const isMobileAirSelected = selectedSources.includes(
      "communautaire.mobileair"
    );

    // console.log("🔍 [SOURCES-CHANGE] Changement des sources:", {
    //   selectedSources,
    //   isMobileAirSelected,
    //   previousSources: "voir log précédent",
    // });

    if (!isMobileAirSelected) {
      // console.log("✅ [RESET] MobileAir désélectionné, réinitialisation des états");
      // Nettoyer IMMÉDIATEMENT les routes pour éviter les conflits
      // console.log("🧹 [CLEANUP] Nettoyage des routes MobileAir");
      // D'abord nettoyer la route active pour que les points disparaissent immédiatement
      setActiveMobileAirRoute(null);
      setSelectedMobileAirRoute(null);
      setHoveredMobileAirPoint(null);
      setHighlightedMobileAirPoint(null);
      // Puis nettoyer toutes les routes
      setMobileAirRoutes([]);
      // Puis fermer les panels
      setUserClosedSelectionPanel(false);
      setUserClosedDetailPanel(false);
      setIsMobileAirSelectionPanelOpen(false);
      setIsMobileAirDetailPanelOpen(false);

      // console.log("✅ [CLEANUP-DONE] Nettoyage terminé, tous les états MobileAir réinitialisés");
    } else {
      // console.log("ℹ️ [SOURCES] MobileAir sélectionné - réinitialisation pour permettre nouveau choix");
      // Réinitialiser les états pour permettre à l'utilisateur de choisir à nouveau
      setActiveMobileAirRoute(null);
      setSelectedMobileAirRoute(null);
      setHoveredMobileAirPoint(null);
      setHighlightedMobileAirPoint(null);
      setUserClosedSelectionPanel(false);
      setUserClosedDetailPanel(false);
      setIsMobileAirDetailPanelOpen(false);
      // Supprimer les routes existantes pour forcer un nouveau choix
      setMobileAirRoutes([]);
      // Activer le flag pour forcer un nouveau choix
      setForceNewChoice(true);
      // Le panel de sélection s'ouvrira automatiquement via l'autre effet
    }
  }, [selectedSources]);

  // Effet pour nettoyer les devices MobileAir quand MobileAir est désélectionné
  useEffect(() => {
    const isMobileAirSelected = selectedSources.includes(
      "communautaire.mobileair"
    );

    if (!isMobileAirSelected) {
      // Nettoyer les devices MobileAir de la liste des devices
      // (ils sont gérés séparément par les routes)
      // console.log("🧹 [DEVICES] Nettoyage des devices MobileAir");
      // Note: Les devices sont gérés par le hook useAirQualityData
      // Ici on s'assure juste que les routes sont bien nettoyées
    }
  }, [selectedSources]);

  // Effet pour mettre à jour la vue de la carte
  useEffect(() => {
    if (mapRef.current) {
      // Vérifier si les valeurs ont réellement changé
      const centerChanged =
        !previousCenterRef.current ||
        previousCenterRef.current[0] !== center[0] ||
        previousCenterRef.current[1] !== center[1];
      const zoomChanged = previousZoomRef.current !== zoom;

      if (centerChanged || zoomChanged) {
        mapRef.current.setView(center, zoom);
        previousCenterRef.current = center;
        previousZoomRef.current = zoom;
      }
    }
  }, [center, zoom]);

  // Effet pour mettre à jour le fond de carte
  useEffect(() => {
    if (mapRef.current) {
      // Supprimer l'ancien fond de carte s'il existe
      if (currentTileLayer) {
        mapRef.current.removeLayer(currentTileLayer);
      }

      // Ajouter le nouveau fond de carte seulement si ce n'est pas la carte standard
      if (currentBaseLayer !== "Carte standard") {
        const newTileLayer = baseLayers[currentBaseLayer];
        newTileLayer.addTo(mapRef.current);
        setCurrentTileLayer(newTileLayer);
      } else {
        setCurrentTileLayer(null);
      }
    }
  }, [currentBaseLayer]);

  const handleBaseLayerChange = (layerKey: BaseLayerKey) => {
    setCurrentBaseLayer(layerKey);
  };

  // Fonction pour créer un marqueur personnalisé
  const createCustomIcon = (device: MeasurementDevice) => {
    const qualityLevel = device.qualityLevel || "default";
    const markerPath = getMarkerPath(device.source, qualityLevel);

    // Créer un élément HTML personnalisé pour le marqueur
    const div = document.createElement("div");
    div.className = `custom-marker-container ${device.source}`;

    // Image de base du marqueur
    const img = document.createElement("img");
    img.src = markerPath;
    img.alt = `${device.source} marker`;

    // Ajouter une animation subtile pendant le chargement
    if (loading) {
      div.style.opacity = "0.7";
      div.style.transform = "scale(0.95)";
      div.style.transition = "all 0.3s ease";
    }

    // Texte de la valeur pour les appareils de mesure
    const valueText = document.createElement("div");
    valueText.className = "value-text";

    // Gestion normale pour les appareils de mesure
    if (device.status === "active" && device.value >= 0) {
      const displayValue = Math.round(device.value);
      valueText.textContent = displayValue.toString();

      // Ajuster la taille du texte selon la longueur de la valeur
      if (displayValue >= 100) {
        valueText.style.fontSize = "12px"; // Police plus petite pour les valeurs à 3 chiffres
      } else if (displayValue >= 10) {
        valueText.style.fontSize = "16px"; // Police moyenne pour les valeurs à 2 chiffres
      } else {
        valueText.style.fontSize = "18px"; // Police normale pour les valeurs à 1 chiffre
      }

      // Couleur du texte selon le niveau de qualité
      const textColors: Record<string, string> = {
        bon: "#000000",
        moyen: "#000000",
        degrade: "#000000",
        mauvais: "#000000", // Noir au lieu de blanc pour les marqueurs rouges
        tresMauvais: "#000000", // Noir au lieu de blanc pour les marqueurs rouges
        extrMauvais: "#000000",
        default: "#666666",
      };

      valueText.style.color = textColors[qualityLevel] || "#000000";

      // Ajouter un contour blanc pour améliorer la lisibilité
      if (qualityLevel !== "default") {
        // Contour plus subtil pour éviter l'effet de "paté"
        valueText.style.textShadow =
          "1px 1px 2px rgba(255,255,255,0.8), -1px -1px 2px rgba(255,255,255,0.8)";
      }

      // Indicateur de valeur corrigée pour AtmoMicro
      if (device.source === "atmoMicro" && device.has_correction) {
        // Ajouter un indicateur visuel pour les données consolidées
        const correctionIndicator = document.createElement("div");
        correctionIndicator.style.cssText = `
          position: absolute;
          top: -4px;
          right: -4px;
          width: 16px;
          height: 16px;
          background-color: rgba(59, 130, 246, 0.9);
          border-radius: 50%;
          border: 2px solid white;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        `;

        // Ajouter l'icône Bootstrap Icons
        correctionIndicator.innerHTML = `
          <svg width="10" height="10" fill="white" viewBox="0 0 16 16">
            <path d="M5.338 1.59a61.44 61.44 0 0 0-2.837.856.481.481 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.725 10.725 0 0 0 2.287 2.233c.346.244.652.42.893.533.12.057.218.095.293.118a.55.55 0 0 0 .101.025.615.615 0 0 0 .1-.025c.076-.023.174-.061.294-.118.24-.113.547-.29.893-.533a10.726 10.726 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.775 11.775 0 0 1-2.517 2.453 7.159 7.159 0 0 1-1.048.625c-.28.132-.581.24-.829.24s-.548-.108-.829-.24a7.158 7.158 0 0 1-1.048-.625 11.777 11.777 0 0 1-2.517-2.453C1.928 10.487.545 7.169 1.141 2.692A1.54 1.54 0 0 1 2.185 1.43 62.456 62.456 0 0 1 5.072.56z"/>
            <path d="M10.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0z"/>
          </svg>
        `;

        div.appendChild(correctionIndicator);
      }
    }

    div.appendChild(img);
    div.appendChild(valueText);

    return L.divIcon({
      html: div.outerHTML,
      className: "custom-marker-div",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  };

  // Fonction pour créer un marqueur personnalisé pour les signalements SignalAir
  const createSignalIcon = (report: SignalAirReport) => {
    const qualityLevel = report.qualityLevel || "default";
    const markerPath = getMarkerPath(report.source, qualityLevel);

    // Créer un élément HTML personnalisé pour le marqueur de signalement
    const div = document.createElement("div");
    div.className = "custom-marker-container";

    // Image de base du marqueur
    const img = document.createElement("img");
    img.src = markerPath;
    img.alt = `${report.source} signal marker`;

    // Ajouter une animation subtile pendant le chargement
    if (loading) {
      div.style.opacity = "0.7";
      div.style.transform = "scale(0.95)";
      div.style.transition = "all 0.3s ease";
    }

    // Pour SignalAir, on n'ajoute pas de texte par-dessus le marqueur
    div.appendChild(img);

    return L.divIcon({
      html: div.outerHTML,
      className: "custom-marker-div",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  };

  // // Fonction pour formater la valeur affichée
  // const formatValue = (device: MeasurementDevice) => {
  //   if (device.status === "inactive") {
  //     return "Pas de données récentes";
  //   }

  //   // Pour AtmoMicro avec valeurs corrigées
  //   if (device.source === "atmoMicro" && device.has_correction) {
  //     const correctedValue = device.corrected_value;
  //     const rawValue = device.raw_value;
  //     return `${correctedValue} ${device.unit} (corrigé, brut: ${rawValue})`;
  //   }

  //   // Pour les autres sources ou AtmoMicro sans correction
  //   return `${device.value} ${device.unit}`;
  // };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleMarkerClick = async (device: MeasurementDevice) => {
    // Exclure SignalAir
    if (device.source === "signalair") {
      return;
    }

    // Gérer PurpleAir avec popup
    if (device.source === "purpleair") {
      setSelectedPurpleAirDevice(device as any);
      return;
    }

    // Gérer Sensor Community avec popup
    if (device.source === "sensorCommunity") {
      setSelectedSensorCommunityDevice(device as any);
      return;
    }

    // Supporter AtmoRef, AtmoMicro et NebuleAir
    if (
      device.source !== "atmoRef" &&
      device.source !== "atmoMicro" &&
      device.source !== "nebuleair"
    ) {
      return;
    }

    try {
      let variables: Record<
        string,
        { label: string; code_iso: string; en_service: boolean }
      > = {};

      // Récupérer les informations détaillées selon la source
      if (device.source === "atmoRef") {
        const atmoRefService = new AtmoRefService();
        variables = await atmoRefService.fetchStationVariables(device.id);
      } else if (device.source === "atmoMicro") {
        const atmoMicroService = new AtmoMicroService();
        variables = await atmoMicroService.fetchSiteVariables(device.id);
      } else if (device.source === "nebuleair") {
        const nebuleAirService = new NebuleAirService();
        variables = await nebuleAirService.fetchSiteVariables(device.id);
      }

      const stationInfo: StationInfo = {
        id: device.id,
        name: device.name,
        address: device.address || "",
        departmentId: device.departmentId || "",
        source: device.source,
        variables,
      };

      setSelectedStation(stationInfo);
      setIsSidePanelOpen(true);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des informations de la station:",
        error
      );
    }
  };

  const handleCloseSidePanel = () => {
    setIsSidePanelOpen(false);
    setSelectedStation(null);
    setPanelSize("normal");
  };

  const handleSidePanelSizeChange = (
    newSize: "normal" | "fullscreen" | "hidden"
  ) => {
    setPanelSize(newSize);
  };

  // Callbacks pour MobileAir
  const handleMobileAirSensorsSelected = (
    sensorId: string,
    period: { startDate: string; endDate: string }
  ) => {
    // Cette fonction sera appelée par le panneau MobileAir
    // Elle déclenchera le chargement des données via le hook useAirQualityData
    console.log(
      "📱 [MOBILEAIR] Capteur sélectionné:",
      sensorId,
      "Période:",
      period
    );
    // Désactiver le flag de forçage de nouveau choix quand l'utilisateur fait un choix
    setForceNewChoice(false);
    if (onMobileAirSensorSelected) {
      onMobileAirSensorSelected(sensorId, period);
    }
  };

  const handleCloseMobileAirSelectionPanel = () => {
    // console.log("🚪 [MANUAL] Fermeture manuelle du panel de sélection MobileAir");
    setUserClosedSelectionPanel(true);
    setIsMobileAirSelectionPanelOpen(false);
    setMobileAirSelectionPanelSize("normal");
  };

  const handleMobileAirSelectionPanelSizeChange = (
    newSize: "normal" | "fullscreen" | "hidden"
  ) => {
    // console.log("📏 [SIZE] Changement de taille du panel de sélection MobileAir:", newSize);
    setMobileAirSelectionPanelSize(newSize);

    // Si l'utilisateur masque le panel, ne pas le rouvrir automatiquement
    if (newSize === "hidden") {
      // console.log("👁️ [HIDE] Panel de sélection masqué par l'utilisateur");
      setUserClosedSelectionPanel(true);
    }
  };

  const handleCloseMobileAirDetailPanel = () => {
    // console.log("🚪 [MANUAL] Fermeture manuelle du panel de détail MobileAir");
    setUserClosedDetailPanel(true);
    setIsMobileAirDetailPanelOpen(false);
    setMobileAirDetailPanelSize("normal");
    setSelectedMobileAirRoute(null);
  };

  const handleMobileAirDetailPanelSizeChange = (
    newSize: "normal" | "fullscreen" | "hidden"
  ) => {
    // console.log("📏 [SIZE] Changement de taille du panel de détail MobileAir:", newSize);
    setMobileAirDetailPanelSize(newSize);

    // Si l'utilisateur masque le panel, ne pas le rouvrir automatiquement
    if (newSize === "hidden") {
      // console.log("👁️ [HIDE] Panel de détail masqué par l'utilisateur");
      setUserClosedDetailPanel(true);
    }
  };

  const handleMobileAirPointClick = (
    route: MobileAirRoute,
    point: MobileAirDataPoint
  ) => {
    setSelectedMobileAirRoute(route);
    setIsMobileAirDetailPanelOpen(true);
  };

  const handleMobileAirPointHover = useCallback(
    (point: MobileAirDataPoint | null) => {
      setHoveredMobileAirPoint(point);
    },
    []
  );

  const handleMobileAirPointHighlight = useCallback(
    (point: MobileAirDataPoint | null) => {
      if (point) {
        // console.log("🎯 [HIGHLIGHT] Point mis en surbrillance:", `${point.sensorId}-${point.sessionId}-${point.time}`);
      }
      setHighlightedMobileAirPoint(point);

      // Centrer la carte sur le point mis en surbrillance
      if (point && mapRef.current) {
        mapRef.current.setView([point.lat, point.lon], 16, {
          animate: true,
          duration: 0.5,
        });
      }
    },
    []
  );

  const handleMobileAirRouteClick = (route: MobileAirRoute) => {
    setActiveMobileAirRoute(route);

    // Centrer la carte sur la route sélectionnée
    if (route.points.length > 0 && mapRef.current) {
      const bounds = route.points.map(
        (point) => [point.lat, point.lon] as [number, number]
      );
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  };

  // Handlers pour la réouverture manuelle des panels
  const handleOpenMobileAirSelectionPanel = () => {
    // console.log("🔄 [MANUAL] Ouverture manuelle du panel de sélection MobileAir");
    setUserClosedSelectionPanel(false);
    setIsMobileAirSelectionPanelOpen(true);
    // Désactiver le flag de forçage de nouveau choix
    setForceNewChoice(false);
  };

  const handleOpenMobileAirDetailPanel = () => {
    // console.log("🔄 [MANUAL] Ouverture manuelle du panel de détail MobileAir");
    setUserClosedDetailPanel(false);
    setIsMobileAirDetailPanelOpen(true);
  };

  return (
    <div className="w-full h-full flex">
      {/* Side Panel - AtmoRef */}
      {selectedStation?.source === "atmoRef" && (
        <StationSidePanel
          isOpen={isSidePanelOpen}
          selectedStation={selectedStation}
          onClose={handleCloseSidePanel}
          onHidden={() => handleSidePanelSizeChange("hidden")}
          onSizeChange={handleSidePanelSizeChange}
          panelSize={panelSize}
          initialPollutant={selectedPollutant}
        />
      )}

      {/* Side Panel - AtmoMicro */}
      {selectedStation?.source === "atmoMicro" && (
        <MicroSidePanel
          isOpen={isSidePanelOpen}
          selectedStation={selectedStation}
          onClose={handleCloseSidePanel}
          onHidden={() => handleSidePanelSizeChange("hidden")}
          onSizeChange={handleSidePanelSizeChange}
          panelSize={panelSize}
          initialPollutant={selectedPollutant}
        />
      )}

      {/* Side Panel - NebuleAir */}
      {selectedStation?.source === "nebuleair" && (
        <NebuleAirSidePanel
          isOpen={isSidePanelOpen}
          selectedStation={selectedStation}
          onClose={handleCloseSidePanel}
          onHidden={() => handleSidePanelSizeChange("hidden")}
          onSizeChange={handleSidePanelSizeChange}
          panelSize={panelSize}
          initialPollutant={selectedPollutant}
        />
      )}

      {/* Side Panel - MobileAir Selection (droite) */}
      <MobileAirSelectionPanel
        isOpen={isMobileAirSelectionPanelOpen}
        selectedPollutant={selectedPollutant}
        onClose={handleCloseMobileAirSelectionPanel}
        onHidden={() => handleMobileAirSelectionPanelSizeChange("hidden")}
        onSizeChange={handleMobileAirSelectionPanelSizeChange}
        panelSize={mobileAirSelectionPanelSize}
        onSensorSelected={handleMobileAirSensorsSelected}
      />

      {/* Side Panel - MobileAir Detail (gauche) */}
      <MobileAirDetailPanel
        isOpen={isMobileAirDetailPanelOpen}
        selectedRoute={selectedMobileAirRoute}
        activeRoute={activeMobileAirRoute}
        allRoutes={mobileAirRoutes}
        selectedPollutant={selectedPollutant}
        highlightedPoint={highlightedMobileAirPoint}
        onClose={handleCloseMobileAirDetailPanel}
        onHidden={() => handleMobileAirDetailPanelSizeChange("hidden")}
        onSizeChange={handleMobileAirDetailPanelSizeChange}
        panelSize={mobileAirDetailPanelSize}
        onPointHover={handleMobileAirPointHover}
        onPointHighlight={handleMobileAirPointHighlight}
        onRouteSelect={setActiveMobileAirRoute}
      />

      {/* Conteneur de la carte */}
      <div className="flex-1 relative">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{
            height: "100%",
            width: "100%",
            minHeight: "100%",
          }}
          ref={mapRef}
          zoomControl={false}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          dragging={true}
          touchZoom={true}
          minZoom={1}
          maxZoom={19}
        >
          {/* Fond de carte initial */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {/* Contrôle d'échelle */}
          <ScaleControl />

          {/* Flèche du nord */}
          <NorthArrow />

          {/* Marqueurs pour les appareils de mesure */}
          {clusterConfig.enabled ? (
            <MarkerClusterGroup
              maxClusterRadius={clusterConfig.maxClusterRadius}
              spiderfyOnMaxZoom={clusterConfig.spiderfyOnMaxZoom}
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
                    key={device.id}
                    position={[device.latitude, device.longitude]}
                    icon={createCustomIcon(device)}
                    eventHandlers={{
                      click: () => handleMarkerClick(device),
                    }}
                  />
                ))}
            </MarkerClusterGroup>
          ) : (
            devices
              .filter((device) => {
                // Filtrer complètement les devices MobileAir (gérés par MobileAirRoutes)
                if (device.source === "mobileair") {
                  // console.log("🚫 [FILTER] Filtrage device MobileAir (géré par MobileAirRoutes):", device.id, device.name);
                  return false;
                }
                return true;
              })
              .map((device) => (
                <Marker
                  key={device.id}
                  position={[device.latitude, device.longitude]}
                  icon={createCustomIcon(device)}
                  eventHandlers={{
                    click: () => handleMarkerClick(device),
                  }}
                />
              ))
          )}

          {/* Parcours MobileAir - Afficher seulement la route active */}
          <MobileAirRoutes
            routes={activeMobileAirRoute ? [activeMobileAirRoute] : []}
            selectedPollutant={selectedPollutant}
            onPointClick={handleMobileAirPointClick}
            onPointHover={handleMobileAirPointHover}
            onRouteClick={handleMobileAirRouteClick}
            highlightedPoint={highlightedMobileAirPoint}
          />

          {/* Marqueurs pour les signalements SignalAir */}
          {reports.map((report) => (
            <Marker
              key={report.id}
              position={[report.latitude, report.longitude]}
              icon={createSignalIcon(report)}
              eventHandlers={{
                click: () => {},
              }}
            >
              <Popup>
                <div className="device-popup min-w-[280px]">
                  <h3 className="font-bold text-lg mb-2">{report.name}</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Source:</strong> {report.source}
                    </p>

                    {/* Informations spécifiques à SignalAir */}
                    <p>
                      <strong>Type:</strong>{" "}
                      {report.signalType || "Non spécifié"}
                    </p>

                    {/* Date de création */}
                    <p>
                      <strong>Date de création:</strong>{" "}
                      {report.signalCreatedAt
                        ? formatTimestamp(report.signalCreatedAt)
                        : "Non spécifiée"}
                    </p>

                    {/* Durée de la nuisance */}
                    <p>
                      <strong>Durée de la nuisance:</strong>{" "}
                      {report.signalDuration || "Non spécifiée"}
                    </p>

                    {/* Symptômes */}
                    <p>
                      <strong>Avez-vous des symptômes:</strong>{" "}
                      {report.signalHasSymptoms || "Non spécifié"}
                    </p>

                    {/* Détail des symptômes si oui */}
                    {report.signalHasSymptoms === "Oui" && (
                      <p>
                        <strong>Symptômes:</strong>{" "}
                        {report.signalSymptoms
                          ? report.signalSymptoms.split("|").join(", ")
                          : "Non spécifiés"}
                      </p>
                    )}

                    {/* Description */}
                    {report.signalDescription && (
                      <p>
                        <strong>Description:</strong> {report.signalDescription}
                      </p>
                    )}

                    {report.address && (
                      <p>
                        <strong>Adresse:</strong> {report.address}
                      </p>
                    )}

                    {/* Bouton pour signaler une nuisance */}
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <a
                        href="https://www.signalair.eu/fr/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 hover:border-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Signaler une nuisance
                      </a>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Contrôles de la carte */}
        <div className="absolute bottom-20 left-4 z-[1000] flex flex-col space-y-2">
          {/* Contrôle du clustering */}
          <ClusterControl
            config={clusterConfig}
            onConfigChange={setClusterConfig}
          />

          {/* Contrôle du fond de carte */}
          <BaseLayerControl
            currentBaseLayer={currentBaseLayer}
            onBaseLayerChange={handleBaseLayerChange}
          />
        </div>

        {/* Légende */}
        <Legend
          selectedPollutant={selectedPollutant}
          isSidePanelOpen={isSidePanelOpen}
          panelSize={panelSize}
        />
      </div>

      {/* Bouton pour rouvrir le panel masqué */}
      {isSidePanelOpen && panelSize === "hidden" && (
        <button
          onClick={() => handleSidePanelSizeChange("normal")}
          className="fixed top-60 left-2 z-[2001] bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          title="Rouvrir le panneau de données"
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
      )}

      {/* Bouton pour rouvrir le panel MobileAir de détail masqué */}
      {mobileAirRoutes.length > 0 && userClosedDetailPanel && (
        <button
          onClick={handleOpenMobileAirDetailPanel}
          className="fixed top-60 right-2 z-[2001] bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors"
          title="Rouvrir le panneau MobileAir"
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
      )}

      {/* Popup PurpleAir */}
      {selectedPurpleAirDevice && (
        <PurpleAirPopup
          device={selectedPurpleAirDevice}
          onClose={() => setSelectedPurpleAirDevice(null)}
        />
      )}

      {/* Popup Sensor Community */}
      {selectedSensorCommunityDevice && (
        <SensorCommunityPopup
          device={selectedSensorCommunityDevice}
          onClose={() => setSelectedSensorCommunityDevice(null)}
        />
      )}
    </div>
  );
};

export default AirQualityMap;
