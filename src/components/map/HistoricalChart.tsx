import React, { useState, useEffect, useRef } from "react";
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
import { HistoricalDataPoint } from "../../types";
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
}

const HistoricalChart: React.FC<HistoricalChartProps> = ({
  data,
  selectedPollutants,
  source,
  onHasCorrectedDataChange,
  stations = [],
  showRawData = true,
}) => {
  // État pour détecter le mode paysage sur mobile
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(false);

  // État pour l'exportation
  const [isExporting, setIsExporting] = useState(false);

  // Référence vers le graphique pour l'exportation
  const chartRef = useRef<any>(null);

  // Effet pour détecter le mode paysage sur mobile
  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth <= 1024;
      const isLandscape = window.innerHeight < window.innerWidth;
      setIsLandscapeMobile(isMobile && isLandscape);
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
  console.log("📊 [HistoricalChart] Props reçues:", {
    data,
    selectedPollutants,
  });

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
          const point: any = {
            timestamp: new Date(timestampMs).toLocaleString("fr-FR", {
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            }),
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
      const point: any = {
        timestamp: new Date(timestamp).toLocaleString("fr-FR", {
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
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

  // Transformer les données pour Recharts
  const chartData = transformData();
  const unitGroups = groupPollutantsByUnit();
  const unitKeys = Object.keys(unitGroups);

  // Détecter si des données corrigées sont disponibles (seulement pour AtmoMicro)
  const hasCorrectedData =
    source === "atmoMicro" &&
    selectedPollutants.some((pollutant) => {
      return chartData.some(
        (point) => point[`${pollutant}_corrected`] !== undefined
      );
    });

  // Notifier le composant parent si des données corrigées sont disponibles
  React.useEffect(() => {
    if (onHasCorrectedDataChange) {
      onHasCorrectedDataChange(hasCorrectedData);
    }
  }, [hasCorrectedData, onHasCorrectedDataChange]);

  // Fonctions d'exportation
  const handleExportPNG = async () => {
    if (!chartData.length) return;

    setIsExporting(true);
    try {
      const filename = generateExportFilename(
        source,
        selectedPollutants,
        stations
      );
      await exportChartAsPNG(chartRef, filename);
    } catch (error) {
      console.error("Erreur lors de l'export PNG:", error);
      alert("Erreur lors de l'exportation en PNG");
    } finally {
      setIsExporting(false);
    }
  };

  // Option SVG supprimée

  const handleExportCSV = () => {
    if (!chartData.length) return;

    try {
      const filename = generateExportFilename(
        source,
        selectedPollutants,
        stations
      );
      exportDataAsCSV(
        chartData,
        filename,
        source,
        stations,
        selectedPollutants
      );
    } catch (error) {
      console.error("Erreur lors de l'export CSV:", error);
      alert("Erreur lors de l'exportation en CSV");
    }
  };

  console.log("📈 [HistoricalChart] Données transformées:", {
    chartDataLength: chartData.length,
    unitGroups,
    unitKeys,
    hasCorrectedData,
    chartData: chartData.slice(0, 3), // Log des 3 premiers points
  });

  // Log spécifique pour le mode comparaison
  if (source === "comparison" && stations.length > 0) {
    console.log(
      "🔍 [HistoricalChart] Mode comparaison - Analyse des données:",
      {
        totalPoints: chartData.length,
        stations: stations.map((s) => s.id),
        sampleData: chartData.slice(0, 5),
        // Compter les points avec des valeurs pour chaque station
        stationDataCount: stations.reduce((acc, station) => {
          acc[station.id] = chartData.filter(
            (p) => p[station.id] !== undefined
          ).length;
          return acc;
        }, {} as Record<string, number>),
      }
    );
  }

  // Afficher un message si aucune donnée n'est disponible
  if (chartData.length === 0) {
    console.log(
      "⚠️ [HistoricalChart] Aucune donnée disponible pour le graphique"
    );
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

  // Marges adaptées selon le mode
  const getChartMargins = () => {
    if (isLandscapeMobile) {
      // Marges réduites pour le mode paysage sur mobile
      return { top: 5, right: 10, left: 5, bottom: 5 };
    }
    // Marges normales pour les autres modes
    return { top: 5, right: 30, left: 20, bottom: 5 };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Boutons d'exportation */}
      <div className="flex flex-wrap gap-2 p-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Exporter :</span>
        </div>
        <button
          onClick={handleExportPNG}
          disabled={isExporting || !chartData.length}
          className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isExporting ? (
            <>
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
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
              Export...
            </>
          ) : (
            <>
              <svg
                className="w-3 h-3"
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
              PNG
            </>
          )}
        </button>
        {/* Option SVG supprimée */}
        <button
          onClick={handleExportCSV}
          disabled={!chartData.length}
          className="flex items-center gap-1 px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            className="w-3 h-3"
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
          CSV
        </button>
      </div>

      {/* Graphique */}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%" ref={chartRef}>
          <LineChart data={chartData} margin={getChartMargins()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              angle={-45}
              textAnchor="end"
              height={isLandscapeMobile ? 60 : 80}
              fontSize={isLandscapeMobile ? 10 : 12}
            />

            {/* Axe Y principal (première unité) */}
            {unitKeys.length > 0 && (
              <YAxis
                yAxisId="left"
                fontSize={isLandscapeMobile ? 10 : 12}
                label={{
                  value: `Concentration (${unitKeys[0]})`,
                  angle: -90,
                  position: "insideLeft",
                  style: {
                    textAnchor: "middle",
                    fontSize: isLandscapeMobile ? 10 : 12,
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
                fontSize={isLandscapeMobile ? 10 : 12}
                label={{
                  value: `Concentration (${unitKeys[1]})`,
                  angle: 90,
                  position: "insideRight",
                  style: {
                    textAnchor: "middle",
                    fontSize: isLandscapeMobile ? 10 : 12,
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
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "8px",
              }}
            />
            <Legend />

            {/* Mode comparaison : une ligne par station */}
            {source === "comparison" && stations.length > 0
              ? stations.map((station, index) => {
                  const pollutant = selectedPollutants[0];
                  // En mode comparaison, utiliser directement les couleurs de fallback pour différencier les stations
                  const stationColor =
                    fallbackColors[index % fallbackColors.length];
                  const pollutantName =
                    pollutants[pollutant]?.name || pollutant;

                  return (
                    <Line
                      key={station.id}
                      type="monotone"
                      dataKey={station.id}
                      yAxisId="left"
                      stroke={stationColor}
                      strokeWidth={2}
                      strokeDasharray="0" // Trait plein pour toutes les stations
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      name={`${station.name} - ${pollutantName}`}
                      connectNulls={true} // Relier les points malgré les gaps (résolutions différentes)
                    />
                  );
                })
              : /* Mode normal : rendu des lignes par unité */
                unitKeys.map((unit, unitIndex) => {
                  const pollutantsInUnit = unitGroups[unit];
                  const yAxisId = unitIndex === 0 ? "left" : "right";

                  return pollutantsInUnit.map((pollutant, pollutantIndex) => {
                    const pollutantColor = getPollutantColor(
                      pollutant,
                      pollutantIndex
                    );
                    const pollutantName =
                      pollutants[pollutant]?.name || pollutant;

                    // Vérifier si ce polluant a des données avec correction
                    const hasCorrectedData = chartData.some(
                      (point) => point[`${pollutant}_corrected`] !== undefined
                    );
                    const hasRawData = chartData.some(
                      (point) => point[`${pollutant}_raw`] !== undefined
                    );

                    // Déterminer le style selon la source
                    const isAtmoRef = source === "atmoRef";
                    const isAtmoMicro = source === "atmoMicro";

                    return (
                      <React.Fragment key={pollutant}>
                        {isAtmoRef ? (
                          /* AtmoRef : toujours trait plein (données de référence fiables) */
                          <Line
                            type="monotone"
                            dataKey={pollutant}
                            yAxisId={yAxisId}
                            stroke={pollutantColor}
                            strokeWidth={2}
                            strokeDasharray="0" // Trait plein
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                            name={pollutantName}
                          />
                        ) : isAtmoMicro ? (
                          /* AtmoMicro : données corrigées (trait plein) et brutes (trait discontinu) */
                          <>
                            {/* Ligne des données corrigées (trait plein) - priorité par défaut */}
                            {hasCorrectedData && (
                              <Line
                                type="monotone"
                                dataKey={`${pollutant}_corrected`}
                                yAxisId={yAxisId}
                                stroke={pollutantColor}
                                strokeWidth={2}
                                strokeDasharray="0" // Trait plein
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
                                name={pollutantName} // Nom simple par défaut
                                connectNulls={false}
                              />
                            )}

                            {/* Ligne des données brutes (trait discontinu) - affichée seulement si showRawData est true */}
                            {hasRawData && showRawData && (
                              <Line
                                type="monotone"
                                dataKey={`${pollutant}_raw`}
                                yAxisId={yAxisId}
                                stroke={pollutantColor}
                                strokeWidth={2}
                                strokeDasharray="5 5" // Trait discontinu
                                dot={{ r: 2 }}
                                activeDot={{ r: 4 }}
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
                            type="monotone"
                            dataKey={pollutant}
                            yAxisId={yAxisId}
                            stroke={pollutantColor}
                            strokeWidth={2}
                            strokeDasharray="5 5" // Trait discontinu
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                            name={pollutantName}
                          />
                        )}
                      </React.Fragment>
                    );
                  });
                })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HistoricalChart;
