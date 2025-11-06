import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { HistoricalDataPoint, StationInfo } from "../../types";
import { pollutants, POLLUTANT_COLORS } from "../../constants/pollutants";
import {
  exportChartAsPNG,
  exportDataAsCSV,
  generateExportFilename,
} from "../../utils/exportUtils";

interface HistoricalChartProps {
  data: Record<string, HistoricalDataPoint[]>;
  selectedPollutants: string[];
  source: string; // Source de données (atmoRef, atmoMicro, comparison, etc.)
  onHasCorrectedDataChange?: (hasCorrectedData: boolean) => void;
  stations?: any[]; // Stations pour le mode comparaison
  showRawData?: boolean; // Contrôler l'affichage des données brutes
  stationInfo?: StationInfo | null; // Informations de la station pour les exports
}

interface ExportMenuProps {
  hasData: boolean;
  onExportPNG: () => Promise<void> | void;
  onExportCSV: () => void;
}

const ExportMenu: React.FC<ExportMenuProps> = React.memo(
  ({ hasData, onExportPNG, onExportCSV }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);

    return (
      <div className="absolute top-2 right-2 z-10" ref={menuRef}>
        <button
          onClick={() => setIsOpen((open) => !open)}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-100 transition-colors border border-gray-200"
          title="Menu d'export"
        >
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <div
          className={`absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20 ${
            isOpen ? "block" : "hidden"
          }`}
        >
          <div className="px-3 py-2 text-xs font-semibold text-gray-700 border-b border-gray-200">
            Exporter le graphique
          </div>
          <button
            onClick={async () => {
              if (isExporting || !hasData) {
                return;
              }
              setIsExporting(true);
              try {
                await Promise.resolve(onExportPNG());
              } finally {
                setIsExporting(false);
                setIsOpen(false);
              }
            }}
            disabled={isExporting || !hasData}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isExporting ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Export en cours...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Exporter en PNG</span>
              </>
            )}
          </button>
          <button
            onClick={() => {
              onExportCSV();
              setIsOpen(false);
            }}
            disabled={!hasData}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Exporter en CSV</span>
          </button>
        </div>
      </div>
    );
  }
);

