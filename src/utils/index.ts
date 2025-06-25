import { Seuils } from "../types";

/**
 * Détermine le niveau de qualité de l'air selon la valeur et les seuils
 * @param value - La valeur mesurée
 * @param thresholds - Les seuils de qualité de l'air
 * @returns Le code du niveau (bon, moyen, degrade, mauvais, tresMauvais, extrMauvais)
 */
export function getAirQualityLevel(value: number, thresholds: Seuils): string {
  if (value <= thresholds.bon.max) return "bon";
  if (value <= thresholds.moyen.max) return "moyen";
  if (value <= thresholds.degrade.max) return "degrade";
  if (value <= thresholds.mauvais.max) return "mauvais";
  if (value <= thresholds.tresMauvais.max) return "tresMauvais";
  return "extrMauvais";
}

/**
 * Obtient le chemin du marqueur selon la source et le niveau de qualité
 * @param source - Le code de la source (atmoRef, atmoMicro, etc.)
 * @param level - Le niveau de qualité de l'air ou le type de signalement pour SignalAir
 * @returns Le chemin vers l'icône du marqueur
 */
export function getMarkerPath(source: string, level: string): string {
  // Gestion spéciale pour SignalAir
  if (source === "signalair") {
    const signalTypeMapping: Record<string, string> = {
      odeur: "odeur",
      bruit: "bruits", // Le fichier s'appelle "bruits.png"
      brulage: "brulage",
      visuel: "visuel",
      pollen: "pollen",
    };

    const signalType = signalTypeMapping[level] || "odeur";
    return `/markers/signalAirMarkers/${signalType}.png`;
  }

  // Gestion pour les autres sources
  const sourceMapping: Record<string, string> = {
    atmoRef: "atmoRefMarkers/refStationAtmoSud",
    atmoMicro: "atmoMicroMarkers/microStationAtmoSud",
    nebuleAir: "nebuleAirMarkers/nebuleAir",
    purpleAir: "purpleAirMarkers/purpleAir",
    sensorCommunity: "sensorCommunityMarkers/SensorCommunity",
  };

  const basePath = sourceMapping[source] || "atmoRefMarkers/refStationAtmoSud";
  return `/markers/${basePath}_${level}.png`;
}
