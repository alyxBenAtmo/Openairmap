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
 * @param level - Le niveau de qualité de l'air
 * @returns Le chemin vers l'icône du marqueur
 */
export function getMarkerPath(source: string, level: string): string {
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
