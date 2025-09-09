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
}

const HistoricalChart: React.FC<HistoricalChartProps> = ({
  data,
  selectedPollutants,
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

      // Ajouter les valeurs pour chaque polluant
      selectedPollutants.forEach((pollutant, index) => {
        if (data[pollutant]) {
          const dataPoint = data[pollutant].find(
            (p) => p.timestamp === timestamp
          );
          if (dataPoint) {
            point[pollutant] = dataPoint.value;
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

  console.log("📈 [HistoricalChart] Données transformées:", {
    chartDataLength: chartData.length,
    unitGroups,
    unitKeys,
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
            // Utiliser la clé originale du polluant (dataKey) au lieu du nom affiché
            const pollutantKey = props.dataKey || name;

            // Récupérer l'unité stockée dans les données
            let unit = props.payload[`${pollutantKey}_unit`] || "";

            // Si pas d'unité dans les données, utiliser celle des constantes
            if (!unit && pollutants[pollutantKey]) {
              unit = pollutants[pollutantKey].unit;
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

        {/* Rendu des lignes par unité */}
        {unitKeys.map((unit, unitIndex) => {
          const pollutantsInUnit = unitGroups[unit];
          const yAxisId = unitIndex === 0 ? "left" : "right";

          return pollutantsInUnit.map((pollutant, pollutantIndex) => (
            <Line
              key={pollutant}
              type="monotone"
              dataKey={pollutant}
              yAxisId={yAxisId}
              stroke={getPollutantColor(pollutant, pollutantIndex)}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              name={pollutants[pollutant]?.name || pollutant}
            />
          ));
        })}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default HistoricalChart;
