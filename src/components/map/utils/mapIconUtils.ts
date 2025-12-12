import L from "leaflet";
import {
  MeasurementDevice,
  SignalAirReport,
  WildfireReport,
  StationInfo,
  ComparisonState,
} from "../../../types";
import { getMarkerPath } from "../../../utils";
import { QUALITY_COLORS } from "../../../constants/qualityColors";
import { createSVGMarkerIcon } from "./svgMarkerUtils";
import { getMarkerZIndex } from "../../../utils/markerPriority";

interface CreateIconOptions {
  loading?: boolean;
  isSelected?: boolean;
  comparisonState?: ComparisonState;
  selectedStation?: StationInfo | null;
  wildfireLoading?: boolean;
  wildfireReportsCount?: number;
}

/**
 * Vérifie si un appareil est sélectionné
 */
export const isDeviceSelected = (
  device: MeasurementDevice,
  comparisonState: ComparisonState,
  selectedStation: StationInfo | null
): boolean => {
  // En mode comparaison, ignorer selectedStation et ne vérifier que comparedStations
  if (comparisonState.isComparisonMode) {
    return comparisonState.comparedStations.some(
      (station) => station.id === device.id
    );
  }

  // En mode normal, vérifier si l'appareil est dans le side panel normal
  if (selectedStation && selectedStation.id === device.id) {
    return true;
  }

  return false;
};

/**
 * Génère une clé unique pour les marqueurs incluant l'état de sélection
 */
export const getMarkerKey = (
  device: MeasurementDevice,
  comparisonState: ComparisonState,
  selectedStation: StationInfo | null
): string => {
  const isSelected = isDeviceSelected(device, comparisonState, selectedStation);
  // En mode comparaison, utiliser uniquement les IDs des stations comparées
  // En mode normal, utiliser l'ID de la station sélectionnée
  const selectedIds = comparisonState.isComparisonMode
    ? comparisonState.comparedStations.map((s) => s.id).sort().join(",")
    : selectedStation?.id || "";
  return `${device.id}-${isSelected ? "selected" : "unselected"}-${selectedIds}`;
};

/**
 * Liste des sources qui utilisent des SVG générés dynamiquement
 */
const SVG_SOURCES = ["atmoRef", "atmoMicro", "nebuleair", "sensorCommunity", "purpleair"];

/**
 * Crée un marqueur personnalisé pour un appareil de mesure
 */
