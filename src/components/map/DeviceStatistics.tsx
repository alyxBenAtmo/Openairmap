import React, { useState } from "react";
import { MeasurementDevice, SignalAirReport } from "../../types";
import StatisticsPanel from "./StatisticsPanel";
import { cn } from "../../lib/utils";
import {
  DeviceStatistics as DeviceStatisticsType,
  SourceStatistics,
} from "../../utils/deviceStatisticsUtils";

interface DeviceStatisticsProps {
  visibleDevices: MeasurementDevice[];
  visibleReports: SignalAirReport[];
  totalDevices: number;
  totalReports: number;
  selectedPollutant: string;
  selectedSources?: string[];
  statistics?: DeviceStatisticsType; // OPTIMISATION : Statistiques pré-calculées
  sourceStatistics?: SourceStatistics[]; // OPTIMISATION : Stats par source pré-calculées
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
  selectedSources = [],
  statistics, // OPTIMISATION : Utiliser les statistiques pré-calculées
  sourceStatistics, // OPTIMISATION : Stats par source pré-calculées
  showDetails = false,
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // OPTIMISATION : Utiliser les statistiques pré-calculées si disponibles
  // Sinon, calculer localement (fallback pour compatibilité)
  const devicesBySource = statistics?.devicesBySource || visibleDevices.reduce((acc, device) => {
    acc[device.source] = (acc[device.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const qualityLevels = statistics?.qualityLevels || visibleDevices.reduce((acc, device) => {
    const level = device.qualityLevel || "default";
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const averageValue = statistics?.averageValue ?? 0;
  const minValue = statistics?.minValue ?? 0;
  const maxValue = statistics?.maxValue ?? 0;
  const activeDevices = statistics?.activeDevices ?? 0;

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
        onClick={() => (visibleDevices.length > 0 || visibleReports.length > 0) && setIsPanelOpen(!isPanelOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (visibleDevices.length > 0 || visibleReports.length > 0) {
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
              {visibleDevices.length} appareil{visibleDevices.length > 1 ? "s" : ""} visibles
              {visibleDevices.length !== totalDevices && totalDevices > 0 && (
                <span className="text-gray-500 font-normal">
                  {" "}
                  / {totalDevices} au total
                </span>
              )}
            </span>
          </div>
          {(visibleDevices.length > 0 || visibleReports.length > 0) && (
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
        visibleReports={visibleReports}
        selectedSources={selectedSources}
        selectedPollutant={selectedPollutant}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        statistics={statistics} // OPTIMISATION : Passer les statistiques pré-calculées
        sourceStatistics={sourceStatistics} // OPTIMISATION : Passer les stats par source pré-calculées
      />
    </>
  );
};

export default DeviceStatistics;
