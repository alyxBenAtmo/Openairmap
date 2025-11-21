/**
 * Hook personnalisé pour gérer les références aux graphiques amCharts
 * 
 * Utile pour accéder au chart et au root depuis les composants parents,
 * notamment pour les fonctions d'export.
 */

import { useRef, useCallback } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";

export interface AmChartsChartRef {
  chart: am5xy.XYChart | null;
  root: am5.Root | null;
}

/**
 * Hook pour gérer les références aux graphiques amCharts
 * 
 * @returns Un objet avec les références et une fonction pour les mettre à jour
 */
export const useAmChartsChart = () => {
  const chartRef = useRef<am5xy.XYChart | null>(null);
  const rootRef = useRef<am5.Root | null>(null);

  const setChartRef = useCallback((chart: am5xy.XYChart, root: am5.Root) => {
    chartRef.current = chart;
    rootRef.current = root;
  }, []);

  const getChartRef = useCallback((): AmChartsChartRef => {
    return {
      chart: chartRef.current,
      root: rootRef.current,
    };
  }, []);

  return {
    chartRef: chartRef.current,
    rootRef: rootRef.current,
    setChartRef,
    getChartRef,
  };
};


