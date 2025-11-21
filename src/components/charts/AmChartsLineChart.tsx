/**
 * Composant wrapper pour amCharts 5 - Graphique en lignes
 * 
 * Ce composant encapsule amCharts 5 pour faciliter la migration depuis Recharts.
 * Il gère automatiquement le cycle de vie (initialisation et nettoyage).
 */

import React, { useEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

export interface AmChartsLineChartData {
  timestamp: number | string; // Timestamp en millisecondes ou string ISO
  [key: string]: number | string | undefined | any; // Autres valeurs (polluants, stations, etc.) - any pour permettre des objets complexes
}

export interface AmChartsLineSeries {
  dataKey: string; // Clé dans les données (ex: "pm10", "station_id")
  name: string; // Nom affiché dans la légende
  color: string; // Couleur de la ligne
  strokeWidth?: number; // Épaisseur de la ligne (défaut: 2)
  strokeDasharray?: string; // Style de ligne ("0" = plein, "3 3" = discontinu)
  yAxisId?: "left" | "right"; // Axe Y à utiliser (défaut: "left")
  connectNulls?: boolean; // Relier les points malgré les gaps (défaut: false)
  visible?: boolean; // Visibilité de la série (défaut: true)
}

export interface AmChartsAxisConfig {
  id: "left" | "right";
  label?: string; // Label de l'axe
  unit?: string; // Unité affichée
  min?: number; // Valeur minimale
  max?: number; // Valeur maximale
}

export interface AmChartsLineChartProps {
  /**
   * Données du graphique
   * Format: tableau d'objets avec timestamp et valeurs
   */
  data: AmChartsLineChartData[];

  /**
   * Séries de données à afficher
   */
  series: AmChartsLineSeries[];

  /**
   * Configuration des axes Y
   */
  yAxes?: AmChartsAxisConfig[];

  /**
   * ID du conteneur DOM (optionnel, généré automatiquement si non fourni)
   */
  containerId?: string;

  /**
   * Hauteur du graphique (défaut: "100%")
   */
  height?: string | number;

  /**
   * Largeur du graphique (défaut: "100%")
   */
  width?: string | number;

  /**
   * Afficher la grille (défaut: true)
   */
  showGrid?: boolean;

  /**
   * Afficher la légende (défaut: true)
   */
  showLegend?: boolean;

  /**
   * Callback appelé quand le graphique est prêt
   * Utile pour obtenir une référence au chart pour l'export
   */
  onChartReady?: (chart: am5xy.XYChart, root: am5.Root) => void;

  /**
   * Format personnalisé pour les labels de l'axe X
   */
  xAxisLabelFormatter?: (date: Date) => string;

  /**
   * Format personnalisé pour le tooltip
   */
  tooltipFormatter?: (value: number, name: string, data: AmChartsLineChartData) => string;

  /**
   * Marges du graphique
   */
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

/**
 * Composant wrapper amCharts 5 pour les graphiques en lignes
 */
const AmChartsLineChart: React.FC<AmChartsLineChartProps> = ({
  data,
  series,
  yAxes = [{ id: "left" }],
  containerId,
  height = "100%",
  width = "100%",
  showGrid = true,
  showLegend = true,
  onChartReady,
  xAxisLabelFormatter,
  tooltipFormatter,
  margins,
}) => {
  const chartRef = useRef<am5xy.XYChart | null>(null);
  const rootRef = useRef<am5.Root | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerIdRef = useRef<string>(
    containerId || `amcharts-container-${Math.random().toString(36).substr(2, 9)}`
  );

  // Création initiale du graphique (une seule fois)
  useEffect(() => {
    // Vérifier que le conteneur existe
    if (!containerRef.current) {
      console.warn("[AmChartsLineChart] Conteneur DOM non disponible");
      return;
    }

    // Vérifier qu'il y a des données
    if (!data || data.length === 0) {
      console.warn("[AmChartsLineChart] Aucune donnée à afficher");
      return;
    }

    // Si le graphique existe déjà, ne pas le recréer
    if (rootRef.current && chartRef.current) {
      return;
    }

    // Créer le root amCharts
    const root = am5.Root.new(containerIdRef.current);
    rootRef.current = root;

    // Appliquer le thème animé (optionnel, peut être désactivé pour de meilleures performances)
    root.setThemes([am5themes_Animated.new(root)]);

    // Créer le graphique XY
    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: false,
        wheelX: "panX",
        wheelY: "zoomX",
        pinchZoomX: true,
        layout: root.verticalLayout,
        paddingTop: margins?.top ?? 20,
        paddingRight: margins?.right ?? 20,
        paddingBottom: margins?.bottom ?? 20,
        paddingLeft: margins?.left ?? 20,
      })
    );
    chartRef.current = chart;

    // Créer l'axe X (dates)
    const xAxis = chart.xAxes.push(
      am5xy.DateAxis.new(root, {
        baseInterval: { timeUnit: "second", count: 1 }, // Résolution à la seconde pour mieux afficher les points proches
        renderer: am5xy.AxisRendererX.new(root, {
          minGridDistance: 50,
        }),
        // Formatage personnalisé si fourni
        dateFormats: xAxisLabelFormatter
          ? {}
          : {
              day: "dd/MM",
              hour: "HH:mm",
              minute: "HH:mm",
              second: "HH:mm:ss",
            },
      })
    );

    // Formatter personnalisé pour l'axe X si fourni
    if (xAxisLabelFormatter) {
      xAxis.get("renderer").labels.template.adapters.add("text", (text, target) => {
        if (target.dataItem) {
          const value = (target.dataItem as any).get("value");
          if (value) {
            const date = typeof value === "number" ? new Date(value) : new Date(String(value));
            if (!isNaN(date.getTime())) {
              return xAxisLabelFormatter(date);
            }
          }
        }
        return text;
      });
    }

    // Créer les axes Y
    const yAxisMap = new Map<string, am5xy.ValueAxis<am5xy.AxisRendererY>>();

    yAxes.forEach((axisConfig) => {
      const yAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, {
          id: axisConfig.id,
          renderer: am5xy.AxisRendererY.new(root, {
            opposite: axisConfig.id === "right",
          }),
          min: axisConfig.min,
          max: axisConfig.max,
        })
      );

      // Ajouter le label si fourni
      if (axisConfig.label) {
        yAxis.children.push(
          am5.Label.new(root, {
            rotation: -90,
            text: axisConfig.label + (axisConfig.unit ? ` (${axisConfig.unit})` : ""),
            y: am5.p50,
            centerX: am5.p50,
          })
        );
      }

      yAxisMap.set(axisConfig.id, yAxis as am5xy.ValueAxis<am5xy.AxisRendererY>);
    });

    // Créer la grille si demandée
    if (showGrid) {
      xAxis.get("renderer").grid.template.setAll({
        stroke: am5.color("#e0e0e0"),
        strokeDasharray: [3, 3],
      });
      yAxes.forEach((axisConfig) => {
        const yAxis = yAxisMap.get(axisConfig.id);
        if (yAxis) {
          yAxis.get("renderer").grid.template.setAll({
            stroke: am5.color("#e0e0e0"),
            strokeDasharray: [3, 3],
          });
        }
      });
    }

    // Créer les séries de données initiales
    if (data && data.length > 0 && series.length > 0) {
      series.forEach((seriesConfig) => {
        const yAxis = yAxisMap.get(seriesConfig.yAxisId || "left");
        if (!yAxis) {
          console.warn(
            `[AmChartsLineChart] Axe Y "${seriesConfig.yAxisId || "left"}" non trouvé pour la série "${seriesConfig.dataKey}"`
          );
          return;
        }

        const lineSeries = chart.series.push(
          am5xy.LineSeries.new(root, {
            name: seriesConfig.name,
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: seriesConfig.dataKey,
            valueXField: "timestamp",
            stroke: am5.color(seriesConfig.color),
            visible: seriesConfig.visible !== false,
          })
        );

        // Configurer l'épaisseur de la ligne
        lineSeries.strokes.template.set("strokeWidth", seriesConfig.strokeWidth || 2);

        // Configurer le style de ligne (plein/discontinu)
        if (seriesConfig.strokeDasharray) {
          const dashArray = seriesConfig.strokeDasharray
            .split(" ")
            .map((d) => parseFloat(d))
            .filter((d) => !isNaN(d));
          if (dashArray.length > 0) {
            lineSeries.strokes.template.set("strokeDasharray", dashArray);
          }
        }

        // Configurer connectNulls
        if (seriesConfig.connectNulls) {
          lineSeries.set("connect", true);
        }

        // Transformer les données pour amCharts (timestamp doit être un nombre)
        const transformedData = data.map((item) => {
          const timestamp =
            typeof item.timestamp === "string"
              ? new Date(item.timestamp).getTime()
              : item.timestamp;
          return {
            ...item,
            timestamp,
          };
        });

        // Ajouter les données initiales
        lineSeries.data.setAll(transformedData);

        // Configurer le tooltip
        const tooltip = am5.Tooltip.new(root, {});

        // Formatter le tooltip avec date/heure, polluant et valeur
        tooltip.label.adapters.add("text", (text, target) => {
          const dataItem = target.dataItem;
          if (!dataItem) {
            return text || "";
          }

          // Si un formatter personnalisé est fourni, l'utiliser
          if (tooltipFormatter) {
            const value = (dataItem as any).get("valueY") as number;
            const name = seriesConfig.name;
            const data = dataItem.dataContext as AmChartsLineChartData;
            return tooltipFormatter(value, name, data);
          }

          // Sinon, utiliser le formatter par défaut avec date/heure
          const data = dataItem.dataContext as AmChartsLineChartData;
          const value = (dataItem as any).get("valueY") as number;
          
          if (data && data.timestamp && typeof value === "number") {
            // Formater la date et l'heure
            const timestampValue = data.timestamp;
            const date = typeof timestampValue === "number" ? new Date(timestampValue) : new Date(String(timestampValue));
            
            if (!isNaN(date.getTime())) {
              const dateStr = date.toLocaleString("fr-FR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });

              const unit = seriesConfig.yAxisId && yAxes.find((a) => a.id === seriesConfig.yAxisId)?.unit 
                ? ` ${yAxes.find((a) => a.id === seriesConfig.yAxisId)!.unit}` 
                : "";

              return `📅 ${dateStr}<br/>🌬️ ${seriesConfig.name}<br/>📊 ${value.toFixed(1)}${unit}`;
            }
          }

          // Fallback si pas de timestamp
          const unit = seriesConfig.yAxisId && yAxes.find((a) => a.id === seriesConfig.yAxisId)?.unit 
            ? ` ${yAxes.find((a) => a.id === seriesConfig.yAxisId)!.unit}` 
            : "";
          return `${seriesConfig.name}: ${value.toFixed(1)}${unit}`;
        });

        lineSeries.set("tooltip", tooltip);
      });
    }

    // Créer la légende si demandée
    if (showLegend) {
      const legend = chart.children.push(
        am5.Legend.new(root, {
          centerX: am5.p50,
          x: am5.p50,
          marginTop: 10,
        })
      );
      legend.data.setAll(chart.series.values);
    }

    // Appeler le callback si fourni
    if (onChartReady) {
      onChartReady(chart, root);
    }
  }, []); // Création initiale uniquement - dépendances vides pour éviter les recréations

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (rootRef.current) {
        rootRef.current.dispose();
        rootRef.current = null;
        chartRef.current = null;
      }
    };
  }, []);

  // Mise à jour des données sans recréer le graphique (préserve le zoom)
  useEffect(() => {
    if (!chartRef.current || !rootRef.current || !data || data.length === 0) {
      return;
    }

    const chart = chartRef.current;
    const xAxis = chart.xAxes.getIndex(0) as am5xy.DateAxis<am5xy.AxisRendererX>;
    
    if (!xAxis) return;

    // Préserver l'état du zoom avant la mise à jour
    let zoomStart: number | undefined;
    let zoomEnd: number | undefined;
    
    try {
      const start = (xAxis as any).getPrivate("start");
      const end = (xAxis as any).getPrivate("end");
      if (start !== undefined && end !== undefined) {
        zoomStart = start as number;
        zoomEnd = end as number;
      }
    } catch (e) {
      // Si on ne peut pas récupérer le zoom, continuer sans le préserver
    }
    
    // Mettre à jour les données de chaque série
    chart.series.values.forEach((lineSeries, index) => {
      if (index < series.length) {
        // Transformer les données pour amCharts (timestamp doit être un nombre)
        const transformedData = data.map((item) => {
          const timestamp =
            typeof item.timestamp === "string"
              ? new Date(item.timestamp).getTime()
              : item.timestamp;
          return {
            ...item,
            timestamp,
          };
        });

        // Mettre à jour les données
        (lineSeries as am5xy.LineSeries).data.setAll(transformedData);
      }
    });

    // Restaurer l'état du zoom après la mise à jour (avec un petit délai pour laisser amCharts mettre à jour)
    if (zoomStart !== undefined && zoomEnd !== undefined) {
      setTimeout(() => {
        try {
          xAxis.zoomToDates(new Date(zoomStart!), new Date(zoomEnd!));
        } catch (e) {
          // Ignorer les erreurs de zoom
        }
      }, 10);
    }
  }, [data, series]); // Mise à jour uniquement quand les données changent

  return (
    <div
      ref={containerRef}
      id={containerIdRef.current}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    />
  );
};

export default AmChartsLineChart;

