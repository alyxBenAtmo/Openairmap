import React, { useState } from "react";
import { MeasurementDevice, SignalAirReport } from "../../types";
import StatisticsPanel from "./StatisticsPanel";
import { cn } from "../../lib/utils";

interface DeviceStatisticsProps {
  visibleDevices: MeasurementDevice[];
  visibleReports: SignalAirReport[];
  totalDevices: number;
  totalReports: number;
  selectedPollutant: string;
  showDetails?: boolean;
}

/**
 * Composant pour afficher les statistiques des appareils visibles dans le viewport
 */
const DeviceStatistics: React.FC<DeviceStatisticsProps> = ({
  visibleDevices,
  visibleReports,
  totalDevices,
  totalReports,
  selectedPollutant,
  showDetails = false,
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  // Calculer les statistiques par source
  const devicesBySource = visibleDevices.reduce((acc, device) => {
    acc[device.source] = (acc[device.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculer les statistiques de qualité
  const qualityLevels = visibleDevices.reduce((acc, device) => {
    const level = device.qualityLevel || "default";
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculer la valeur moyenne, min et max
  const values = visibleDevices.map((device) => device.value).filter((v) => v > 0);
  const averageValue =
    values.length > 0
      ? values.reduce((sum, val) => sum + val, 0) / values.length
      : 0;
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const maxValue = values.length > 0 ? Math.max(...values) : 0;

  // Nombre d'appareils actifs
  const activeDevices = visibleDevices.filter(
    (device) => device.status === "active"
  ).length;

  // Formatage des nombres
  const formatNumber = (num: number, decimals: number = 1): string => {
    return num.toFixed(decimals);
  };

  // Obtenir le nom lisible de la source
  const getSourceName = (source: string): string => {
    const sourceNames: Record<string, string> = {
      atmoref: "AtmoRef",
      atmomicro: "AtmoMicro",
      "communautaire.nebuleair": "NebuleAir",
      "communautaire.sensorcommunity": "Sensor.Community",
      "communautaire.purpleair": "PurpleAir",
      "communautaire.mobileair": "MobileAir",
      signalair: "SignalAir",
    };
    return sourceNames[source] || source;
  };

  // Obtenir le nom lisible du niveau de qualité
  const getQualityName = (level: string): string => {
    const qualityNames: Record<string, string> = {
      bon: "Bon",
      moyen: "Moyen",
      degrade: "Dégradé",
      mauvais: "Mauvais",
      tresMauvais: "Très mauvais",
      extrMauvais: "Extrêmement mauvais",
      default: "Non défini",
    };
    return qualityNames[level] || level;
  };

  // Couleurs pour les niveaux de qualité
  const getQualityColor = (level: string): string => {
    const colors: Record<string, string> = {
      bon: "text-green-600",
      moyen: "text-yellow-600",
      degrade: "text-orange-600",
      mauvais: "text-red-600",
      tresMauvais: "text-red-700",
      extrMauvais: "text-red-900",
      default: "text-gray-600",
    };
    return colors[level] || "text-gray-600";
  };

  return (
    <>
      <div
        className={cn(
          "text-xs text-gray-600 cursor-pointer transition-all",
          "hover:bg-gray-50 rounded-md -mx-1 px-1 py-0.5",
          isPanelOpen && "bg-gray-50"
        )}
        onClick={() => visibleDevices.length > 0 && setIsPanelOpen(!isPanelOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (visibleDevices.length > 0) {
              setIsPanelOpen(!isPanelOpen);
            }
          }
        }}
        aria-label="Afficher les statistiques détaillées"
      >
        {/* Affichage principal : nombre d'appareils visibles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <span className="font-medium">
              {visibleDevices.length} appareil{visibleDevices.length > 1 ? "s" : ""} visible
              {visibleDevices.length !== totalDevices && totalDevices > 0 && (
                <span className="text-gray-500 font-normal">
                  {" "}
                  / {totalDevices} au total
                </span>
              )}
            </span>
          </div>
          {visibleDevices.length > 0 && (
            <svg
              className={cn(
                "h-4 w-4 text-gray-400 transition-transform",
                isPanelOpen && "rotate-180"
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </div>

        {/* Affichage des signalements si présents */}
        {visibleReports.length > 0 && (
          <div className="mt-1">
            <span>
              {visibleReports.length} signalement
              {visibleReports.length > 1 ? "s" : ""} visible
              {visibleReports.length !== totalReports && totalReports > 0 && (
                <span className="text-gray-500">
                  {" "}
                  / {totalReports} au total
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Panel statistique */}
      <StatisticsPanel
        visibleDevices={visibleDevices}
        selectedPollutant={selectedPollutant}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </>
  );

      {/* Détails supplémentaires si demandé */}
      {showDetails && visibleDevices.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
          {/* Statistiques de valeurs */}
          {values.length > 0 && (
            <div className="space-y-0.5">
              <div className="text-gray-500 text-[10px]">
                {selectedPollutant.toUpperCase()} (moyenne: {formatNumber(averageValue)}{" "}
                {visibleDevices[0]?.unit || ""})
              </div>
              <div className="text-gray-500 text-[10px]">
                Min: {formatNumber(minValue)} | Max: {formatNumber(maxValue)}
              </div>
            </div>
          )}

          {/* Répartition par source */}
          {Object.keys(devicesBySource).length > 1 && (
            <div className="mt-1">
              <div className="text-gray-500 text-[10px] font-medium mb-0.5">
                Par source:
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                {Object.entries(devicesBySource).map(([source, count]) => (
                  <span key={source} className="text-[10px]">
                    {getSourceName(source)}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Répartition par qualité */}
          {Object.keys(qualityLevels).length > 0 && (
            <div className="mt-1">
              <div className="text-gray-500 text-[10px] font-medium mb-0.5">
                Qualité:
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                {Object.entries(qualityLevels).map(([level, count]) => (
                  <span
                    key={level}
                    className={`text-[10px] ${getQualityColor(level)}`}
                  >
                    {getQualityName(level)}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Appareils actifs */}
          {activeDevices !== visibleDevices.length && (
            <div className="mt-1 text-[10px] text-gray-500">
              {activeDevices} actif{activeDevices > 1 ? "s" : ""} /{" "}
              {visibleDevices.length - activeDevices} inactif
              {visibleDevices.length - activeDevices > 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}
};

export default DeviceStatistics;