const HistoricalChart: React.FC<HistoricalChartProps> = ({
  data,
  selectedPollutants,
  source,
  onHasCorrectedDataChange,
  stations = [],
  showRawData = true,
  stationInfo = null,
}) => {
  // État pour détecter le mode paysage sur mobile
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(false);
  // État pour détecter si on est sur mobile
  const [isMobile, setIsMobile] = useState(false);

  // Référence vers le graphique pour l'exportation
  const chartRef = useRef<any>(null);

  // Créer une clé stable basée sur les IDs des stations pour éviter les recréations inutiles
  // Cette clé change uniquement si les IDs des stations changent, pas si c'est un nouvel array
  // Utiliser useRef pour comparer le contenu et maintenir une référence stable
  const prevStationsKeyRef = useRef<string>('');
  const stationsKey = useMemo(() => {
    if (stations.length === 0) {
      const emptyKey = '';
      if (prevStationsKeyRef.current !== emptyKey) {
        prevStationsKeyRef.current = emptyKey;
      }
      return prevStationsKeyRef.current;
    }
    // Créer une clé stable basée sur les IDs triés
    const newKey = stations.map(s => s.id).sort().join(',');
    // Ne mettre à jour que si la clé a vraiment changé (comparaison de contenu)
    if (newKey !== prevStationsKeyRef.current) {
      prevStationsKeyRef.current = newKey;
    }
    // Retourner la référence stable
    return prevStationsKeyRef.current;
  }, [stations]);

  // Mémoriser stationInfo basé sur son ID pour éviter les recréations inutiles
  const stationInfoKey = useMemo(() => {
    return stationInfo?.id || null;
  }, [stationInfo?.id]);

  // Effet pour détecter le mode paysage sur mobile
  useEffect(() => {
    const checkOrientation = () => {
      const mobile = window.innerWidth <= 768; // Mobile = largeur <= 768px
      const isLandscape = window.innerHeight < window.innerWidth;
      setIsMobile(mobile);
      setIsLandscapeMobile(mobile && isLandscape);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  // Log pour debug

  // Couleurs de fallback si un polluant n'est pas défini dans POLLUTANT_COLORS
  const fallbackColors = [
    "#3B82F6",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
  ];

  // Fonction pour obtenir la couleur d'un polluant
  const getPollutantColor = (pollutant: string, index: number): string => {
    return (
      POLLUTANT_COLORS[pollutant as keyof typeof POLLUTANT_COLORS] ||
      fallbackColors[index % fallbackColors.length]
    );
  };

  // Fonction pour obtenir l'ordre de priorité d'un polluant dans le tooltip
  const getPollutantOrder = (pollutantKey: string): number => {
    // Extraire le code du polluant (enlever les suffixes _corrected ou _raw)
    const basePollutantKey = pollutantKey.replace(
      /_corrected$|_raw$/,
      ""
    );
    
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

  // Fonction pour encoder les unités en notation scientifique
  const encodeUnit = (unit: string): string => {
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

  // Grouper les polluants par unité
  const groupPollutantsByUnit = () => {
    const unitGroups: Record<string, string[]> = {};

    // Mode comparaison : les données sont groupées par station ID
    if (source === "comparison" && stations.length > 0) {
      // En mode comparaison, on a un seul polluant et plusieurs stations
      // Toutes les stations mesurent le même polluant, donc une seule unité
      const pollutant = selectedPollutants[0];

      // Trouver la première station avec des données pour récupérer l'unité
      for (const station of stations) {
        if (data[station.id] && data[station.id].length > 0) {
          const unit = encodeUnit(data[station.id][0].unit);
          if (!unitGroups[unit]) {
            unitGroups[unit] = [];
          }
          // Ajouter le polluant (pas la station) dans le groupe d'unité
          if (!unitGroups[unit].includes(pollutant)) {
            unitGroups[unit].push(pollutant);
          }
          break; // On a trouvé l'unité, pas besoin de continuer
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

  // Transformer les données pour Recharts
  const transformData = () => {
    if (selectedPollutants.length === 0) return [];

    // Mode comparaison : données par station
    if (source === "comparison" && stations.length > 0) {
      const allTimestamps = new Map<number, string>(); // Map timestamp numérique -> string original
      const pollutant = selectedPollutants[0]; // Un seul polluant en mode comparaison

      // Récupérer tous les timestamps uniques de toutes les stations
      // Utiliser le timestamp numérique comme clé pour normaliser
      stations.forEach((station) => {
        if (data[station.id]) {
          data[station.id].forEach((point) => {
            const timestampMs = new Date(point.timestamp).getTime();
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
      const transformedData = sortedTimestamps.map(
        ([timestampMs, originalTimestamp]) => {
          const date = new Date(timestampMs);
          // Format plus court sur mobile uniquement
          const timestamp = isMobile
            ? `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}h`
            : date.toLocaleString("fr-FR", {
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });
          
          const point: any = {
            timestamp,
            rawTimestamp: timestampMs,
          };

          // Ajouter les valeurs pour chaque station
          stations.forEach((station) => {
            if (data[station.id]) {
              // Comparer les timestamps en millisecondes au lieu de strings
              const dataPoint = data[station.id].find(
                (p) => new Date(p.timestamp).getTime() === timestampMs
              );
              if (dataPoint) {
                // Utiliser l'ID de la station comme clé
                point[station.id] = dataPoint.value;

                // Stocker l'unité pour cette station
                let unit = dataPoint.unit;
                if (!unit && pollutants[pollutant]) {
                  unit = pollutants[pollutant].unit;
                }
                point[`${station.id}_unit`] = unit;
              }
            }
          });

          return point;
        }
      );

      return transformedData;
    }

    // Mode normal : données par polluant
    // Récupérer tous les timestamps uniques
    const allTimestamps = new Set<string>();
    selectedPollutants.forEach((pollutant) => {
      if (data[pollutant]) {
        data[pollutant].forEach((point) => {
          allTimestamps.add(point.timestamp);
        });
      }
    });

    // Trier les timestamps
    const sortedTimestamps = Array.from(allTimestamps).sort();

    // Créer les points de données
    const transformedData = sortedTimestamps.map((timestamp) => {
      const date = new Date(timestamp);
      // Format plus court sur mobile uniquement
      const timestampFormatted = isMobile
        ? `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}h`
        : date.toLocaleString("fr-FR", {
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });
      
      const point: any = {
        timestamp: timestampFormatted,
        rawTimestamp: timestamp,
      };

      // Ajouter les valeurs pour chaque polluant (corrigées et brutes)
      selectedPollutants.forEach((pollutant, index) => {
        if (data[pollutant]) {
          const dataPoint = data[pollutant].find(
            (p) => p.timestamp === timestamp
          );
          if (dataPoint) {
            // Valeur corrigée si disponible
            if (dataPoint.corrected_value !== undefined) {
              point[`${pollutant}_corrected`] = dataPoint.corrected_value;
            }

            // Valeur brute
            if (dataPoint.raw_value !== undefined) {
              point[`${pollutant}_raw`] = dataPoint.raw_value;
            }

            // Valeur brute comme valeur principale si pas de données corrigées
            if (dataPoint.corrected_value === undefined) {
              // Pour AtmoMicro, utiliser _raw, pour toutes les autres sources utiliser la clé principale
              if (source === "atmoMicro") {
                point[`${pollutant}_raw`] = dataPoint.value;
              } else {
                point[pollutant] = dataPoint.value;
              }
            }

            // Stocker l'unité pour ce polluant
            let unit = dataPoint.unit;

            // Si pas d'unité dans les données, utiliser celle des constantes
            if (!unit && pollutants[pollutant]) {
              unit = pollutants[pollutant].unit;
            }

            point[`${pollutant}_unit`] = unit;
          }
        }
      });

      return point;
    });

    return transformedData;
  };

  // Transformer les données pour Recharts - Mémorisé pour éviter les recalculs inutiles
  const chartData = useMemo(() => transformData(), [data, selectedPollutants, source, stations, isMobile]);
  const unitGroups = useMemo(() => groupPollutantsByUnit(), [selectedPollutants, data, source, stations]);
  const unitKeys = useMemo(() => Object.keys(unitGroups), [unitGroups]);
  
  // Calculer un intervalle optimal pour l'axe X selon le nombre de points
  // Pour éviter la surcharge de labels, on affiche environ 6-8 labels maximum
  const xAxisInterval = useMemo(() => {
    if (isMobile) {
      return "preserveStartEnd";
    }
    if (chartData.length === 0) return 0;
    // Calculer un intervalle pour afficher environ 6-8 labels
    const targetLabels = 7;
    const interval = Math.floor(chartData.length / targetLabels);
    return interval > 0 ? interval : 0;
  }, [isMobile, chartData.length]);

  // Détecter si des données corrigées sont disponibles (seulement pour AtmoMicro) - Mémorisé
  const hasCorrectedData = useMemo(() => {
    return source === "atmoMicro" &&
      selectedPollutants.some((pollutant) => {
        return chartData.some(
          (point) => point[`${pollutant}_corrected`] !== undefined
        );
      });
  }, [source, selectedPollutants, chartData]);

  // Mémoriser les objets activeDot pour éviter les recréations
  const activeDotNormal = useMemo(() => ({ r: 2.5, fillOpacity: 0.7 }), []);
  const activeDotSmall = useMemo(() => ({ r: 2, fillOpacity: 0.7 }), []);

  // Pré-calculer les données de correction par polluant pour éviter les recalculs dans le render
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

  // Mémoriser la génération des lignes du graphique pour éviter les retracements
  // Utiliser stationsKey au lieu de stations pour éviter les recréations dues aux changements de référence
  const chartLines = useMemo(() => {
    if (source === "comparison" && stations.length > 0) {
      return stations.map((station, index) => {
        const pollutant = selectedPollutants[0];
        // En mode comparaison, utiliser directement les couleurs de fallback pour différencier les stations
        const stationColor =
          fallbackColors[index % fallbackColors.length];
        const pollutantName =
          pollutants[pollutant]?.name || pollutant;

        return (
          <Line
            key={station.id}
            type="linear"
            dataKey={station.id}
            yAxisId="left"
            stroke={stationColor}
            strokeWidth={2}
            strokeDasharray="0" // Trait plein pour toutes les stations
            dot={false}
            activeDot={activeDotNormal}
            name={`${station.name} - ${pollutantName}`}
            connectNulls={true} // Relier les points malgré les gaps (résolutions différentes)
          />
        );
      });
    }
    
    // Mode normal : rendu des lignes par unité
    return unitKeys.map((unit, unitIndex) => {
      const pollutantsInUnit = unitGroups[unit];
      const yAxisId = unitIndex === 0 ? "left" : "right";

      return pollutantsInUnit.map((pollutant, pollutantIndex) => {
        const pollutantColor = getPollutantColor(
          pollutant,
          pollutantIndex
        );
        const pollutantName =
          pollutants[pollutant]?.name || pollutant;

        // Utiliser les flags pré-calculés au lieu de recalculer
        const flags = pollutantDataFlags[pollutant] || { hasCorrected: false, hasRaw: false };
        const hasCorrectedData = flags.hasCorrected;
        const hasRawData = flags.hasRaw;

        // Déterminer le style selon la source
        const isAtmoRef = source === "atmoRef";
        const isAtmoMicro = source === "atmoMicro";

        return (
          <React.Fragment key={pollutant}>
            {isAtmoRef ? (
              /* AtmoRef : toujours trait plein (données de référence fiables) */
              <Line
                type="linear"
                dataKey={pollutant}
                yAxisId={yAxisId}
                stroke={pollutantColor}
                strokeWidth={2}
                strokeDasharray="0" // Trait plein
                dot={false}
                activeDot={activeDotNormal}
                name={pollutantName}
              />
            ) : isAtmoMicro ? (
              /* AtmoMicro : données corrigées (trait plein) et brutes (trait discontinu) */
              <>
                {/* Ligne des données corrigées (trait plein) - priorité par défaut */}
                {hasCorrectedData && (
                  <Line
                    type="linear"
                    dataKey={`${pollutant}_corrected`}
                    yAxisId={yAxisId}
                    stroke={pollutantColor}
                    strokeWidth={2}
                    strokeDasharray="0" // Trait plein
                    dot={false}
                    activeDot={activeDotNormal}
                    name={pollutantName} // Nom simple par défaut
                    connectNulls={false}
                  />
                )}

                {/* Ligne des données brutes (trait discontinu) - affichée seulement si showRawData est true */}
                {hasRawData && showRawData && (
                  <Line
                    type="linear"
                    dataKey={`${pollutant}_raw`}
                    yAxisId={yAxisId}
                    stroke={pollutantColor}
                    strokeWidth={2}
                    strokeDasharray="5 5" // Trait discontinu
                    dot={false}
                    activeDot={activeDotSmall}
                    name={
                      hasCorrectedData
                        ? `${pollutantName} (brut)`
                        : pollutantName
                    }
                    connectNulls={false}
                  />
                )}
              </>
            ) : (
              /* Autres sources : trait discontinu par défaut */
              <Line
                type="linear"
                dataKey={pollutant}
                yAxisId={yAxisId}
                stroke={pollutantColor}
                strokeWidth={2}
                strokeDasharray="5 5" // Trait discontinu
                dot={false}
                activeDot={activeDotNormal}
                name={pollutantName}
              />
            )}
          </React.Fragment>
        );
      });
    });
    // Utiliser stationsKey au lieu de stations directement pour éviter les recréations dues aux changements de référence
    // stations est utilisé dans le code mais stationsKey dans les dépendances pour la stabilité
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, stationsKey, selectedPollutants, unitKeys, unitGroups, pollutantDataFlags, showRawData, activeDotNormal, activeDotSmall]);

  // Notifier le composant parent si des données corrigées sont disponibles
  React.useEffect(() => {
    if (onHasCorrectedDataChange) {
      onHasCorrectedDataChange(hasCorrectedData);
    }
  }, [hasCorrectedData, onHasCorrectedDataChange]);

  // Fonctions d'exportation - Mémorisées pour éviter les recréations inutiles
  const handleExportPNG = useCallback(async () => {
    if (!chartData.length) return;

    try {
      const filename = generateExportFilename(
        source,
        selectedPollutants,
        stations,
        stationInfo
      );
      await exportChartAsPNG(
        chartRef,
        filename,
        stationInfo,
        selectedPollutants,
        source,
        stations
      );
    } catch (error) {
      console.error("Erreur lors de l'export PNG:", error);
      alert("Erreur lors de l'exportation en PNG");
    }
    // Utiliser stationsKey et stationInfoKey au lieu des objets directement pour éviter les recréations
    // stations et stationInfo sont utilisés dans le code mais les clés dans les dépendances pour la stabilité
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData.length, source, selectedPollutants, stationsKey, stationInfoKey]);

  // Option SVG supprimée

  const handleExportCSV = useCallback(() => {
    if (!chartData.length) return;

    try {
      const filename = generateExportFilename(
        source,
        selectedPollutants,
        stations,
        stationInfo
      );
      exportDataAsCSV(
        chartData,
        filename,
        source,
        stations,
        selectedPollutants,
        stationInfo
      );
    } catch (error) {
      console.error("Erreur lors de l'export CSV:", error);
      alert("Erreur lors de l'exportation en CSV");
    }
    // Utiliser stationsKey et stationInfoKey au lieu des objets directement pour éviter les recréations
    // stations et stationInfo sont utilisés dans le code mais les clés dans les dépendances pour la stabilité
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData, source, selectedPollutants, stationsKey, stationInfoKey]);

  // Marges adaptées selon le mode - Mémorisé pour éviter les recalculs inutiles
  const chartMargins = useMemo(() => {
    if (isLandscapeMobile) {
      // Marges réduites pour le mode paysage sur mobile, mais espace pour le bouton burger
      return { top: 45, right: 5, left: 2, bottom: 5 };
    }
    if (isMobile) {
      // Marges optimisées pour mobile portrait : marges minimales pour maximiser l'espace du graphique
      return { top: 45, right: 5, left: 5, bottom: 15 };
    }
    // Marges normales pour les autres modes, avec espace pour le bouton burger en haut à droite
    return { top: 45, right: 30, left: 20, bottom: 5 };
  }, [isLandscapeMobile, isMobile]);

  // Afficher un message si aucune donnée n'est disponible
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Bouton burger et menu d'export en haut à droite */}
      <ExportMenu
        hasData={chartData.length > 0}
        onExportPNG={handleExportPNG}
        onExportCSV={handleExportCSV}
      />

      {/* Graphique */}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%" ref={chartRef}>
          <LineChart data={chartData} margin={chartMargins}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              angle={isMobile ? 0 : -45}
              textAnchor={isMobile ? "middle" : "end"}
              height={isMobile ? 20 : isLandscapeMobile ? 60 : 80}
              fontSize={isMobile ? 8 : isLandscapeMobile ? 10 : 12}
              interval={xAxisInterval}
              tick={{ fill: "#666" }}
              tickMargin={isMobile ? 2 : 5}
              
            />

            {/* Axe Y principal (première unité) */}
            {unitKeys.length > 0 && (
              <YAxis
                yAxisId="left"
                fontSize={isMobile ? 9 : isLandscapeMobile ? 10 : 12}
                width={isMobile ? 30 : 40}
                label={{
                  value: `Conc. (${unitKeys[0]})`,
                  angle: -90,
                  position: "insideLeft",
                  style: {
                    textAnchor: "middle",
                    fontSize: isMobile ? 8 : isLandscapeMobile ? 10 : 12,
                  },
                }}
                // Le label sera masqué par CSS personnalisé sur petits écrans en mode paysage
              />
            )}

            {/* Axe Y secondaire (si plusieurs unités) */}
            {unitKeys.length > 1 && (
              <YAxis
                yAxisId="right"
                orientation="right"
                fontSize={isMobile ? 9 : isLandscapeMobile ? 10 : 12}
                width={isMobile ? 30 : 40}
                label={{
                  value: `Conc. (${unitKeys[1]})`,
                  angle: 90,
                  position: "insideRight",
                  style: {
                    textAnchor: "middle",
                    fontSize: isMobile ? 8 : isLandscapeMobile ? 10 : 12,
                  },
                }}
                // Le label sera masqué par CSS personnalisé sur petits écrans en mode paysage
              />
            )}

            <Tooltip
              formatter={(value: any, name: string, props: any) => {
                // Mode comparaison : afficher le nom de la station
                if (source === "comparison" && stations.length > 0) {
                  const stationId = props.dataKey || name;
                  const station = stations.find((s) => s.id === stationId);
                  const stationName = station ? station.name : stationId;

                  // Récupérer l'unité stockée dans les données
                  let unit = props.payload[`${stationId}_unit`] || "";
                  const pollutant = selectedPollutants[0];
                  if (!unit && pollutants[pollutant]) {
                    unit = pollutants[pollutant].unit;
                  }

                  const encodedUnit = encodeUnit(unit);

                  // Formater la valeur avec l'unité
                  const formattedValue =
                    value !== null && value !== undefined
                      ? `${value} ${encodedUnit}`
                      : "N/A";

                  return [formattedValue, stationName];
                }

                // Mode normal : afficher le nom du polluant
                // Utiliser la clé originale du polluant (dataKey) au lieu du nom affiché
                const pollutantKey = props.dataKey || name;

                // Extraire le code du polluant (enlever les suffixes _corrected ou _raw)
                const basePollutantKey = pollutantKey.replace(
                  /_corrected$|_raw$/,
                  ""
                );

                // Récupérer l'unité stockée dans les données
                let unit = props.payload[`${basePollutantKey}_unit`] || "";

                // Si pas d'unité dans les données, utiliser celle des constantes
                if (!unit && pollutants[basePollutantKey]) {
                  unit = pollutants[basePollutantKey].unit;
                }

                const encodedUnit = encodeUnit(unit);

                // Formater la valeur avec l'unité
                const formattedValue =
                  value !== null && value !== undefined
                    ? `${value} ${encodedUnit}`
                    : "N/A";

                // Nom du polluant (utiliser le nom affiché)
                const pollutantName = name;

                return [formattedValue, pollutantName];
              }}
              itemSorter={(item: any) => {
                // Mode comparaison : pas de tri personnalisé nécessaire
                if (source === "comparison" && stations.length > 0) {
                  return 0;
                }
                
                // Mode normal : trier selon l'ordre de priorité des polluants
                const pollutantKey = item.dataKey || item.name || "";
                const order = getPollutantOrder(pollutantKey);
                
                // Calculer un ordre composite : polluant prioritaire + type de donnée
                // Les données corrigées doivent apparaître avant les brutes pour le même polluant
                let compositeOrder = order * 1000;
                
                if (pollutantKey.includes("_corrected")) {
                  compositeOrder -= 1; // Les données corrigées avant
                } else if (pollutantKey.includes("_raw")) {
                  compositeOrder += 1; // Les données brutes après
                }
                
                return compositeOrder;
              }}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "8px",
              }}
            />
            <Legend 
              wrapperStyle={{ 
                paddingTop: isMobile ? "2px" : "8px", 
                paddingBottom: "0",
                paddingLeft: isMobile ? "0" : "8px",
                paddingRight: isMobile ? "0" : "8px"
              }}
              iconSize={isMobile ? 10 : 12}
              fontSize={isMobile ? 9 : 12}
              iconType="line"
            />

            {/* Mode comparaison : une ligne par station */}
            {chartLines}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HistoricalChart;
