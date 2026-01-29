/**
 * Utilitaires pour le composant HistoricalChart
 */

import { POLLUTANT_COLORS } from "../../../constants/pollutants";

// Couleurs de fallback si un polluant n'est pas défini dans POLLUTANT_COLORS
// Au moins MAX_COMPARISON_STATIONS couleurs distinctes pour le mode comparaison
export const fallbackColors = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#6366F1",
];

/**
 * Fonction pour obtenir la couleur d'un polluant
 */
export const getPollutantColor = (pollutant: string, index: number): string => {
  return (
    POLLUTANT_COLORS[pollutant as keyof typeof POLLUTANT_COLORS] ||
    fallbackColors[index % fallbackColors.length]
  );
};

/**
 * Fonction pour obtenir l'ordre de priorité d'un polluant dans le tooltip
 */
export const getPollutantOrder = (pollutantKey: string): number => {
  // Extraire le code du polluant (enlever les suffixes _corrected ou _raw)
  const basePollutantKey = pollutantKey.replace(/_corrected$|_raw$/, "");
  
  // Ordre de priorité : PM10 en premier, puis PM2.5, puis PM1, puis les autres
  const orderMap: Record<string, number> = {
    pm10: 1,
    pm25: 2,
    pm1: 3,
  };
  
  // Si le polluant est dans la liste de priorité, retourner son ordre
  if (orderMap[basePollutantKey] !== undefined) {
    return orderMap[basePollutantKey];
  }
  
  // Pour les autres polluants, retourner un ordre élevé (ils apparaîtront après)
  return 100;
};

/**
 * Fonction pour encoder les unités en notation scientifique
 */
export const encodeUnit = (unit: string): string => {
  const unitMap: Record<string, string> = {
    "µg-m3": "µg/m³",
    "µg-m³": "μg/m³",
    "µg/m3": "µg/m³",
    "µg/m³": "µg/m³",
    "mg/m³": "mg/m³",
    ppm: "ppm",
    ppb: "ppb",
    "°C": "°C",
    "%": "%",
  };
  return unitMap[unit] || unit;
};

/**
 * Fonction pour forcer les valeurs négatives à 0
 * Les concentrations de polluants ne peuvent pas être négatives
 */
export const ensureNonNegativeValue = (value: number | undefined | null): number | undefined => {
  // Retourner undefined/null si la valeur n'est pas définie
  if (value === undefined || value === null) return undefined;
  // Vérifier que c'est un nombre valide et forcer les négatives à 0
  if (typeof value === "number" && !isNaN(value)) {
    return Math.max(0, value);
  }
  // Si ce n'est pas un nombre valide, retourner undefined
  return undefined;
};

/**
 * Fonction pour vérifier si deux seuils sont identiques
 */
export const areThresholdsEqual = (thresholds1: any, thresholds2: any): boolean => {
  if (!thresholds1 || !thresholds2) return false;
  const levels = ["bon", "moyen", "degrade", "mauvais", "tresMauvais", "extrMauvais"];
  return levels.every(level => {
    const t1 = thresholds1[level];
    const t2 = thresholds2[level];
    return t1 && t2 && t1.min === t2.min && t1.max === t2.max;
  });
};

/**
 * Fonction pour calculer la luminosité d'une couleur (0-255)
 */
export const getLuminance = (color: string): number => {
  // Convertir la couleur hex en RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Formule de luminosité relative (perçue par l'œil humain)
  return (r * 299 + g * 587 + b * 114) / 1000;
};

