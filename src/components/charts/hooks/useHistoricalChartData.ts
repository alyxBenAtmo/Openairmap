/**
 * Hook pour gérer les données transformées et la configuration du graphique historique
 */

import { useMemo } from "react";
import { HistoricalDataPoint, StationInfo } from "../../../types";
import { transformData, groupPollutantsByUnit } from "../utils/historicalChartDataTransformers";
import { getCommonThresholds, getXAxisDateFormat, generateSeriesConfigs, SeriesConfig } from "../utils/historicalChartConfig";
import { fallbackColors } from "../utils/historicalChartUtils";

interface UseHistoricalChartDataProps {
  data: Record<string, HistoricalDataPoint[]>;
  selectedPollutants: string[];
  source: string;
  stations: any[];
  isMobile: boolean;
  showRawData: boolean;
  useSolidNebuleAirLines: boolean;
}

export const useHistoricalChartData = ({
  data,
  selectedPollutants,
  source,
  stations,
  isMobile,
  showRawData,
  useSolidNebuleAirLines,
}: UseHistoricalChartDataProps) => {
  // Transformer les données pour amCharts
  const chartData = useMemo(() => {
    const transformed = transformData(data, selectedPollutants, source, stations, isMobile);
    console.log("[HistoricalChart] Données transformées:", {
      source,
      selectedPollutants,
      dataKeys: Object.keys(data),
      dataLengths: Object.keys(data).map(key => ({ key, length: data[key]?.length || 0 })),
      transformedLength: transformed.length,
      firstTransformedPoint: transformed[0],
      samplePoint: transformed.length > 0 ? transformed[0] : null,
    });
    return transformed;
  }, [data, selectedPollutants, source, stations, isMobile]);

  // Grouper les polluants par unité
  const unitGroups = useMemo(() => {
    const groups = groupPollutantsByUnit(data, selectedPollutants, source, stations);
    console.log("[HistoricalChart] Groupes d'unités:", groups);
    return groups;
  }, [selectedPollutants, data, source, stations]);

  const unitKeys = useMemo(() => Object.keys(unitGroups), [unitGroups]);

  // Déterminer le format optimal pour les labels de l'axe X
  const xAxisDateFormat = useMemo(() => {
    return getXAxisDateFormat(chartData, isMobile);
  }, [chartData, isMobile]);

  // Obtenir les seuils communs
  const commonThresholds = useMemo(() => {
    return getCommonThresholds(selectedPollutants, source, stations);
  }, [selectedPollutants, source, stations]);

  // Pré-calculer les données de correction par polluant
  const pollutantDataFlags = useMemo(() => {
    const flags: Record<string, { hasCorrected: boolean; hasRaw: boolean }> = {};
    selectedPollutants.forEach((pollutant) => {
      flags[pollutant] = {
        hasCorrected: chartData.some(
          (point) => point[`${pollutant}_corrected`] !== undefined
        ),
        hasRaw: chartData.some(
          (point) => point[`${pollutant}_raw`] !== undefined
        ),
      };
    });
    return flags;
  }, [selectedPollutants, chartData]);

  // Générer les configurations de séries
  const seriesConfigs = useMemo<SeriesConfig[]>(() => {
    console.log("[HistoricalChart] Génération des séries:", {
      source,
      selectedPollutants,
      unitKeys,
      unitGroups,
      pollutantDataFlags,
    });
    
    const configs = generateSeriesConfigs(
      source,
      stations,
      selectedPollutants,
      unitKeys,
      unitGroups,
      pollutantDataFlags,
      showRawData,
      useSolidNebuleAirLines,
      fallbackColors
    );

    console.log("[HistoricalChart] Configurations de séries générées:", configs);
    return configs;
  }, [source, stations, selectedPollutants, unitKeys, unitGroups, pollutantDataFlags, showRawData, useSolidNebuleAirLines]);

  // Détecter si des données corrigées sont disponibles (seulement pour AtmoMicro)
  const hasCorrectedData = useMemo(() => {
    return source === "atmoMicro" &&
      selectedPollutants.some((pollutant) => {
        return chartData.some(
          (point) => point[`${pollutant}_corrected`] !== undefined
        );
      });
  }, [source, selectedPollutants, chartData]);

  // Transformer les données pour amCharts (timestamp en nombre)
  const amChartsData = useMemo(() => {
    return chartData.map((point: any) => {
      let timestamp: number;
      
      if (point.timestampValue !== undefined) {
        timestamp = point.timestampValue;
      } else if (typeof point.rawTimestamp === 'number') {
        timestamp = point.rawTimestamp;
      } else {
        const rawTs = point.rawTimestamp;
        if (typeof rawTs === "string" && rawTs.includes("T")) {
          if (rawTs.match(/[+-]\d{2}:\d{2}$/)) {
            timestamp = new Date(rawTs).getTime();
          } else if (rawTs.includes("Z")) {
            timestamp = new Date(rawTs).getTime();
          } else {
            timestamp = new Date(rawTs + "Z").getTime();
          }
        } else {
          timestamp = new Date(rawTs).getTime();
        }
      }
      
      return {
        ...point,
        timestamp,
      };
    });
  }, [chartData]);

  return {
    chartData,
    amChartsData,
    unitGroups,
    unitKeys,
    xAxisDateFormat,
    commonThresholds,
    seriesConfigs,
    hasCorrectedData,
  };
};

