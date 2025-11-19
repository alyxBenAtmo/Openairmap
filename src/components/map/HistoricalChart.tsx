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

  // Référence vers le graphique pour l'exportation
  const chartRef = useRef<any>(null);

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
      
      const dateMs = new Date(timestamp).getTime();
      const point: any = {
        timestamp: timestampFormatted,
        rawTimestamp: timestamp,
        // Utiliser rawTimestamp comme clé principale pour le positionnement précis
        timestampValue: dateMs,
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

  // Générer des ticks personnalisés pour un meilleur positionnement
  const xAxisTicks = useMemo(() => {
    if (chartData.length === 0) return undefined;

    const dates = chartData
      .map((point: any) => {
        const timestamp = point.timestampValue !== undefined 
          ? point.timestampValue 
          : point.rawTimestamp;
        if (typeof timestamp === 'number') {
          return new Date(timestamp);
        }
        return new Date(timestamp);
      })
      .filter((date) => !isNaN(date.getTime()));

    if (dates.length === 0) return undefined;

    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    const diffMs = maxDate.getTime() - minDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const diffMonths = (maxDate.getFullYear() - minDate.getFullYear()) * 12 + (maxDate.getMonth() - minDate.getMonth());
    const diffYears = maxDate.getFullYear() - minDate.getFullYear();

    const ticks: number[] = [];
    const maxTicks = isMobile ? 6 : 10; // Limiter le nombre de ticks

    if (diffYears > 0) {
      // Plusieurs années : ticks au début de chaque mois
      const current = new Date(minDate);
      current.setDate(1); // Premier du mois
      current.setHours(0, 0, 0, 0);
      while (current <= maxDate && ticks.length < maxTicks * 3) {
        ticks.push(current.getTime());
        current.setMonth(current.getMonth() + 1);
      }
    } else if (diffMonths > 3) {
      // Plusieurs mois (plus de 3) : ticks au début de chaque mois
      const current = new Date(minDate);
      current.setDate(1); // Premier du mois
      current.setHours(0, 0, 0, 0);
      while (current <= maxDate && ticks.length < maxTicks * 3) {
        ticks.push(current.getTime());
        current.setMonth(current.getMonth() + 1);
      }
    } else if (diffMonths > 0) {
      // Quelques mois (1-3) : ticks au début de chaque jour
      const current = new Date(minDate);
      current.setHours(0, 0, 0, 0);
      while (current <= maxDate && ticks.length < maxTicks * 3) {
        ticks.push(current.getTime());
        current.setDate(current.getDate() + 1);
      }
    } else if (diffDays > 1) {
      // Plusieurs jours : ticks à minuit de chaque jour
      // Le label affiche le jour, et les données du jour sont positionnées après le label
      const current = new Date(minDate);
      current.setHours(0, 0, 0, 0);
      // Inclure le premier jour
      ticks.push(current.getTime());
      current.setDate(current.getDate() + 1);
      while (current <= maxDate && ticks.length < maxTicks * 3) {
        ticks.push(current.getTime());
        current.setDate(current.getDate() + 1);
      }
    } else if (diffDays > 0) {
      // Un seul jour : ticks toutes les heures
      const current = new Date(minDate);
      current.setMinutes(0, 0, 0);
      while (current <= maxDate && ticks.length < maxTicks * 2) {
        ticks.push(current.getTime());
        current.setHours(current.getHours() + 1);
      }
    } else {
      // Moins d'un jour : ticks toutes les heures ou toutes les 30 minutes selon la durée
      const current = new Date(minDate);
      if (diffMs > 6 * 60 * 60 * 1000) {
        // Plus de 6 heures : ticks toutes les heures
        current.setMinutes(0, 0, 0);
        while (current <= maxDate && ticks.length < maxTicks * 2) {
          ticks.push(current.getTime());
          current.setHours(current.getHours() + 1);
        }
      } else {
        // Moins de 6 heures : ticks toutes les 30 minutes
        current.setMinutes(Math.floor(current.getMinutes() / 30) * 30, 0, 0);
        while (current <= maxDate && ticks.length < maxTicks * 2) {
          ticks.push(current.getTime());
          current.setMinutes(current.getMinutes() + 30);
        }
      }
    }

    // Si trop de ticks, les échantillonner uniformément
    if (ticks.length > maxTicks) {
      // Pour les pas de temps fins, utiliser les ticks originaux et les échantillonner
      // Pour les grandes plages, calculer directement les positions optimales
      const timeSpan = maxDate.getTime() - minDate.getTime();
      const numTicks = Math.min(maxTicks, ticks.length);
      const sampledTicks: number[] = [];
      
      // Pour les grandes plages (années, mois), calculer directement les positions
      if (diffYears > 0 || diffMonths > 3) {
        // Distribuer uniformément dans le temps et arrondir au début du mois
        for (let i = 0; i < numTicks; i++) {
          const ratio = numTicks > 1 ? i / (numTicks - 1) : 0;
          const tickTime = minDate.getTime() + ratio * timeSpan;
          const tickDate = new Date(tickTime);
          tickDate.setDate(1);
          tickDate.setHours(0, 0, 0, 0);
          sampledTicks.push(tickDate.getTime());
        }
      } else if (diffMonths > 0 || diffDays > 1) {
        // Distribuer uniformément dans le temps et arrondir au début du jour
        for (let i = 0; i < numTicks; i++) {
          const ratio = numTicks > 1 ? i / (numTicks - 1) : 0;
          const tickTime = minDate.getTime() + ratio * timeSpan;
          const tickDate = new Date(tickTime);
          tickDate.setHours(0, 0, 0, 0);
          sampledTicks.push(tickDate.getTime());
        }
      } else {
        // Pour les pas de temps fins, échantillonner les ticks originaux uniformément
        // Cela préserve la granularité fine sans arrondir trop agressivement
        const step = (ticks.length - 1) / (numTicks - 1);
        for (let i = 0; i < numTicks; i++) {
          const index = Math.round(i * step);
          if (index < ticks.length) {
            sampledTicks.push(ticks[index]);
          }
        }
      }
      
      // Dédupliquer et trier
      const uniqueTicks = Array.from(new Set(sampledTicks)).sort((a, b) => a - b);
      
      // S'assurer qu'on a au moins le premier et le dernier
      if (uniqueTicks.length > 0) {
        // Utiliser les timestamps réels des données, pas les ticks arrondis
        const firstDataTime = minDate.getTime();
        const lastDataTime = maxDate.getTime();
        
        if (uniqueTicks[0] !== firstDataTime && uniqueTicks[0] > firstDataTime) {
          uniqueTicks.unshift(firstDataTime);
        }
        if (uniqueTicks[uniqueTicks.length - 1] !== lastDataTime && uniqueTicks[uniqueTicks.length - 1] < lastDataTime) {
          uniqueTicks.push(lastDataTime);
        }
      }
      
      return uniqueTicks.length > 0 ? uniqueTicks : undefined;
    }

    return ticks.length > 0 ? ticks : undefined;
  }, [chartData, isMobile]);

  // Créer une Map pour un accès rapide timestampValue -> rawTimestamp
  const timestampMap = useMemo(() => {
    const map = new Map<number, number | string>();
    chartData.forEach((point: any) => {
      if (point.timestampValue !== undefined && point.rawTimestamp) {
        map.set(point.timestampValue, point.rawTimestamp);
      }
    });
    return map;
  }, [chartData]);

  // Fonction pour formater les labels de l'axe X
  const formatXAxisLabel = useCallback((tickItem: number | string) => {
    if (tickItem === undefined || tickItem === null) return '';
    
    let date: Date;
    
    // Si tickItem est un nombre (timestampValue), utiliser directement
    if (typeof tickItem === 'number') {
      const rawTimestamp = timestampMap.get(tickItem);
      if (rawTimestamp !== undefined) {
        date = typeof rawTimestamp === 'number' 
          ? new Date(rawTimestamp) 
          : new Date(rawTimestamp);
      } else {
        // Si pas trouvé dans la map, utiliser directement le nombre comme timestamp
        date = new Date(tickItem);
      }
    } else {
      // Fallback : essayer de parser depuis le label formaté
      date = new Date(tickItem);
    }
    
    if (isNaN(date.getTime())) {
      // Si le parsing échoue, retourner le label original
      return String(tickItem);
    }
    
    return xAxisDateFormat.format(date);
  }, [timestampMap, xAxisDateFormat]);

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
                    name={`${pollutantName} (corrigé)`} // Nom simple par défaut
                    connectNulls={false}
                  />
                )}

                {/* Ligne des données brutes (trait discontinu) - affichée seulement si showRawData est true */}
                {hasRawData && (showRawData || !hasCorrectedData) && (
                  <Line
                    type="linear"
                    dataKey={`${pollutant}_raw`}
                    yAxisId={yAxisId}
                    stroke={pollutantColor}
                    strokeWidth={2}
                    strokeDasharray="3 3" // Trait discontinu
                    dot={false}
                    activeDot={activeDotSmall}
                    name={`${pollutantName} (brute)`}
                    connectNulls={false}
                  />
                )}
              </>
            ) : useSolidNebuleAirLines ? (
              <Line
                type="linear"
                dataKey={pollutant}
                yAxisId={yAxisId}
                stroke={pollutantColor}
                strokeWidth={2}
                strokeDasharray="0" // Trait plein forcé
                dot={false}
                activeDot={activeDotNormal}
                name={pollutantName}
              />
            ) : (
              /* Autres sources : trait discontinu par défaut */
              <Line
                type="linear"
                dataKey={pollutant}
                yAxisId={yAxisId}
                stroke={pollutantColor}
                strokeWidth={2}
                strokeDasharray="3 3" // Trait discontinu
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
  }, [source, stationsKey, selectedPollutants, unitKeys, unitGroups, pollutantDataFlags, showRawData, activeDotNormal, activeDotSmall, useSolidNebuleAirLines]);

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

  // Fonction helper pour déterminer le strokeDasharray dans la légende
  const getStrokeDasharrayForLegend = (dataKey: string): string => {
    // Mode comparaison : toutes les lignes sont pleines
    if (source === "comparison") {
      return "0";
    }
    
    // Lignes avec _raw : trait discontinu
    if (dataKey.endsWith("_raw")) {
      return "3 3";
    }
    
    // Lignes avec _corrected ou sans suffixe : dépend de la source
    if (dataKey.endsWith("_corrected") || !dataKey.includes("_")) {
      if (source === "atmoRef") {
        return "0"; // AtmoRef : toujours trait plein
      }
      if (source === "atmoMicro" && dataKey.endsWith("_corrected")) {
        return "0"; // AtmoMicro corrigé : trait plein
      }
      if (useSolidNebuleAirLines) {
        return "0"; // NebuleAir avec flag : trait plein
      }
    }
    
    // Par défaut : trait discontinu
    return "3 3";
  };

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
              dataKey="timestampValue"
              type="number"
              angle={isMobile ? 0 : -45}
              textAnchor={isMobile ? "middle" : "end"}
              height={isMobile ? 20 : isLandscapeMobile ? 60 : 80}
              fontSize={isMobile ? 8 : isLandscapeMobile ? 10 : 12}
              tick={{ fill: "#666" }}
              tickMargin={isMobile ? 2 : 5}
              tickFormatter={formatXAxisLabel}
              domain={['dataMin', 'dataMax']}
              ticks={xAxisTicks}
              allowDecimals={false}
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
              labelFormatter={(label) => {
                // Si label est un nombre (timestampValue), le formater comme date
                if (typeof label === 'number') {
                  const date = new Date(label);
                  if (!isNaN(date.getTime())) {
                    return `Date: ${date.toLocaleString("fr-FR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`;
                  }
                }
                return `Date: ${label}`;
              }}
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
              content={({ payload }) => {
                return (
                  <ul className="recharts-default-legend" style={{ padding: 0, margin: 0, textAlign: 'center' }}>
                    {payload?.map((entry: any, index: number) => {
                      // Essayer de récupérer le dataKey depuis différentes propriétés possibles
                      const dataKey = entry.dataKey || entry.payload?.dataKey || entry.value || '';
                      const strokeDasharray = getStrokeDasharrayForLegend(dataKey);
                      return (
                        <li
                          key={`item-${index}`}
                          className="recharts-legend-item"
                          style={{
                            display: 'inline-block',
                            marginRight: '10px',
                            cursor: 'pointer',
                          }}
                          onClick={() => entry.onClick?.()}
                        >
                          <svg
                            className="recharts-surface"
                            width={isMobile ? 10 : 12}
                            height={isMobile ? 10 : 12}
                            viewBox="0 0 12 12"
                            style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}
                          >
                            <line
                              x1="0"
                              y1="6"
                              x2="12"
                              y2="6"
                              stroke={entry.color}
                              strokeWidth="2"
                              strokeDasharray={strokeDasharray}
                            />
                          </svg>
                          <span
                            className="recharts-legend-item-text"
                            style={{
                              color: entry.inactive ? '#ccc' : '#000',
                              fontSize: isMobile ? 9 : 12,
                            }}
                          >
                            {entry.value}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                );
              }}
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
