import React, { useState, useMemo } from "react";
import ControlPanel from "./components/controls/ControlPanel";
import AirQualityMap from "./components/map/AirQualityMap";
import { useAirQualityData } from "./hooks/useAirQualityData";
import { pollutants, getDefaultPollutant } from "./constants/pollutants";
import { pasDeTemps } from "./constants/timeSteps";
import TimePeriodDisplay from "./components/controls/TimePeriodDisplay";

const App: React.FC = () => {
  // Trouver le pas de temps activé par défaut (calculé une seule fois)
  const defaultTimeStep = useMemo(() => {
    const defaultTimeStep = Object.entries(pasDeTemps).find(
      ([_, timeStep]) => timeStep.activated
    );
    return defaultTimeStep ? defaultTimeStep[0] : "heure";
  }, []);

  // Calculer la période par défaut pour SignalAir (2 derniers jours)
  const defaultSignalAirPeriod = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 2);

    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  }, []);

  // États pour les contrôles avec polluant par défaut
  const [selectedPollutant, setSelectedPollutant] = useState<string>(
    getDefaultPollutant()
  );
  const [selectedSources, setSelectedSources] = useState<string[]>([
    "atmoRef",
    "atmoMicro",
  ]);
  const [selectedTimeStep, setSelectedTimeStep] =
    useState<string>(defaultTimeStep);
  const [signalAirPeriod, setSignalAirPeriod] = useState(
    defaultSignalAirPeriod
  );

  // Fonction wrapper pour gérer le changement de période SignalAir
  const handleSignalAirPeriodChange = (startDate: string, endDate: string) => {
    setSignalAirPeriod({ startDate, endDate });
  };

  // Hook pour récupérer les données
  const { devices, loading, error } = useAirQualityData({
    selectedPollutant,
    selectedSources,
    selectedTimeStep,
    signalAirPeriod,
  });

  // Centre de la carte (Provence-Alpes-Côte d'Azur)
  const mapCenter: [number, number] = [43.7102, 7.262]; // Nice
  const mapZoom = 9;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header minimal */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 shadow-sm z-[1000]">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-blue-600">OpenAirMap</h1>
          <div className="text-xs text-gray-600 space-x-4">
            <span>{pollutants[selectedPollutant]?.name}</span>
            <span>•</span>
            <span>
              {pasDeTemps[selectedTimeStep as keyof typeof pasDeTemps]?.name}
            </span>
            <span>•</span>
            <span>{selectedSources.length} sources</span>
            <span>•</span>
            <TimePeriodDisplay timeStep={selectedTimeStep} />
          </div>
        </div>
      </header>

      {/* Carte en plein écran avec contrôles intégrés */}
      <main className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-[1500]">
            <div className="bg-white px-4 py-3 rounded-lg shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-blue-600 text-sm font-medium">
                  {devices.length === 0
                    ? "Nettoyage et chargement..."
                    : "Chargement..."}
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-2 rounded-md shadow-lg z-[1500] max-w-xs">
            <p className="text-xs">Erreur: {error}</p>
          </div>
        )}

        <AirQualityMap
          devices={devices}
          center={mapCenter}
          zoom={mapZoom}
          selectedPollutant={selectedPollutant}
        />

        {/* Panneau de contrôle flottant */}
        <ControlPanel
          selectedPollutant={selectedPollutant}
          selectedSources={selectedSources}
          selectedTimeStep={selectedTimeStep}
          signalAirPeriod={signalAirPeriod}
          onPollutantChange={setSelectedPollutant}
          onSourceChange={setSelectedSources}
          onTimeStepChange={setSelectedTimeStep}
          onSignalAirPeriodChange={handleSignalAirPeriodChange}
        />

        {/* Informations de la carte */}
        <div className="absolute bottom-4 right-4 bg-white px-3 py-2 rounded-md shadow-lg z-[1000]">
          <p className="text-xs text-gray-600">
            {devices.length} appareil{devices.length > 1 ? "s" : ""}
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;
