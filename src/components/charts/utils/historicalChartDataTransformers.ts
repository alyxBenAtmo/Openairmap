/**
 * Transformateurs de données pour HistoricalChart
 */

import { HistoricalDataPoint } from "../../../types";
import { pollutants } from "../../../constants/pollutants";
import { encodeUnit, ensureNonNegativeValue } from "./historicalChartUtils";

/**
 * Normalise un timestamp en millisecondes UTC
 */
export const normalizeTimestamp = (ts: string | number): number => {
  if (typeof ts === "number") return ts;
  if (typeof ts === "string" && ts.includes("T")) {
    // Format ISO : peut contenir Z, +00:00, -05:00, etc.
    if (ts.match(/[+-]\d{2}:\d{2}$/)) {
      // Format avec offset de fuseau horaire
      return new Date(ts).getTime();
    } else if (ts.includes("Z")) {
      // Format ISO UTC avec Z
      return new Date(ts).getTime();
    } else {
      // Format ISO sans Z ni offset : traiter comme UTC
      return new Date(ts + "Z").getTime();
    }
  }
  return new Date(ts).getTime();
};

/**
 * Formate un timestamp pour l'affichage
 */
export const formatTimestamp = (timestamp: string | number, isMobile: boolean): string => {
  let dateMs: number;
  
  if (typeof timestamp === "number") {
    dateMs = timestamp;
  } else {
    dateMs = normalizeTimestamp(timestamp);
  }
  
  const date = new Date(dateMs);
  // Format plus court sur mobile uniquement
  return isMobile
    ? `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}h`
    : date.toLocaleString("fr-FR", {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
};

/**
 * Transforme les données pour le mode comparaison
 */
export const transformComparisonData = (
  data: Record<string, HistoricalDataPoint[]>,
  stations: any[],
  selectedPollutants: string[],
  isMobile: boolean
): any[] => {
  const allTimestamps = new Map<number, string>(); // Map timestamp numérique -> string original
  const pollutant = selectedPollutants[0]; // Un seul polluant en mode comparaison

  // Récupérer tous les timestamps uniques de toutes les stations
  stations.forEach((station) => {
    if (data[station.id]) {
      data[station.id].forEach((point) => {
        const timestampMs = normalizeTimestamp(point.timestamp);
        if (!allTimestamps.has(timestampMs)) {
          allTimestamps.set(timestampMs, point.timestamp);
        }
      });
    }
  });

  // Trier les timestamps numériques
  const sortedTimestamps = Array.from(allTimestamps.entries()).sort(
    (a, b) => a[0] - b[0]
  );

  // Créer les points de données
  return sortedTimestamps.map(([timestampMs, originalTimestamp]) => {
    const date = new Date(timestampMs);
    const timestamp = formatTimestamp(originalTimestamp, isMobile);
    
    const point: any = {
      timestamp,
      rawTimestamp: originalTimestamp,
      timestampValue: timestampMs,
    };

    // Ajouter les valeurs pour chaque station
    stations.forEach((station) => {
      if (data[station.id]) {
        const dataPoint = data[station.id].find(
          (p) => normalizeTimestamp(p.timestamp) === timestampMs
        );
        if (dataPoint) {
          point[station.id] = ensureNonNegativeValue(dataPoint.value);
          let unit = dataPoint.unit;
          if (!unit && pollutants[pollutant]) {
            unit = pollutants[pollutant].unit;
          }
          point[`${station.id}_unit`] = unit;
        }
      }
    });

    return point;
  });
};

/**
 * Transforme les données pour le mode normal
 */
export const transformNormalData = (
  data: Record<string, HistoricalDataPoint[]>,
  selectedPollutants: string[],
  source: string,
  isMobile: boolean
): any[] => {
  // Récupérer tous les timestamps uniques
  const allTimestamps = new Set<string>();
  selectedPollutants.forEach((pollutant) => {
    if (data[pollutant]) {
      data[pollutant].forEach((point) => {
        allTimestamps.add(point.timestamp);
      });
    }
  });

  // Trier les timestamps en les convertissant en dates pour un tri correct
  const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => {
    return normalizeTimestamp(a) - normalizeTimestamp(b);
  });

  // Créer les points de données
  return sortedTimestamps.map((timestamp) => {
    const dateMs = normalizeTimestamp(timestamp);
    const timestampFormatted = formatTimestamp(timestamp, isMobile);
    
    const point: any = {
      timestamp: timestampFormatted,
      rawTimestamp: timestamp,
      timestampValue: dateMs,
    };

    // Ajouter les valeurs pour chaque polluant (corrigées et brutes)
    selectedPollutants.forEach((pollutant) => {
      if (data[pollutant]) {
        const timestampMs = normalizeTimestamp(timestamp);
        
        const dataPoint = data[pollutant].find((p) => {
          const pTimestampMs = normalizeTimestamp(p.timestamp);
          // Comparer en millisecondes pour éviter les problèmes de format
          return Math.abs(pTimestampMs - timestampMs) < 1000; // Tolérance de 1 seconde
        });
        
        if (dataPoint) {
          // Valeur corrigée si disponible
          if (dataPoint.corrected_value !== undefined) {
            point[`${pollutant}_corrected`] = ensureNonNegativeValue(dataPoint.corrected_value);
          }

          // Valeur brute
          if (dataPoint.raw_value !== undefined) {
            point[`${pollutant}_raw`] = ensureNonNegativeValue(dataPoint.raw_value);
          }

          // Valeur principale : pour AtmoMicro avec données corrigées, utiliser _corrected
          if (source === "atmoMicro") {
            if (dataPoint.corrected_value === undefined) {
              point[`${pollutant}_raw`] = ensureNonNegativeValue(dataPoint.value);
            }
          } else {
            point[pollutant] = ensureNonNegativeValue(dataPoint.value);
          }

          // Stocker l'unité pour ce polluant
          let unit = dataPoint.unit;
          if (!unit && pollutants[pollutant]) {
            unit = pollutants[pollutant].unit;
          }
          point[`${pollutant}_unit`] = unit;
        }
      }
    });

    return point;
  });
};

/**
 * Transforme les données pour amCharts
 */
export const transformData = (
  data: Record<string, HistoricalDataPoint[]>,
  selectedPollutants: string[],
  source: string,
  stations: any[],
  isMobile: boolean
): any[] => {
  if (selectedPollutants.length === 0) return [];

  // Mode comparaison : données par station
  if (source === "comparison" && stations.length > 0) {
    return transformComparisonData(data, stations, selectedPollutants, isMobile);
  }

  // Mode normal : données par polluant
  return transformNormalData(data, selectedPollutants, source, isMobile);
};

/**
 * Groupe les polluants par unité
 */
export const groupPollutantsByUnit = (
  data: Record<string, HistoricalDataPoint[]>,
  selectedPollutants: string[],
  source: string,
  stations: any[]
): Record<string, string[]> => {
  const unitGroups: Record<string, string[]> = {};

  // Mode comparaison : les données sont groupées par station ID
  if (source === "comparison" && stations.length > 0) {
    const pollutant = selectedPollutants[0];
    for (const station of stations) {
      if (data[station.id] && data[station.id].length > 0) {
        const unit = encodeUnit(data[station.id][0].unit);
        if (!unitGroups[unit]) {
          unitGroups[unit] = [];
        }
        if (!unitGroups[unit].includes(pollutant)) {
          unitGroups[unit].push(pollutant);
        }
        break;
      }
    }
  } else {
    // Mode normal : les données sont groupées par polluant
    selectedPollutants.forEach((pollutant) => {
      if (data[pollutant] && data[pollutant].length > 0) {
        const unit = encodeUnit(data[pollutant][0].unit);
        if (!unitGroups[unit]) {
          unitGroups[unit] = [];
        }
        unitGroups[unit].push(pollutant);
      }
    });
  }

  return unitGroups;
};

