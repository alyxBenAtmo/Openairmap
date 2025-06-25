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
import { pollutants } from "../../constants/pollutants";

interface HistoricalChartProps {
  data: Record<string, HistoricalDataPoint[]>;
  selectedPollutants: string[];
}

const HistoricalChart: React.FC<HistoricalChartProps> = ({
  data,
  selectedPollutants,
}) => {
  // Couleurs pour les différentes lignes
  const colors = [
    "#3B82F6",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
  ];

  // Fonction pour encoder les unités en notation scientifique
  const encodeUnit = (unit: string): string => {
    const unitMap: Record<string, string> = {
      "µg-m3": "µg/m³",
      "µg-m³": "μg/m³",
      "mg/m³": "mg/m³",
      ppm: "ppm",
      ppb: "ppb",
      "°C": "°C",
      "%": "%",
    };
    return unitMap[unit] || unit;
  };

  // Obtenir l'unité commune pour l'axe Y (prendre la première disponible)
  const getCommonUnit = (): string => {
    for (const pollutant of selectedPollutants) {
      if (data[pollutant] && data[pollutant].length > 0) {
        return encodeUnit(data[pollutant][0].unit);
      }
    }
    return "";
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
    return sortedTimestamps.map((timestamp) => {
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
            point[`${pollutant}_unit`] = dataPoint.unit;
          }
        }
      });

      return point;
    });
  };

  const chartData = transformData();
  const commonUnit = getCommonUnit();

  if (chartData.length === 0) {
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
        <YAxis
          fontSize={12}
          label={{
            value: commonUnit
              ? `Concentration (${commonUnit})`
              : "Concentration",
            angle: -90,
            position: "insideLeft",
            style: { textAnchor: "middle", fontSize: 12 },
          }}
        />
        <Tooltip
          formatter={(value: any, name: string, props: any) => {
            const unit = props.payload[`${name}_unit`] || "";
            const encodedUnit = encodeUnit(unit);
            return [`${value} ${encodedUnit}`, pollutants[name]?.name || name];
          }}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend />
        {selectedPollutants.map((pollutant, index) => (
          <Line
            key={pollutant}
            type="monotone"
            dataKey={pollutant}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name={pollutants[pollutant]?.name || pollutant}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default HistoricalChart;