export const createCustomIcon = (
  device: MeasurementDevice,
  options: CreateIconOptions = {}
): L.DivIcon => {
  const {
    loading = false,
    isSelected = false,
    comparisonState,
    selectedStation,
  } = options;

  const qualityLevel = device.qualityLevel || "default";

  // Vérifier si cet appareil est sélectionné et ajouter la mise en évidence
  const deviceIsSelected =
    isSelected ||
    (comparisonState
      ? isDeviceSelected(device, comparisonState, selectedStation || null)
      : false);

  // Utiliser SVG pour les sources concernées
  if (SVG_SOURCES.includes(device.source)) {
    // Fonction pour forcer les valeurs négatives à 0
    const ensureNonNegativeValue = (value: number | undefined | null): number | undefined => {
      if (value === undefined || value === null) return undefined;
      if (typeof value === "number" && !isNaN(value)) {
        return Math.max(0, value);
      }
      return undefined;
    };

    const correctedValue =
      device.status === "active" ? ensureNonNegativeValue(device.value) : undefined;

    const highlightColor = deviceIsSelected
      ? QUALITY_COLORS[qualityLevel as keyof typeof QUALITY_COLORS] || "#3b82f6"
      : undefined;

    return createSVGMarkerIcon(device.source, qualityLevel, correctedValue, {
      isSelected: deviceIsSelected,
      highlightColor,
      loading,
      hasCorrection: device.source === "atmoMicro" && device.has_correction,
      device, // Passer le device complet pour calculer la priorité
    });
  }

  // Fallback vers PNG pour les autres sources (signalair, mobileair, etc.)
  const markerPath = getMarkerPath(device.source, qualityLevel);

  // Calculer le z-index basé sur la priorité du device
  const zIndex = getMarkerZIndex(device);

  // Créer un élément HTML personnalisé pour le marqueur
  const div = document.createElement("div");
  div.className = `custom-marker-container ${device.source}`;
  div.style.zIndex = zIndex.toString();

  // Image de base du marqueur
  const img = document.createElement("img");
  img.src = markerPath;
  img.alt = `${device.source} marker`;

  if (deviceIsSelected) {
    // Utiliser la couleur correspondant au niveau de qualité
    const highlightColor = QUALITY_COLORS[qualityLevel] || "#3b82f6";

    div.style.cssText += `
      box-shadow: 0 0 0 3px ${highlightColor}, 0 0 0 6px ${highlightColor}40;
      border-radius: 50%;
      animation: pulse-${qualityLevel} 2s infinite;
    `;

    // Ajouter l'animation CSS spécifique à chaque niveau
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse-${qualityLevel} {
        0% { 
          box-shadow: 0 0 0 3px ${highlightColor}, 0 0 0 6px ${highlightColor}40; 
        }
        50% { 
          box-shadow: 0 0 0 3px ${highlightColor}, 0 0 0 12px ${highlightColor}20; 
        }
        100% { 
          box-shadow: 0 0 0 3px ${highlightColor}, 0 0 0 6px ${highlightColor}40; 
        }
      }
    `;
    if (!document.head.querySelector(`style[data-highlight-${qualityLevel}]`)) {
      style.setAttribute(`data-highlight-${qualityLevel}`, "true");
      document.head.appendChild(style);
    }
  }

  // Ajouter une animation subtile pendant le chargement
  if (loading) {
    div.style.opacity = "0.7";
    div.style.transform = "scale(0.95)";
    div.style.transition = "all 0.3s ease";
  }

  // Texte de la valeur pour les appareils de mesure
  const valueText = document.createElement("div");
  valueText.className = "value-text";

  // Fonction pour forcer les valeurs négatives à 0
  // Les concentrations de polluants ne peuvent pas être négatives
  const ensureNonNegativeValue = (value: number | undefined | null): number | undefined => {
    // Retourner undefined/null si la valeur n'est pas définie
    if (value === undefined || value === null) return undefined;
    // Vérifier que c'est un nombre valide et forcer les négatives à 0
    if (typeof value === "number" && !isNaN(value)) {
      return Math.max(0, value);
    }
    // Si ce n'est pas un nombre valide, retourner undefined
    return undefined;
  };

  // Gestion normale pour les appareils de mesure
  // Forcer les valeurs négatives à 0 avant l'affichage
  if (device.status === "active") {
    const correctedValue = ensureNonNegativeValue(device.value);
    if (correctedValue !== undefined) {
      const displayValue = Math.round(correctedValue);
      valueText.textContent = displayValue.toString();

      // Ajuster la taille du texte selon la longueur de la valeur
      if (displayValue >= 1000) {
        valueText.style.fontSize = "10px";
      } else if (displayValue >= 100) {
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
        tresMauvais: "#F2F2F2", // Noir au lieu de blanc pour les marqueurs rouges
        extrMauvais: "#F2F2F2",
        default: "#666666",
      };

      valueText.style.color = textColors[qualityLevel] || "#000000";

      // Ajouter un contour blanc pour améliorer la lisibilité
      if (qualityLevel == "extrMauvais" || qualityLevel == "tresMauvais") {
        // Contour plus subtil pour éviter l'effet de "paté"
        valueText.style.textShadow =
          "1px 1px 2px rgba(0, 0, 0, 0.8), -1px -1px 2px rgba(0, 0, 0, 0.8)";
      }
    }
  }

  // Ajouter un contour bleu pour les données corrigées (AtmoMicro)
  if (device.source === "atmoMicro" && device.has_correction) {
    // Contour bleu élégant avec effet de brillance
    // S'assurer que le box-shadow ne remplace pas celui de la sélection
    const existingBoxShadow = div.style.boxShadow;
    if (existingBoxShadow) {
      div.style.boxShadow = `${existingBoxShadow}, 0 0 0 4.5px rgb(70, 130, 200), 0 0 0 6px rgba(70, 130, 200, 0.6), 0 0 8px rgba(70, 130, 200, 0.4)`;
    } else {
      div.style.boxShadow = `
        0 0 0 4.5px rgb(70, 130, 200),
        0 0 0 6px rgba(70, 130, 200, 0.6),
        0 0 8px rgba(70, 130, 200, 0.4),
        0 2px 4px rgba(0, 0, 0, 0.3)
      `;
    }
    if (!div.style.borderRadius) {
      div.style.borderRadius = "50%";
    }
  }

  div.appendChild(img);
  div.appendChild(valueText);

  return L.divIcon({
    html: div.outerHTML,
    className: "custom-marker-div",
    iconSize: [32, 32],
    iconAnchor: [0, 32],
  });
};

/**
 * Crée un marqueur personnalisé pour les signalements SignalAir
 */
export const createSignalIcon = (
  report: SignalAirReport,
  loading: boolean = false
): L.DivIcon => {
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
    iconAnchor: [0, 32],
  });
};

/**
 * Crée un marqueur pour les signalements d'incendies
 */
export const createWildfireIcon = (
  report: WildfireReport,
  loading: boolean = false,
  reportsCount: number = 0
): L.DivIcon => {
  const container = document.createElement("div");
  container.className = "custom-marker-container wildfire-marker";

  if (loading && reportsCount === 0) {
    container.style.opacity = "0.85";
    container.style.transform = "scale(0.96)";
    container.style.transition = "all 0.3s ease";
  }

  const img = document.createElement("img");
  img.src = "/markers/wildfire/fire_pin.svg";
  img.alt = `Incendie ${report.title}`;
  img.style.width = "36px";
  img.style.height = "46px";
  img.style.objectFit = "contain";

  container.appendChild(img);

  return L.divIcon({
    html: container.outerHTML,
    className: "custom-marker-div wildfire-marker",
    iconSize: [36, 46],
    iconAnchor: [18, 46],
  });
};

/**
 * Formate la date d'un signalement d'incendie
 */
export const formatWildfireDate = (report: WildfireReport): string => {
  if (report.date) {
    return new Date(report.date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return report.dateText;
};

