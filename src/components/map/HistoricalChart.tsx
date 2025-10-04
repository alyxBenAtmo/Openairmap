import React from "react";
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

interface HistoricalChartProps {
  data: Record<string, HistoricalDataPoint[]>;
  selectedPollutants: string[];
  source: string; // Source de données (atmoRef, atmoMicro, comparison, etc.)
  onHasCorrectedDataChange?: (hasCorrectedData: boolean) => void;
  stations?: any[]; // Stations pour le mode comparaison
}

const HistoricalChart: React.FC<HistoricalChartProps> = ({
  data,
  selectedPollutants,
  source,
  onHasCorrectedDataChange,
  stations = [],
}) => {
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

    selectedPollutants.forEach((pollutant) => {
      if (data[pollutant] && data[pollutant].length > 0) {
        const unit = encodeUnit(data[pollutant][0].unit);
        if (!unitGroups[unit]) {
          unitGroups[unit] = [];
        }
        unitGroups[unit].push(pollutant);
      }
    });

    return unitGroups;
  };

  // Transformer les données pour Recharts
  const transformData = () => {
    if (selectedPollutants.length === 0) return [];

    // Mode comparaison : données par station
    if (source === "comparison" && stations.length > 0) {
      const allTimestamps = new Set<string>();
      const pollutant = selectedPollutants[0]; // Un seul polluant en mode comparaison

      // Récupérer tous les timestamps uniques de toutes les stations
      stations.forEach((station) => {
        if (data[station.id]) {
          data[station.id].forEach((point) => {
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

        // Ajouter les valeurs pour chaque station
        stations.forEach((station) => {
          if (data[station.id]) {
            const dataPoint = data[station.id].find(
              (p) => p.timestamp === timestamp
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
      });

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

  console.log("📈 [HistoricalChart] Données transformées:", {
    chartDataLength: chartData.length,
    unitGroups,
    unitKeys,
    hasCorrectedData,
    chartData: chartData.slice(0, 3), // Log des 3 premiers points
  });

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

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp"
          angle={-45}
          textAnchor="end"
          height={80}
          fontSize={12}
        />

        {/* Axe Y principal (première unité) */}
        {unitKeys.length > 0 && (
          <YAxis
            yAxisId="left"
            fontSize={12}
            label={{
              value: `Concentration (${unitKeys[0]})`,
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle", fontSize: 12 },
            }}
          />
        )}

        {/* Axe Y secondaire (si plusieurs unités) */}
        {unitKeys.length > 1 && (
          <YAxis
            yAxisId="right"
            orientation="right"
            fontSize={12}
            label={{
              value: `Concentration (${unitKeys[1]})`,
              angle: 90,
              position: "insideRight",
              style: { textAnchor: "middle", fontSize: 12 },
            }}
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
              const pollutantName = pollutants[pollutant]?.name || pollutant;

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
                  connectNulls={false}
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
                const pollutantName = pollutants[pollutant]?.name || pollutant;

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

                        {/* Ligne des données brutes (trait discontinu) */}
                        {hasRawData && (
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
  );
};

export default HistoricalChart;
