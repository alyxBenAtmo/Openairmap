import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { HistoricalDataPoint, StationInfo } from "../../types";
import { pollutants, POLLUTANT_COLORS } from "../../constants/pollutants";
import {
  exportChartAsPNG,
  exportDataAsCSV,
  generateExportFilename,
} from "../../utils/exportUtils";
import { featureFlags } from "../../config/featureFlags";

interface HistoricalChartProps {
  data: Record<string, HistoricalDataPoint[]>;
  selectedPollutants: string[];
  source: string; // Source de données (atmoRef, atmoMicro, comparison, etc.)
  onHasCorrectedDataChange?: (hasCorrectedData: boolean) => void;
  stations?: any[]; // Stations pour le mode comparaison
  showRawData?: boolean; // Contrôler l'affichage des données brutes
  stationInfo?: StationInfo | null; // Informations de la station pour les exports
  timeStep?: string; // Pas de temps sélectionné (pour les métadonnées d'export)
  sensorTimeStep?: number | null; // Pas de temps du capteur en secondes (pour le mode instantane)
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
  timeStep,
  sensorTimeStep,
}) => {
  // État pour détecter le mode paysage sur mobile
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(false);
  // État pour détecter si on est sur mobile
  const [isMobile, setIsMobile] = useState(false);

  // Références vers le graphique amCharts pour l'exportation
  const chartRef = useRef<am5xy.XYChart | null>(null);
  const rootRef = useRef<am5.Root | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerIdRef = useRef<string>(
    `historical-chart-${Math.random().toString(36).substr(2, 9)}`
  );

  const useSolidNebuleAirLines =
    featureFlags.solidLineNebuleAir &&
    (source?.toLowerCase() === "nebuleair");

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
            // Utiliser rawTimestamp comme clé principale pour le positionnement précis
            timestampValue: timestampMs,
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
      // Convertir le timestamp en millisecondes UTC de manière cohérente
      // Si c'est déjà un nombre, l'utiliser directement, sinon parser la string
      let dateMs: number;
      if (typeof timestamp === "number") {
        dateMs = timestamp;
      } else if (timestamp.includes("T")) {
        // Format ISO : peut contenir Z, +00:00, -05:00, etc.
        // Si le timestamp contient déjà un offset de fuseau horaire (+/-XX:XX), l'utiliser directement
        // Sinon, s'il contient Z, c'est UTC, sinon on traite comme UTC
        if (timestamp.match(/[+-]\d{2}:\d{2}$/)) {
          // Format avec offset de fuseau horaire (ex: +00:00, +01:00, -05:00)
          dateMs = new Date(timestamp).getTime();
        } else if (timestamp.includes("Z")) {
          // Format ISO UTC avec Z
          dateMs = new Date(timestamp).getTime();
        } else {
          // Format ISO sans Z ni offset : traiter comme UTC pour éviter les décalages
          dateMs = new Date(timestamp + "Z").getTime();
        }
      } else {
        // Format local : parser et utiliser getTime()
        dateMs = new Date(timestamp).getTime();
      }
      
      // Créer la date à partir du timestamp UTC pour le formatage
      const date = new Date(dateMs);
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
        // Utiliser le timestamp UTC en millisecondes pour le positionnement précis
        timestampValue: dateMs,
      };

      // Ajouter les valeurs pour chaque polluant (corrigées et brutes)
      selectedPollutants.forEach((pollutant, index) => {
        if (data[pollutant]) {
          // Normaliser les timestamps pour la comparaison (en millisecondes)
          const normalizeTimestamp = (ts: string | number): number => {
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
          
          const timestampMs = normalizeTimestamp(timestamp);
          
          const dataPoint = data[pollutant].find((p) => {
            const pTimestampMs = normalizeTimestamp(p.timestamp);
            // Comparer en millisecondes pour éviter les problèmes de format
            return Math.abs(pTimestampMs - timestampMs) < 1000; // Tolérance de 1 seconde
          });
          if (dataPoint) {
            // Valeur corrigée si disponible
            if (dataPoint.corrected_value !== undefined) {
              point[`${pollutant}_corrected`] = dataPoint.corrected_value;
            }

            // Valeur brute
            if (dataPoint.raw_value !== undefined) {
              point[`${pollutant}_raw`] = dataPoint.raw_value;
            }

            // Valeur principale : pour AtmoMicro avec données corrigées, utiliser _corrected
            // Sinon, utiliser la valeur principale selon la source
            if (source === "atmoMicro") {
              // Pour AtmoMicro, utiliser _raw comme valeur principale si pas de données corrigées
              if (dataPoint.corrected_value === undefined) {
                point[`${pollutant}_raw`] = dataPoint.value;
              }
              // Si corrected_value existe, il est déjà assigné ci-dessus
            } else {
              // Pour toutes les autres sources (AtmoRef, etc.), utiliser la clé principale
              // Toujours assigner la valeur principale, même si corrected_value existe
              point[pollutant] = dataPoint.value;
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
  const chartData = useMemo(() => {
    const transformed = transformData();
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
  const unitGroups = useMemo(() => {
    const groups = groupPollutantsByUnit();
    console.log("[HistoricalChart] Groupes d'unités:", groups);
    return groups;
  }, [selectedPollutants, data, source, stations]);
  const unitKeys = useMemo(() => Object.keys(unitGroups), [unitGroups]);
  

  // Déterminer le format optimal pour les labels de l'axe X selon la plage de dates
  const xAxisDateFormat = useMemo(() => {
    if (chartData.length === 0) {
      return { type: 'hour', format: (date: Date) => date.toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit" }) };
    }

    // Récupérer les dates min et max
    const dates = chartData
      .map((point: any) => {
        // Utiliser timestampValue en priorité, sinon rawTimestamp
        const timestamp = point.timestampValue !== undefined 
          ? point.timestampValue 
          : point.rawTimestamp;
        if (typeof timestamp === 'number') {
          return new Date(timestamp);
        }
        return new Date(timestamp);
      })
      .filter((date) => !isNaN(date.getTime()));

    if (dates.length === 0) {
      return { type: 'hour', format: (date: Date) => date.toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit" }) };
    }

    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Calculer la différence en millisecondes
    const diffMs = maxDate.getTime() - minDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const diffMonths = (maxDate.getFullYear() - minDate.getFullYear()) * 12 + (maxDate.getMonth() - minDate.getMonth());
    const diffYears = maxDate.getFullYear() - minDate.getFullYear();

    // Déterminer le format selon la plage
    if (diffYears > 0) {
      // Plusieurs années : afficher année et mois
      return {
        type: 'year-month',
        format: (date: Date) => {
          if (isMobile) {
            return `${date.getMonth() + 1}/${date.getFullYear()}`;
          }
          return date.toLocaleString("fr-FR", { month: "short", year: "numeric" });
        }
      };
    } else if (diffMonths > 3) {
      // Plusieurs mois (plus de 3) : afficher uniquement le mois
      return {
        type: 'month',
        format: (date: Date) => {
          if (isMobile) {
            return `${date.getMonth() + 1}/${date.getFullYear()}`;
          }
          return date.toLocaleString("fr-FR", { month: "short", year: "numeric" });
        }
      };
    } else if (diffMonths > 0) {
      // Quelques mois (1-3) : afficher mois et jour
      return {
        type: 'month-day',
        format: (date: Date) => {
          if (isMobile) {
            return `${date.getDate()}/${date.getMonth() + 1}`;
          }
          return date.toLocaleString("fr-FR", { month: "short", day: "2-digit" });
        }
      };
    } else if (diffDays > 1) {
      // Plusieurs jours : afficher seulement le jour
      return {
        type: 'day',
        format: (date: Date) => {
          if (isMobile) {
            return `${date.getDate()}/${date.getMonth() + 1}`;
          }
          return date.toLocaleString("fr-FR", { day: "2-digit", month: "short" });
        }
      };
    } else if (diffDays > 0) {
      // Un seul jour : afficher jour, mois et heure
      return {
        type: 'day-hour',
        format: (date: Date) => {
          if (isMobile) {
            return `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}h`;
          }
          return date.toLocaleString("fr-FR", { 
            day: "2-digit", 
            month: "short", 
            hour: "2-digit", 
            minute: "2-digit" 
          });
        }
      };
    } else {
      // Moins d'un jour : afficher heure et minute
      return {
        type: 'hour',
        format: (date: Date) => {
          if (isMobile) {
            return `${date.getHours()}h`;
          }
          return date.toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit" });
        }
      };
    }
  }, [chartData, isMobile]);


  // Détecter si des données corrigées sont disponibles (seulement pour AtmoMicro) - Mémorisé
  const hasCorrectedData = useMemo(() => {
    return source === "atmoMicro" &&
      selectedPollutants.some((pollutant) => {
        return chartData.some(
          (point) => point[`${pollutant}_corrected`] !== undefined
        );
      });
  }, [source, selectedPollutants, chartData]);


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

  // Générer les configurations de séries pour amCharts
  interface SeriesConfig {
    dataKey: string;
    name: string;
    color: string;
    strokeWidth: number;
    strokeDasharray: string;
    yAxisId: "left" | "right";
    connectNulls: boolean;
  }

  const seriesConfigs = useMemo<SeriesConfig[]>(() => {
    console.log("[HistoricalChart] Génération des séries:", {
      source,
      selectedPollutants,
      unitKeys,
      unitGroups,
      pollutantDataFlags,
    });
    if (source === "comparison" && stations.length > 0) {
      return stations.map((station, index) => {
        const pollutant = selectedPollutants[0];
        const stationColor = fallbackColors[index % fallbackColors.length];
        const pollutantName = pollutants[pollutant]?.name || pollutant;

        return {
          dataKey: station.id,
          name: `${station.name} - ${pollutantName}`,
          color: stationColor,
          strokeWidth: 2,
          strokeDasharray: "0", // Trait plein
          yAxisId: "left" as const,
          connectNulls: true,
        };
      });
    }

    // Mode normal : séries par unité
    const configs: SeriesConfig[] = [];
    unitKeys.forEach((unit, unitIndex) => {
      const pollutantsInUnit = unitGroups[unit];
      const yAxisId = unitIndex === 0 ? ("left" as const) : ("right" as const);

      pollutantsInUnit.forEach((pollutant, pollutantIndex) => {
        const pollutantColor = getPollutantColor(pollutant, pollutantIndex);
        const pollutantName = pollutants[pollutant]?.name || pollutant;
        const flags = pollutantDataFlags[pollutant] || { hasCorrected: false, hasRaw: false };
        const hasCorrectedData = flags.hasCorrected;
        const hasRawData = flags.hasRaw;

        const isAtmoRef = source === "atmoRef";
        const isAtmoMicro = source === "atmoMicro";

        if (isAtmoRef) {
          // AtmoRef : toujours trait plein
          configs.push({
            dataKey: pollutant,
            name: pollutantName,
            color: pollutantColor,
            strokeWidth: 2,
            strokeDasharray: "0",
            yAxisId,
            connectNulls: false,
          });
        } else if (isAtmoMicro) {
          // AtmoMicro : données corrigées (trait plein) et brutes (trait discontinu)
          if (hasCorrectedData) {
            configs.push({
              dataKey: `${pollutant}_corrected`,
              name: `${pollutantName} (corrigé)`,
              color: pollutantColor,
              strokeWidth: 2,
              strokeDasharray: "0",
              yAxisId,
              connectNulls: false,
            });
          }
          if (hasRawData && (showRawData || !hasCorrectedData)) {
            configs.push({
              dataKey: `${pollutant}_raw`,
              name: `${pollutantName} (brute)`,
              color: pollutantColor,
              strokeWidth: 2,
              strokeDasharray: "3 3",
              yAxisId,
              connectNulls: false,
            });
          }
        } else if (useSolidNebuleAirLines) {
          configs.push({
            dataKey: pollutant,
            name: pollutantName,
            color: pollutantColor,
            strokeWidth: 2,
            strokeDasharray: "0",
            yAxisId,
            connectNulls: false,
          });
        } else {
          // Autres sources : trait discontinu par défaut
          configs.push({
            dataKey: pollutant,
            name: pollutantName,
            color: pollutantColor,
            strokeWidth: 2,
            strokeDasharray: "3 3",
            yAxisId,
            connectNulls: false,
          });
        }
      });
    });

    console.log("[HistoricalChart] Configurations de séries générées:", configs);
    return configs;
  }, [source, stations, selectedPollutants, unitKeys, unitGroups, pollutantDataFlags, showRawData, useSolidNebuleAirLines]);

  // Notifier le composant parent si des données corrigées sont disponibles
  React.useEffect(() => {
    if (onHasCorrectedDataChange) {
      onHasCorrectedDataChange(hasCorrectedData);
    }
  }, [hasCorrectedData, onHasCorrectedDataChange]);

  // Transformer les données pour amCharts (timestamp en nombre)
  // S'assurer que les timestamps sont toujours en UTC (millisecondes) pour un alignement cohérent
  const amChartsData = useMemo(() => {
    return chartData.map((point: any) => {
      let timestamp: number;
      
      if (point.timestampValue !== undefined) {
        // Utiliser timestampValue si disponible (déjà en millisecondes UTC)
        timestamp = point.timestampValue;
      } else if (typeof point.rawTimestamp === 'number') {
        // Si c'est déjà un nombre, l'utiliser directement
        timestamp = point.rawTimestamp;
      } else {
        // Convertir la string en timestamp UTC de manière cohérente
        const rawTs = point.rawTimestamp;
        if (typeof rawTs === "string" && rawTs.includes("T")) {
          // Format ISO : peut contenir Z, +00:00, -05:00, etc.
          if (rawTs.match(/[+-]\d{2}:\d{2}$/)) {
            // Format avec offset de fuseau horaire (ex: +00:00, +01:00, -05:00)
            timestamp = new Date(rawTs).getTime();
          } else if (rawTs.includes("Z")) {
            // Format ISO UTC avec Z
            timestamp = new Date(rawTs).getTime();
          } else {
            // Format ISO sans Z ni offset : traiter comme UTC pour éviter les décalages
            timestamp = new Date(rawTs + "Z").getTime();
          }
        } else {
          // Format local : parser normalement
          timestamp = new Date(rawTs).getTime();
        }
      }
      
      return {
        ...point,
        timestamp, // Timestamp UTC en millisecondes pour amCharts
        // Ajouter stationInfo si disponible pour l'affichage dans le tooltip
        stationInfo: stationInfo || null,
      };
    });
  }, [chartData, stationInfo]);

  // Création et mise à jour du graphique amCharts
  useEffect(() => {
    // Vérifier que le conteneur existe
    if (!containerRef.current) {
      console.warn("[HistoricalChart] Conteneur DOM non disponible");
      return;
    }

    // Vérifier qu'il y a des données
    if (!chartData || chartData.length === 0) {
      console.warn("[HistoricalChart] Aucune donnée à afficher");
      return;
    }

    // Si le graphique existe déjà, ne pas le recréer
    if (rootRef.current && chartRef.current) {
      return;
    }

    // Créer le root amCharts
    const root = am5.Root.new(containerIdRef.current);
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

    // Ajouter un curseur pour activer le tooltip au survol
    const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
      behavior: "none",
    }));
    cursor.lineY.set("visible", false);
    cursor.lineX.set("visible", true);

    // Créer l'axe X (dates)
    const xAxis = chart.xAxes.push(
      am5xy.DateAxis.new(root, {
        baseInterval: { timeUnit: "second", count: 1 },
        renderer: am5xy.AxisRendererX.new(root, {
          minGridDistance: 50,
          cellStartLocation: 0, // Aligner au début de la cellule pour un meilleur alignement
          cellEndLocation: 1,
        }),
      })
    );

    // Configurer la grille verticale pour qu'elle soit alignée avec les points de données
    xAxis.get("renderer").grid.template.setAll({
      stroke: am5.color("#e0e0e0"),
      strokeDasharray: [3, 3],
      location: 0, // Aligner la grille au début des cellules (où sont les points)
      strokeOpacity: 0.5,
    });

    // Formatter personnalisé pour l'axe X
    xAxis.get("renderer").labels.template.adapters.add("text", (text, target) => {
      if (target.dataItem) {
        const value = (target.dataItem as any).get("value");
        if (value) {
          const date = typeof value === "number" ? new Date(value) : new Date(String(value));
          if (!isNaN(date.getTime())) {
            return xAxisDateFormat.format(date);
          }
        }
      }
      return text;
    });

    // Configurer la taille de police et la rotation selon le mode
    xAxis.get("renderer").labels.template.setAll({
      fontSize: isMobile ? 8 : isLandscapeMobile ? 10 : 12,
      fill: am5.color("#666"),
      rotation: isMobile ? 0 : -45, // Rotation de -45 degrés sur desktop, 0 sur mobile
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

    // La grille verticale est déjà configurée ci-dessus lors de la création de l'axe X
    yAxisMap.forEach((yAxis) => {
      yAxis.get("renderer").grid.template.setAll({
        stroke: am5.color("#e0e0e0"),
        strokeDasharray: [3, 3],
      });
    });

    // Créer les séries de données
    seriesConfigs.forEach((seriesConfig) => {
      const yAxis = yAxisMap.get(seriesConfig.yAxisId);
      if (!yAxis) {
        console.warn(`[HistoricalChart] Axe Y "${seriesConfig.yAxisId}" non trouvé pour la série "${seriesConfig.dataKey}"`);
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
          visible: true,
        })
      );

      // Configurer l'épaisseur et le style de ligne
      lineSeries.strokes.template.set("strokeWidth", seriesConfig.strokeWidth);
      if (seriesConfig.strokeDasharray !== "0") {
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

      // Ajouter des bullets avec tooltipText directement - méthode la plus simple
      lineSeries.bullets.push((root, series, dataItem) => {
        const data = dataItem.dataContext as any;
        const value = data?.[seriesConfig.dataKey];
        
        // Formater la date
        let dateStr = "";
        if (data?.timestamp) {
          const timestampValue = data.timestamp;
          const date = typeof timestampValue === "number" ? new Date(timestampValue) : new Date(timestampValue);
          if (!isNaN(date.getTime())) {
            dateStr = date.toLocaleString("fr-FR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });
          }
        }
        
        // Obtenir le nom du polluant
        const pollutantKey = seriesConfig.dataKey.replace(/_corrected$|_raw$/, "");
        const pollutantName = pollutants[pollutantKey]?.name || seriesConfig.name;
        
        // Obtenir l'unité
        let unit = data?.[`${pollutantKey}_unit`] || "";
        if (!unit && pollutants[pollutantKey]) {
          unit = pollutants[pollutantKey].unit;
        }
        const encodedUnit = encodeUnit(unit);
        
        // Construire le texte du tooltip
        let tooltipText = "";
        if (dateStr) {
          tooltipText += `${dateStr}\n`;
        }
        tooltipText += `${pollutantName}: ${typeof value === "number" ? value.toFixed(1) : value} ${encodedUnit}`;
        
        const circle = am5.Circle.new(root, {
          radius: 3,
          fill: am5.color(seriesConfig.color),
          fillOpacity: 0,
          strokeOpacity: 0,
          tooltipText: tooltipText,
        });
        
        return am5.Bullet.new(root, {
          sprite: circle,
        });
      });

      // Ajouter les données APRÈS avoir configuré les bullets et le tooltip
      lineSeries.data.setAll(amChartsData);
    });

    // Créer la légende personnalisée
    const legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.p50,
        x: am5.p50,
        marginTop: isMobile ? 2 : 8,
        marginBottom: 0,
        marginLeft: isMobile ? 0 : 8,
        marginRight: isMobile ? 0 : 8,
      })
    );

    // Personnaliser les items de la légende
    legend.labels.template.setAll({
      fontSize: isMobile ? 9 : 12,
    });

    legend.markers.template.setAll({
      width: isMobile ? 10 : 12,
      height: isMobile ? 10 : 12,
    });

    // Créer des marqueurs personnalisés avec styles (plein/discontinu)
    legend.markers.template.adapters.add("strokeDasharray" as any, (strokeDasharray: any, target: any) => {
      const dataItem = target.dataItem;
      if (dataItem) {
        const series = dataItem.dataContext as am5xy.LineSeries;
        if (series) {
          const seriesName = series.get("name");
          const seriesConfig = seriesConfigs.find((s) => s.name === seriesName);
          if (seriesConfig) {
            return seriesConfig.strokeDasharray !== "0" ? [3, 3] : undefined;
          }
        }
      }
      return strokeDasharray;
    });

    legend.data.setAll(chart.series.values);

    // Gérer le clic sur la légende pour masquer/afficher les séries
    legend.itemContainers.template.events.on("click", (ev) => {
      const dataItem = ev.target.dataItem;
      if (dataItem) {
        const series = dataItem.dataContext as am5xy.LineSeries;
        if (series) {
          if (series.isHidden()) {
            series.show();
      } else {
            series.hide();
          }
        }
      }
    });

  }, []); // Création initiale uniquement

  // Mise à jour des données sans recréer le graphique
  useEffect(() => {
    if (!chartRef.current || !rootRef.current || !amChartsData.length) return;

    const chart = chartRef.current;
    const xAxis = chart.xAxes.getIndex(0) as am5xy.DateAxis<am5xy.AxisRendererX>;
    if (!xAxis) return;

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

    // Restaurer le zoom
    if (zoomStart !== undefined && zoomEnd !== undefined) {
      xAxis.zoomToDates(new Date(zoomStart), new Date(zoomEnd));
    }
  }, [amChartsData]);

  // Mise à jour des séries (quand la configuration change)
  useEffect(() => {
    if (!chartRef.current || !rootRef.current || !seriesConfigs.length) return;

    const chart = chartRef.current;
    const xAxis = chart.xAxes.getIndex(0) as am5xy.DateAxis<am5xy.AxisRendererX>;
    const yAxisMap = new Map<string, am5xy.ValueAxis<am5xy.AxisRendererY>>();
    
    chart.yAxes.values.forEach((yAxis) => {
      const id = (yAxis as any).get("id");
      if (id) {
        yAxisMap.set(id, yAxis as am5xy.ValueAxis<am5xy.AxisRendererY>);
      }
    });

    // Supprimer toutes les séries existantes
    chart.series.clear();

    // Recréer les séries avec la nouvelle configuration
    seriesConfigs.forEach((seriesConfig) => {
      const yAxis = yAxisMap.get(seriesConfig.yAxisId);
      if (!yAxis) return;

      const lineSeries = chart.series.push(
        am5xy.LineSeries.new(rootRef.current!, {
          name: seriesConfig.name,
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: seriesConfig.dataKey,
          valueXField: "timestamp",
          stroke: am5.color(seriesConfig.color),
          visible: true,
        })
      );

      lineSeries.strokes.template.set("strokeWidth", seriesConfig.strokeWidth);
      if (seriesConfig.strokeDasharray !== "0") {
        const dashArray = seriesConfig.strokeDasharray
          .split(" ")
          .map((d) => parseFloat(d))
          .filter((d) => !isNaN(d));
        if (dashArray.length > 0) {
          lineSeries.strokes.template.set("strokeDasharray", dashArray);
        }
      }

      if (seriesConfig.connectNulls) {
        lineSeries.set("connect", true);
      }

      // Ajouter des bullets avec tooltipText directement - méthode la plus simple
      lineSeries.bullets.push((root, series, dataItem) => {
        const data = dataItem.dataContext as any;
        const value = data?.[seriesConfig.dataKey];
        
        // Formater la date
        let dateStr = "";
        if (data?.timestamp) {
          const timestampValue = data.timestamp;
          const date = typeof timestampValue === "number" ? new Date(timestampValue) : new Date(timestampValue);
          if (!isNaN(date.getTime())) {
            dateStr = date.toLocaleString("fr-FR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });
          }
        }
        
        // Obtenir le nom du polluant
        const pollutantKey = seriesConfig.dataKey.replace(/_corrected$|_raw$/, "");
        const pollutantName = pollutants[pollutantKey]?.name || seriesConfig.name;
        
        // Obtenir l'unité
        let unit = data?.[`${pollutantKey}_unit`] || "";
        if (!unit && pollutants[pollutantKey]) {
          unit = pollutants[pollutantKey].unit;
        }
        const encodedUnit = encodeUnit(unit);
        
        // Construire le texte du tooltip
        let tooltipText = "";
        if (dateStr) {
          tooltipText += `${dateStr}\n`;
        }
        tooltipText += `${pollutantName}: ${typeof value === "number" ? value.toFixed(1) : value} ${encodedUnit}`;
        
        const circle = am5.Circle.new(root, {
          radius: 3,
          fill: am5.color(seriesConfig.color),
          fillOpacity: 0,
          strokeOpacity: 0,
          tooltipText: tooltipText,
        });
        
        return am5.Bullet.new(root, {
          sprite: circle,
        });
      });

      // Ajouter les données APRÈS avoir configuré les bullets et le tooltip
      lineSeries.data.setAll(amChartsData);
    });

    // Mettre à jour la légende
    if (chart.children.getIndex(0) instanceof am5.Legend) {
      const legend = chart.children.getIndex(0) as am5.Legend;
      legend.data.setAll(chart.series.values);
    }
  }, [seriesConfigs, amChartsData, source, stations, selectedPollutants]);

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

  // Fonctions d'exportation - Mémorisées pour éviter les recréations inutiles
  const handleExportPNG = useCallback(async () => {
    if (!chartData.length || !chartRef.current || !rootRef.current) return;

    try {
      const filename = generateExportFilename(
        source,
        selectedPollutants,
        stations,
        stationInfo
      );
      
      // Utiliser l'API d'export d'amCharts
      const chart = chartRef.current;
      const exportSettings = {
        fileFormat: "png",
        quality: 1,
        maintainAspectRatio: true,
      };

      // amCharts 5 a une API d'export intégrée
      // Note: Pour l'instant, on utilise html2canvas comme fallback
      // TODO: Implémenter l'export natif amCharts si disponible
      await exportChartAsPNG(
        containerRef as any, // Utiliser le conteneur DOM pour html2canvas
        filename,
        stationInfo,
        selectedPollutants,
        source,
        stations,
        timeStep,
        sensorTimeStep
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
        stationInfo,
        timeStep,
        sensorTimeStep
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
        <div
          ref={containerRef}
          id={containerIdRef.current}
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    </div>
  );
};

export default HistoricalChart;
