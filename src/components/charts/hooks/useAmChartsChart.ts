/**
 * Hook pour gérer la création et la mise à jour du graphique amCharts
 */

import { useEffect, useRef, useState } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { QUALITY_COLORS } from "../../../constants/qualityColors";
import { SeriesConfig } from "../utils/historicalChartConfig";
import {
  createLineSeries,
  addThresholdZones,
  setupLegend,
} from "../utils/amChartsHelpers";
import { normalizeTimestamp } from "../utils/historicalChartDataTransformers";
import { NebuleAirContextComment } from "../../../types";

interface UseAmChartsChartProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  containerId: string;
  chartData: any[];
  amChartsData: any[];
  seriesConfigs: SeriesConfig[];
  unitKeys: string[];
  commonThresholds: any | null;
  xAxisDateFormat: { type: string; format: (date: Date) => string };
  chartMargins: { top: number; right: number; left: number; bottom: number };
  isMobile: boolean;
  isLandscapeMobile: boolean;
  stationInfo: any | null;
  timeStep?: string;
  contextComments?: NebuleAirContextComment[];
  onCommentClick?: (comment: NebuleAirContextComment, event: MouseEvent) => void;
  onChartDoubleClick?: () => void;
}

export const useAmChartsChart = ({
  containerRef,
  containerId,
  chartData,
  amChartsData,
  seriesConfigs,
  unitKeys,
  commonThresholds,
  xAxisDateFormat,
  chartMargins,
  isMobile,
  isLandscapeMobile,
  stationInfo,
  timeStep,
  contextComments = [],
  onCommentClick,
  onChartDoubleClick,
}: UseAmChartsChartProps) => {
  const chartRef = useRef<am5xy.XYChart | null>(null);
  const rootRef = useRef<am5.Root | null>(null);
  const xAxisDateFormatRef = useRef<{ format: (date: Date) => string } | null>(
    null
  );
  const onCommentClickRef = useRef(onCommentClick);
  const [seriesRecreated, setSeriesRecreated] = useState(0); // Compteur pour forcer la réapplication des bullets

  // Mettre à jour la ref du formatter quand xAxisDateFormat change
  useEffect(() => {
    xAxisDateFormatRef.current = xAxisDateFormat;
  }, [xAxisDateFormat]);

  // Mettre à jour la ref du callback de clic sur commentaire
  useEffect(() => {
    onCommentClickRef.current = onCommentClick;
  }, [onCommentClick]);

  // Création initiale du graphique
  useEffect(() => {
    if (!containerRef.current) {
      console.warn("[HistoricalChart] Conteneur DOM non disponible");
      return;
    }

    if (!chartData || chartData.length === 0) {
      console.warn("[HistoricalChart] Aucune donnée à afficher");
      return;
    }

    if (rootRef.current && chartRef.current) {
      return;
    }

    // Créer le root amCharts
    const root = am5.Root.new(containerId);
    rootRef.current = root;

    // Appliquer le thème animé
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
        paddingTop: chartMargins.top,
        paddingRight: chartMargins.right,
        paddingBottom: chartMargins.bottom,
        paddingLeft: chartMargins.left,
      })
    );
    chartRef.current = chart;

    // Créer l'axe X (dates)
    // IMPORTANT: baseInterval doit correspondre à la granularité des données
    // pour que les gaps fonctionnent correctement avec connect: false
    let baseInterval: {
      timeUnit: "minute" | "hour" | "day" | "second";
      count: number;
    };
    if (timeStep === "quartHeure") {
      baseInterval = { timeUnit: "minute", count: 15 };
    } else if (timeStep === "heure") {
      baseInterval = { timeUnit: "hour", count: 1 };
    } else if (timeStep === "jour") {
      baseInterval = { timeUnit: "day", count: 1 };
    } else {
      // Par défaut, utiliser la seconde pour les données non agrégées
      baseInterval = { timeUnit: "second", count: 1 };
    }

    const xAxis = chart.xAxes.push(
      am5xy.DateAxis.new(root, {
        baseInterval: baseInterval,
        renderer: am5xy.AxisRendererX.new(root, {
          minGridDistance: isMobile ? 70 : 50,
          cellStartLocation: 0,
          cellEndLocation: 1,
        }),
      })
    );

    // Configurer la grille verticale
    xAxis.get("renderer").grid.template.setAll({
      stroke: am5.color("#e0e0e0"),
      strokeDasharray: [3, 3],
      location: 0,
      strokeOpacity: 0.5,
    });

    // Formatter personnalisé pour l'axe X
    xAxis
      .get("renderer")
      .labels.template.adapters.add("text", (text, target) => {
        if (target.dataItem) {
          const value = (target.dataItem as any).get("value");
          if (value) {
            const date =
              typeof value === "number"
                ? new Date(value)
                : new Date(String(value));
            if (!isNaN(date.getTime()) && xAxisDateFormatRef.current) {
              return xAxisDateFormatRef.current.format(date);
            }
          }
        }
        return text;
      });

    // Configurer la taille de police et la rotation selon le mode
    xAxis.get("renderer").labels.template.setAll({
      fontSize: isMobile ? 7 : isLandscapeMobile ? 9 : 12,
      fill: am5.color("#666"),
      rotation: isMobile ? 0 : -45,
      centerY: am5.p50,
      centerX: am5.p50,
    });

    // Créer les axes Y
    const yAxisMap = new Map<string, am5xy.ValueAxis<am5xy.AxisRendererY>>();

    unitKeys.forEach((unit, unitIndex) => {
      const yAxisId = unitIndex === 0 ? "left" : "right";
      const yAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, {
          id: yAxisId,
          renderer: am5xy.AxisRendererY.new(root, {
            opposite: yAxisId === "right",
          }),
        })
      );

      // Ajouter le label
      yAxis.children.push(
        am5.Label.new(root, {
          rotation: -90,
          text: `Conc. (${unit})`,
          y: am5.p50,
          centerX: am5.p50,
          fontSize: isMobile ? 8 : isLandscapeMobile ? 10 : 12,
        })
      );

      // Configurer la taille de police
      yAxis.get("renderer").labels.template.setAll({
        fontSize: isMobile ? 9 : isLandscapeMobile ? 10 : 12,
      });

      yAxisMap.set(yAxisId, yAxis as am5xy.ValueAxis<am5xy.AxisRendererY>);
    });

    // Configurer la grille horizontale
    yAxisMap.forEach((yAxis) => {
      yAxis.get("renderer").grid.template.setAll({
        stroke: am5.color("#e0e0e0"),
        strokeDasharray: [3, 3],
      });
    });

    // Ajouter les zones colorées des seuils
    if (commonThresholds) {
      addThresholdZones(yAxisMap, commonThresholds);
    }

    // Créer les séries de données
    seriesConfigs.forEach((seriesConfig) => {
      const yAxis = yAxisMap.get(seriesConfig.yAxisId);
      if (!yAxis) {
        console.warn(
          `[HistoricalChart] Axe Y "${seriesConfig.yAxisId}" non trouvé pour la série "${seriesConfig.dataKey}"`
        );
        return;
      }

      createLineSeries(
        root,
        chart,
        xAxis as am5xy.DateAxis<am5xy.AxisRendererX>,
        yAxis,
        seriesConfig,
        amChartsData,
        timeStep
      );
    });

    // Créer le curseur
    const cursor = chart.set(
      "cursor",
      am5xy.XYCursor.new(root, {
        behavior: "zoomXY",
        xAxis: xAxis,
      })
    );

    if (chart.series.length > 0) {
      cursor.set("snapToSeries", chart.series.values);
    }
    cursor.lineY.set("visible", false);
    cursor.lineX.set("visible", true);

    // Ajouter un gestionnaire de double-clic sur le graphique
    if (onChartDoubleClick) {
      const handleDoubleClick = () => {
        onChartDoubleClick();
      };
      
      // Attacher l'événement au plotContainer
      chart.plotContainer.events.on("dblclick", handleDoubleClick);
      
      // Aussi attacher au conteneur du graphique au cas où
      chart.events.on("dblclick", handleDoubleClick);
    }

    // Créer la légende
    setupLegend(root, chart, seriesConfigs, isMobile);

    // Nettoyage au démontage
    return () => {
      if (rootRef.current) {
        rootRef.current.dispose();
        rootRef.current = null;
        chartRef.current = null;
      }
    };
  }, []); // Création initiale uniquement

  // Ref pour mémoriser les dernières données et éviter les mises à jour inutiles
  const lastAmChartsDataRef = useRef<string>("");
  const isUpdatingRef = useRef(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mise à jour des données sans recréer le graphique
  useEffect(() => {
    if (!chartRef.current || !rootRef.current || !amChartsData.length) return;

    // Créer une clé de comparaison basée sur le contenu
    const dataKey = JSON.stringify(amChartsData);

    // Si les données n'ont pas changé, ne pas mettre à jour
    if (lastAmChartsDataRef.current === dataKey) {
      return;
    }

    // Si une mise à jour est déjà en cours, annuler le timeout précédent et programmer une nouvelle mise à jour
    if (isUpdatingRef.current) {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      // Programmer une mise à jour après un court délai
      updateTimeoutRef.current = setTimeout(() => {
        // Réessayer la mise à jour
        const currentDataKey = JSON.stringify(amChartsData);
        if (lastAmChartsDataRef.current !== currentDataKey) {
          lastAmChartsDataRef.current = currentDataKey;
          isUpdatingRef.current = false;
          // Déclencher une mise à jour en modifiant une dépendance fictive
          // En fait, on va juste mettre à jour directement
          if (chartRef.current && rootRef.current) {
            const chart = chartRef.current;
            const xAxis = chart.xAxes.getIndex(
              0
            ) as am5xy.DateAxis<am5xy.AxisRendererX>;
            if (xAxis) {
              chart.series.values.forEach((lineSeries) => {
                (lineSeries as am5xy.LineSeries).data.setAll(amChartsData);
              });
            }
          }
        }
      }, 100);
      return;
    }

    // Annuler tout timeout précédent
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }

    isUpdatingRef.current = true;
    lastAmChartsDataRef.current = dataKey;

    const chart = chartRef.current;
    const xAxis = chart.xAxes.getIndex(
      0
    ) as am5xy.DateAxis<am5xy.AxisRendererX>;
    if (!xAxis) {
      isUpdatingRef.current = false;
      return;
    }

    // Préserver l'état du zoom
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
      // Ignorer si on ne peut pas récupérer le zoom
    }

    // Mettre à jour les données de chaque série
    chart.series.values.forEach((lineSeries) => {
      (lineSeries as am5xy.LineSeries).data.setAll(amChartsData);
    });

    // Restaurer le zoom avec un petit délai pour laisser amCharts mettre à jour
    if (zoomStart !== undefined && zoomEnd !== undefined) {
      setTimeout(() => {
        try {
          xAxis.zoomToDates(new Date(zoomStart!), new Date(zoomEnd!));
        } catch (e) {
          // Ignorer les erreurs de zoom
        }
        isUpdatingRef.current = false;
      }, 10);
    } else {
      isUpdatingRef.current = false;
    }

    // Nettoyage au démontage
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
    };
  }, [amChartsData]);

  // Ref pour mémoriser la dernière configuration des séries
  const lastSeriesConfigsRef = useRef<string>("");

  // Mise à jour des séries (quand la configuration change)
  useEffect(() => {
    if (!chartRef.current || !rootRef.current || !seriesConfigs.length) return;

    // Créer une clé de comparaison pour la configuration
    // IMPORTANT: Inclure timeStep car il affecte connectNulls qui change le comportement des séries
    const seriesConfigsKey = JSON.stringify({
      configs: seriesConfigs.map((s) => ({
        dataKey: s.dataKey,
        name: s.name,
        yAxisId: s.yAxisId,
        connectNulls: s.connectNulls,
        strokeDasharray: s.strokeDasharray,
      })),
      timeStep, // Inclure timeStep car il affecte connectNulls
    });

    // Si la configuration n'a pas changé, ne pas recréer les séries
    if (lastSeriesConfigsRef.current === seriesConfigsKey) {
      return;
    }

    lastSeriesConfigsRef.current = seriesConfigsKey;
    
    // Incrémenter le compteur pour forcer la réapplication des bullets de commentaires
    setSeriesRecreated(prev => prev + 1);

    const chart = chartRef.current;
    const xAxis = chart.xAxes.getIndex(
      0
    ) as am5xy.DateAxis<am5xy.AxisRendererX>;
    const yAxisMap = new Map<string, am5xy.ValueAxis<am5xy.AxisRendererY>>();

    chart.yAxes.values.forEach((yAxis) => {
      const id = (yAxis as any).get("id");
      if (id) {
        yAxisMap.set(id, yAxis as am5xy.ValueAxis<am5xy.AxisRendererY>);
      }
    });

    // Retirer la référence du curseur aux séries avant de les supprimer
    const cursor = chart.get("cursor") as am5xy.XYCursor;
    if (cursor) {
      cursor.set("snapToSeries", []);
    }

    // Supprimer toutes les séries existantes
    // IMPORTANT: Supprimer aussi les flags des bullets de commentaires avant de supprimer les séries
    chart.series.each((seriesItem) => {
      const lineSeries = seriesItem as am5xy.LineSeries;
      delete (lineSeries as any)._hasCommentBullets;
    });
    chart.series.clear();

    // Recréer les séries avec la nouvelle configuration
    // IMPORTANT: Passer timeStep pour que connect: false soit appliqué pour les pas de temps agrégés
    seriesConfigs.forEach((seriesConfig) => {
      const yAxis = yAxisMap.get(seriesConfig.yAxisId);
      if (!yAxis) return;

      createLineSeries(
        rootRef.current!,
        chart,
        xAxis as am5xy.DateAxis<am5xy.AxisRendererX>,
        yAxis,
        seriesConfig,
        amChartsData,
        timeStep
      );
    });

    // Remettre la référence du curseur aux nouvelles séries
    if (cursor) {
      cursor.set("snapToSeries", chart.series.values);
    }

    // Mettre à jour la légende
    chart.children.each((child) => {
      if (child instanceof am5.Legend) {
        const legend = child as am5.Legend;
        legend.data.setAll(chart.series.values);
      }
    });

    // Forcer une mise à jour du graphique après recréation des séries
    // Cela garantit que les données sont bien appliquées avec le bon connectNulls
    // Utiliser un petit délai pour s'assurer que les séries sont bien créées
    setTimeout(() => {
      if (chartRef.current && amChartsData && amChartsData.length > 0) {
        const chart = chartRef.current;
        // Mettre à jour les données de toutes les séries
        chart.series.values.forEach((lineSeries) => {
          (lineSeries as am5xy.LineSeries).data.setAll(amChartsData);
          // S'assurer que connect est bien configuré selon timeStep
          const isAggregatedTimeStep =
            timeStep && ["quartHeure", "heure", "jour"].includes(timeStep);
          const shouldConnect = !isAggregatedTimeStep;
          (lineSeries as any).set("connect", shouldConnect);
        });
        
        // Réappliquer les bullets de commentaires après la recréation des séries
        // On déclenche un événement personnalisé pour que l'effet des commentaires se réexécute
        if (contextComments && contextComments.length > 0) {
          // Forcer la réapplication des bullets en déclenchant un re-render
          // On va utiliser un timeout pour s'assurer que les données sont bien chargées
          setTimeout(() => {
            // Les bullets seront ajoutés par l'effet contextComments
          }, 100);
        }
      }
    }, 50);
  }, [seriesConfigs, amChartsData, timeStep, contextComments]);

  // Mise à jour des zones de seuils
  useEffect(() => {
    if (!chartRef.current || !rootRef.current) return;

    const chart = chartRef.current;
    const yAxisMap = new Map<string, am5xy.ValueAxis<am5xy.AxisRendererY>>();

    chart.yAxes.values.forEach((yAxis) => {
      const id = (yAxis as any).get("id");
      if (id) {
        yAxisMap.set(id, yAxis as am5xy.ValueAxis<am5xy.AxisRendererY>);
      }
    });

    // Supprimer toutes les zones existantes
    yAxisMap.forEach((yAxis) => {
      yAxis.axisRanges.clear();
    });

    // Ajouter les nouvelles zones si les seuils sont communs
    if (commonThresholds) {
      addThresholdZones(yAxisMap, commonThresholds);
    }
  }, [commonThresholds]);

  // Mise à jour du baseInterval de l'axe X quand timeStep change
  useEffect(() => {
    if (!chartRef.current || !rootRef.current || !timeStep) return;

    const chart = chartRef.current;
    const xAxis = chart.xAxes.getIndex(
      0
    ) as am5xy.DateAxis<am5xy.AxisRendererX>;

    if (!xAxis) return;

    // Déterminer le nouveau baseInterval selon le pas de temps
    let baseInterval: {
      timeUnit: "minute" | "hour" | "day" | "second";
      count: number;
    };
    if (timeStep === "quartHeure") {
      baseInterval = { timeUnit: "minute", count: 15 };
    } else if (timeStep === "heure") {
      baseInterval = { timeUnit: "hour", count: 1 };
    } else if (timeStep === "jour") {
      baseInterval = { timeUnit: "day", count: 1 };
    } else {
      // Par défaut, utiliser la seconde pour les données non agrégées
      baseInterval = { timeUnit: "second", count: 1 };
    }

    // Mettre à jour le baseInterval de l'axe X
    xAxis.set("baseInterval", baseInterval);

    // Ajuster minGridDistance selon le nombre de points attendus
    // Plus de points = distance minimale plus petite pour éviter la surcharge
    const renderer = xAxis.get("renderer") as am5xy.AxisRendererX;
    if (renderer) {
      // Pour 15min, on a 4x plus de points qu'en 1h, donc réduire minGridDistance
      if (timeStep === "quartHeure") {
        renderer.set("minGridDistance", isMobile ? 50 : 40);
      } else if (timeStep === "heure") {
        renderer.set("minGridDistance", isMobile ? 70 : 50);
      } else {
        renderer.set("minGridDistance", isMobile ? 70 : 50);
      }
    }

    // Forcer une mise à jour de l'axe pour appliquer les changements
    // En amCharts 5, la mise à jour se fait automatiquement quand on change les propriétés
    // Les changements de baseInterval et minGridDistance déclenchent automatiquement un redraw

  }, [timeStep, isMobile]);

  // Mise à jour des marges et des propriétés de l'axe X lors des changements d'orientation
  useEffect(() => {
    if (!chartRef.current || !rootRef.current) return;

    const chart = chartRef.current;
    const xAxis = chart.xAxes.getIndex(
      0
    ) as am5xy.DateAxis<am5xy.AxisRendererX>;

    if (!xAxis) return;

    // Mettre à jour les paddings du graphique
    chart.set("paddingTop", chartMargins.top);
    chart.set("paddingRight", chartMargins.right);
    chart.set("paddingBottom", chartMargins.bottom);
    chart.set("paddingLeft", chartMargins.left);

    // Mettre à jour le minGridDistance de l'axe X (sauf si déjà mis à jour par timeStep)
    const renderer = xAxis.get("renderer") as am5xy.AxisRendererX;
    if (renderer && !timeStep) {
      renderer.set("minGridDistance", isMobile ? 70 : 50);
    }

    // Mettre à jour la taille de police des labels de l'axe X
    xAxis.get("renderer").labels.template.setAll({
      fontSize: isMobile ? 7 : isLandscapeMobile ? 9 : 12,
    });
  }, [chartMargins, isMobile, isLandscapeMobile]);

  // Mise à jour des commentaires de contexte - uniquement des points sur la courbe
  useEffect(() => {
    if (!chartRef.current || !rootRef.current || !amChartsData || amChartsData.length === 0) {
      return;
    }

    const chart = chartRef.current;
    
    // Attendre que les séries soient créées
    if (chart.series.length === 0) {
      return;
    }

    // Fonction helper pour obtenir la couleur selon le type de commentaire
    // Utilise context_type en priorité, sinon analyse comments
    const getCommentColor = (comment: NebuleAirContextComment): string => {
      // Utiliser context_type si disponible
      if (comment.context_type) {
        const contextTypeLower = comment.context_type.toLowerCase();
        if (contextTypeLower === "fire" || contextTypeLower === "feu") {
          return "#ff6b6b";
        } else if (contextTypeLower === "traffic" || contextTypeLower === "trafic" || contextTypeLower === "routier") {
          return "#ffa500";
        } else if (contextTypeLower === "industrial" || contextTypeLower === "industriel") {
          return "#4ecdc4";
        } else if (contextTypeLower === "voisinage") {
          return "#95a5a6";
        }
      }
      
      // Fallback sur comments si context_type n'est pas disponible
      const commentLower = comment.comments?.toLowerCase() || "";
      if (commentLower.includes("fire") || commentLower.includes("feu")) {
        return "#ff6b6b";
      } else if (commentLower.includes("traffic") || commentLower.includes("routier")) {
        return "#ffa500";
      } else if (commentLower.includes("industrial") || commentLower.includes("industriel")) {
        return "#4ecdc4";
      } else if (commentLower.includes("voisinage")) {
        return "#95a5a6";
      }
      
      return "#95a5a6";
    };

    // Créer un Map des timestamps de commentaires pour une recherche rapide
    // Clé: timestamp en millisecondes, Valeur: { color, comment }
    const commentTimestamps = new Map<number, { color: string; comment: NebuleAirContextComment }>();
    
    if (contextComments && contextComments.length > 0) {
      contextComments.forEach((comment) => {
        try {
          // IMPORTANT: Normaliser le timestamp du commentaire en UTC (millisecondes)
          // 
          // NOUVEAU COMPORTEMENT DE L'API (après modifications du collègue):
          // L'API retourne maintenant les timestamps avec le suffixe "Z" pour indiquer explicitement UTC.
          // Format: "2024-01-15T13:00:00Z" (explicitement en UTC)
          // 
          // La fonction normalizeTimestamp() gère correctement ce format et convertit en millisecondes UTC.
          const timestampMs = normalizeTimestamp(comment.datetime_start);
          
          if (isNaN(timestampMs)) {
            console.warn("Timestamp invalide pour le commentaire:", comment.datetime_start);
            return;
          }

          const color = getCommentColor(comment);
          commentTimestamps.set(timestampMs, { color, comment });
        } catch (error) {
          console.warn("Erreur lors du traitement du commentaire:", error, comment);
        }
      });
    }

    // Retirer tous les anciens bullets de commentaires avant d'en ajouter de nouveaux
    // IMPORTANT: Supprimer les bullet factories existants pour éviter les doublons
    chart.series.each((seriesItem) => {
      const lineSeries = seriesItem as am5xy.LineSeries;
      // Supprimer le flag pour forcer la réapplication
      delete (lineSeries as any)._hasCommentBullets;
      // Supprimer les bullet factories de commentaires existants
      // On va supprimer tous les bullets et les recréer (les autres bullets seront recréés par createLineSeries)
      // Mais en fait, on ne peut pas supprimer un bullet factory spécifique, donc on va juste
      // s'assurer que le flag est supprimé pour forcer la réapplication
    });

    // Ajouter des bullets sur les séries pour les points correspondant aux commentaires
    if (commentTimestamps.size > 0) {
      chart.series.each((seriesItem) => {
        const lineSeries = seriesItem as am5xy.LineSeries;
        
        // Vérifier si on a déjà ajouté un bullet factory pour les commentaires
        const hasCommentBullets = (lineSeries as any)._hasCommentBullets;
        if (hasCommentBullets) {
          return; // Déjà ajouté
        }
        
        // Marquer que les bullets de commentaires ont été ajoutés
        (lineSeries as any)._hasCommentBullets = true;
        
        // Ajouter un bullet factory pour les commentaires
        lineSeries.bullets.push((root, series, dataItem) => {
          const data = dataItem.dataContext as any;
          if (!data || !data.timestamp) {
            return undefined;
          }

          // Vérifier si ce timestamp correspond à un commentaire
          // IMPORTANT: Normaliser le timestamp des données en UTC (millisecondes)
          // pour garantir une comparaison correcte avec les timestamps des commentaires
          // Les timestamps dans amChartsData sont normalement déjà des nombres (millisecondes UTC),
          // mais on utilise normalizeTimestamp() pour gérer tous les cas
          const dataTimestamp = normalizeTimestamp(data.timestamp);
          
          if (isNaN(dataTimestamp)) {
            return undefined;
          }
          
          const tolerance = 30 * 60 * 1000; // 30 minutes en millisecondes (augmenté pour plus de flexibilité)
          let matchingCommentData: { color: string; comment: NebuleAirContextComment } | null = null;
          let minDiff = Infinity;
          
          // Comparer les timestamps en UTC (millisecondes)
          // Les deux timestamps sont maintenant normalisés en UTC, donc la comparaison est correcte
          for (const [commentTimestamp, commentData] of commentTimestamps.entries()) {
            const diff = Math.abs(dataTimestamp - commentTimestamp);
            if (diff <= tolerance && diff < minDiff) {
              matchingCommentData = commentData;
              minDiff = diff;
            }
          }

          // Si ce point correspond à un commentaire, ajouter un bullet visible et cliquable
          if (matchingCommentData) {
            const circle = am5.Circle.new(root, {
              radius: 6,
              fill: am5.color(matchingCommentData.color),
              fillOpacity: 1,
              stroke: am5.color("#ffffff"),
              strokeWidth: 2,
              strokeOpacity: 1,
              cursorOverStyle: "pointer",
              tooltipText: "Cliquez pour voir le commentaire",
            });

            // Ajouter un événement de clic
            // IMPORTANT: Utiliser la ref pour éviter les problèmes de closure
            circle.events.on("click", (ev) => {
              if (onCommentClickRef.current && ev.originalEvent) {
                const mouseEvent = ev.originalEvent as MouseEvent;
                onCommentClickRef.current(matchingCommentData!.comment, mouseEvent);
              }
            });

            return am5.Bullet.new(root, {
              sprite: circle,
            });
          }

          return undefined;
        });
      });
    } else {
      // Si pas de commentaires, retirer le flag des séries
      chart.series.each((seriesItem) => {
        const lineSeries = seriesItem as am5xy.LineSeries;
        delete (lineSeries as any)._hasCommentBullets;
      });
    }
  }, [contextComments, isMobile, amChartsData, onCommentClick, seriesRecreated]);

  return {
    chartRef: chartRef as React.RefObject<am5xy.XYChart | null>,
    rootRef: rootRef as React.RefObject<am5.Root | null>,
  };
};
