import React from "react";
import { MeasurementDevice } from "../../types";
import { getAirQualityLevel } from "../../utils";
import { pollutants } from "../../constants/pollutants";
import { QUALITY_COLORS } from "../../constants/qualityColors";

interface PurpleAirPopupProps {
  device: MeasurementDevice & {
    qualityLevel: string;
    rssi: number;
    uptime: number;
    confidence: number;
    temperature: number;
    humidity: number;
    pm1Value: number;
    pm25Value: number;
    pm10Value: number;
  };
  onClose: () => void;
}

const PurpleAirPopup: React.FC<PurpleAirPopupProps> = ({ device, onClose }) => {
  // Récupérer les valeurs des 3 polluants depuis le device
  const pm1Value = device.pm1Value;
  const pm25Value = device.pm25Value;
  const pm10Value = device.pm10Value;

  // Calculer les niveaux de qualité pour chaque polluant
  const pm1Level =
    pm1Value > 0
      ? getAirQualityLevel(pm1Value, pollutants.pm1.thresholds)
      : "default";
  const pm25Level = getAirQualityLevel(pm25Value, pollutants.pm25.thresholds);
  const pm10Level =
    pm10Value > 0
      ? getAirQualityLevel(pm10Value, pollutants.pm10.thresholds)
      : "default";

  // Couleurs des cartes selon le niveau de qualité (utilise les couleurs de la légende)
  const getCardColor = (level: string) => {
    const color =
      QUALITY_COLORS[level as keyof typeof QUALITY_COLORS] ||
      QUALITY_COLORS.noData;
    return {
      backgroundColor: `${color}20`, // 20% d'opacité
      borderColor: color,
    };
  };

  // Couleurs des indicateurs selon le niveau de qualité (utilise les couleurs de la légende)
  const getIndicatorColor = (level: string) => {
    return (
      QUALITY_COLORS[level as keyof typeof QUALITY_COLORS] ||
      QUALITY_COLORS.noData
    );
  };

  // Couleurs du texte selon le niveau de qualité (utilise les couleurs de la légende)
  const getTextColor = (level: string) => {
    return (
      QUALITY_COLORS[level as keyof typeof QUALITY_COLORS] ||
      QUALITY_COLORS.noData
    );
  };

  // Labels des niveaux de qualité
  const getQualityLabel = (level: string) => {
    switch (level) {
      case "bon":
        return "Bon";
      case "moyen":
        return "Moyen";
      case "degrade":
        return "Dégradé";
      case "mauvais":
        return "Mauvais";
      case "tresMauvais":
        return "Très mauvais";
      case "extrMauvais":
        return "Extrêmement mauvais";
      default:
        return "Inconnu";
    }
  };

  // Lien vers PurpleAir
  const purpleAirUrl = `https://www.purpleair.com/map?select=${device.id}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[3000]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {device.name}
            </h3>
            <p className="text-sm text-gray-500">
              Capteur PurpleAir #{device.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Contenu */}
        <div className="p-4 space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Signal RSSI:</span>
              <span className="ml-2 font-medium">{device.rssi} dBm</span>
            </div>
            <div>
              <span className="text-gray-500">Confiance:</span>
              <span
                className={`ml-2 font-medium ${
                  device.confidence >= 90
                    ? "text-green-600"
                    : device.confidence >= 70
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {device.confidence}%
              </span>
              <span className="ml-1 text-xs text-gray-400">
                (
                {device.confidence >= 90
                  ? "Excellente"
                  : device.confidence >= 70
                  ? "Bonne"
                  : "Faible"}
                )
              </span>
            </div>
            <div>
              <span className="text-gray-500">Température:</span>
              <span className="ml-2 font-medium">
                {Math.round(((device.temperature - 32) * 5) / 9)}°C
              </span>
            </div>
            <div>
              <span className="text-gray-500">Humidité:</span>
              <span className="ml-2 font-medium">{device.humidity}%</span>
            </div>
          </div>

          {/* Cartes des polluants */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">
              Mesures de qualité de l'air
            </h4>

            {/* PM1 */}
            {pm1Value > 0 && (
              <div
                className="p-4 rounded-lg border-2"
                style={{
                  backgroundColor: getCardColor(pm1Level).backgroundColor,
                  borderColor: getCardColor(pm1Level).borderColor,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getIndicatorColor(pm1Level) }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">
                      PM₁
                    </span>
                  </div>
                  <span
                    className="text-lg font-bold"
                    style={{ color: getTextColor(pm1Level) }}
                  >
                    {pm1Value} µg/m³
                  </span>
                </div>
                <div
                  className="text-sm font-medium"
                  style={{ color: getTextColor(pm1Level) }}
                >
                  {getQualityLabel(pm1Level)}
                </div>
              </div>
            )}

            {/* PM2.5 */}
            <div
              className="p-4 rounded-lg border-2"
              style={{
                backgroundColor: getCardColor(pm25Level).backgroundColor,
                borderColor: getCardColor(pm25Level).borderColor,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getIndicatorColor(pm25Level) }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">
                    PM₂.₅
                  </span>
                </div>
                <span
                  className="text-lg font-bold"
                  style={{ color: getTextColor(pm25Level) }}
                >
                  {pm25Value} µg/m³
                </span>
              </div>
              <div
                className="text-sm font-medium"
                style={{ color: getTextColor(pm25Level) }}
              >
                {getQualityLabel(pm25Level)}
              </div>
            </div>

            {/* PM10 */}
            {pm10Value > 0 && (
              <div
                className="p-4 rounded-lg border-2"
                style={{
                  backgroundColor: getCardColor(pm10Level).backgroundColor,
                  borderColor: getCardColor(pm10Level).borderColor,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getIndicatorColor(pm10Level) }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">
                      PM₁₀
                    </span>
                  </div>
                  <span
                    className="text-lg font-bold"
                    style={{ color: getTextColor(pm10Level) }}
                  >
                    {pm10Value} µg/m³
                  </span>
                </div>
                <div
                  className="text-sm font-medium"
                  style={{ color: getTextColor(pm10Level) }}
                >
                  {getQualityLabel(pm10Level)}
                </div>
              </div>
            )}
          </div>

          {/* Bouton PurpleAir */}
          <div className="pt-4 border-t border-gray-200">
            <a
              href={purpleAirUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span>Voir les données sur PurpleAir</span>
            </a>

            <div className="text-xs text-gray-500 mt-2 space-y-1">
              <p>Données en temps réel • Capteur communautaire</p>
              <p>
                La confiance indique la cohérence entre les deux capteurs
                internes (A et B)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurpleAirPopup;
