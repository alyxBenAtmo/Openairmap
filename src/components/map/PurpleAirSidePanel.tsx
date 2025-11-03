import React, { useState, useEffect } from "react";
import { StationInfo } from "../../types";
import { getAirQualityLevel } from "../../utils";
import { pollutants } from "../../constants/pollutants";
import { QUALITY_COLORS } from "../../constants/qualityColors";

interface PurpleAirDeviceData {
  rssi: number;
  uptime: number;
  confidence: number;
  temperature: number;
  humidity: number;
  pm1Value: number;
  pm25Value: number;
  pm10Value: number;
}

interface PurpleAirSidePanelProps {
  isOpen: boolean;
  selectedStation: StationInfo | null;
  deviceData?: PurpleAirDeviceData;
  onClose: () => void;
  onHidden?: () => void;
  onSizeChange?: (size: "normal" | "fullscreen" | "hidden") => void;
  initialPollutant: string;
  panelSize?: "normal" | "fullscreen" | "hidden";
}

type PanelSize = "normal" | "fullscreen" | "hidden";

const PurpleAirSidePanel: React.FC<PurpleAirSidePanelProps> = ({
  isOpen,
  selectedStation,
  deviceData,
  onClose,
  onHidden,
  onSizeChange,
  initialPollutant,
  panelSize: externalPanelSize,
}) => {
  const [internalPanelSize, setInternalPanelSize] =
    useState<PanelSize>("normal");

  // Utiliser la taille externe si fournie, sinon la taille interne
  const currentPanelSize = externalPanelSize || internalPanelSize;

  const handlePanelSizeChange = (newSize: PanelSize) => {
    if (onSizeChange) {
      // Si on a un callback externe, l'utiliser
      onSizeChange(newSize);
    } else {
      // Sinon, utiliser l'état interne
      setInternalPanelSize(newSize);
    }

    if (newSize === "hidden" && onHidden) {
      onHidden();
    }
  };

  // Réinitialiser la taille du panel quand la station change
  useEffect(() => {
    if (isOpen && selectedStation) {
      setInternalPanelSize("normal");
    } else {
      setInternalPanelSize("hidden");
    }
  }, [isOpen, selectedStation]);

  if (!isOpen || !selectedStation || !deviceData) {
    return null;
  }

  // Récupérer les valeurs des 3 polluants
  const pm1Value = deviceData.pm1Value;
  const pm25Value = deviceData.pm25Value;
  const pm10Value = deviceData.pm10Value;

  // Calculer les niveaux de qualité pour chaque polluant
  const pm1Level =
    pm1Value > 0
      ? getAirQualityLevel(pm1Value, pollutants.pm1.thresholds)
      : "default";
  const pm25Level = getAirQualityLevel(
    pm25Value,
    pollutants.pm25.thresholds
  );
  const pm10Level =
    pm10Value > 0
      ? getAirQualityLevel(pm10Value, pollutants.pm10.thresholds)
      : "default";

  // Couleurs des cartes selon le niveau de qualité
  const getCardColor = (level: string) => {
    const color =
      QUALITY_COLORS[level as keyof typeof QUALITY_COLORS] ||
      QUALITY_COLORS.noData;
    return {
      backgroundColor: `${color}20`, // 20% d'opacité
      borderColor: color,
    };
  };

  // Couleurs des indicateurs selon le niveau de qualité
  const getIndicatorColor = (level: string) => {
    return (
      QUALITY_COLORS[level as keyof typeof QUALITY_COLORS] ||
      QUALITY_COLORS.noData
    );
  };

  // Couleurs du texte selon le niveau de qualité
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
  const purpleAirUrl = `https://www.purpleair.com/map?select=${selectedStation.id}`;

  const getPanelClasses = () => {
    const baseClasses =
      "bg-white shadow-xl flex flex-col border-r border-gray-200 transition-all duration-300 h-[calc(100vh-64px)]";

    switch (currentPanelSize) {
      case "fullscreen":
        return `${baseClasses} w-full`;
      case "hidden":
        // Retirer complètement du flux pour éviter l'espace réservé
        return `${baseClasses} hidden`;
      case "normal":
      default:
        // Responsive: plein écran sur mobile, largeur réduite pour les petits écrans en paysage
        return `${baseClasses} w-full sm:w-[320px] md:w-[400px] lg:w-[600px] xl:w-[650px]`;
    }
  };

  return (
    <div className={getPanelClasses()}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
            {selectedStation.name}
          </h2>
          <p className="text-xs text-gray-500 truncate">
            Capteur PurpleAir #{selectedStation.id}
          </p>
        </div>

        {/* Contrôles unifiés du panel */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Bouton agrandir/rétrécir */}
          <button
            onClick={() =>
              handlePanelSizeChange(
                currentPanelSize === "fullscreen" ? "normal" : "fullscreen"
              )
            }
            className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title={
              currentPanelSize === "fullscreen"
                ? "Rétrécir le panel"
                : "Agrandir le panel"
            }
          >
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {currentPanelSize === "fullscreen" ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              )}
            </svg>
          </button>

          {/* Bouton rabattre */}
          <button
            onClick={() => handlePanelSizeChange("hidden")}
            className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Rabattre le panel"
          >
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4"
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
      </div>

      {/* Contenu - masqué quand currentPanelSize === 'hidden' */}
      {currentPanelSize !== "hidden" && (
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
          {/* Informations générales */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Informations du capteur
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div>
                <span className="text-gray-500 block text-xs mb-1">
                  Confiance
                </span>
                <span
                  className={`font-medium block ${
                    deviceData.confidence >= 90
                      ? "text-green-600"
                      : deviceData.confidence >= 70
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {deviceData.confidence}%
                </span>
                <span className="text-xs text-gray-400">
                  {deviceData.confidence >= 90
                    ? "Excellente"
                    : deviceData.confidence >= 70
                    ? "Bonne"
                    : "Faible"}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs mb-1">
                  Température
                </span>
                <span className="font-medium text-gray-900">
                  {Math.round(((deviceData.temperature - 32) * 5) / 9)}°C
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs mb-1">Humidité</span>
                <span className="font-medium text-gray-900">
                  {deviceData.humidity}%
                </span>
              </div>
            </div>
          </div>

          {/* Cartes des polluants */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 sm:mb-4">
              Mesures de qualité de l'air
            </h3>

            <div className="space-y-3 sm:space-y-4">
              {/* PM1 */}
              {pm1Value > 0 && (
                <div
                  className="p-3 sm:p-4 rounded-lg border-2"
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
                className="p-3 sm:p-4 rounded-lg border-2"
                style={{
                  backgroundColor: getCardColor(pm25Level).backgroundColor,
                  borderColor: getCardColor(pm25Level).borderColor,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: getIndicatorColor(pm25Level),
                      }}
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
                  className="p-3 sm:p-4 rounded-lg border-2"
                  style={{
                    backgroundColor: getCardColor(pm10Level).backgroundColor,
                    borderColor: getCardColor(pm10Level).borderColor,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: getIndicatorColor(pm10Level),
                        }}
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
          </div>

          {/* Bouton PurpleAir */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
            <a
              href={purpleAirUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 sm:py-3 px-4 rounded-md transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span className="text-sm sm:text-base">
                Voir les données sur PurpleAir
              </span>
            </a>

            <div className="text-xs text-gray-500 mt-3 space-y-1">
              <p>Données en temps réel • Capteur communautaire</p>
              <p>
                La confiance indique la cohérence entre les deux capteurs internes
                (A et B)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurpleAirSidePanel;

