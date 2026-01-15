import { useState } from "react";
import { StationInfo, ComparisonState } from "../../../types";

interface UseSidePanelsProps {
  initialSelectedPollutant: string;
}

export const useSidePanels = ({ initialSelectedPollutant }: UseSidePanelsProps) => {
  const [selectedStation, setSelectedStation] = useState<StationInfo | null>(
    null
  );
  const [lastSelectedStationBeforeComparison, setLastSelectedStationBeforeComparison] =
    useState<StationInfo | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [panelSize, setPanelSize] = useState<
    "normal" | "fullscreen" | "hidden"
  >("normal");

  // États pour le mode comparaison
  const [comparisonState, setComparisonState] = useState<ComparisonState>({
    isComparisonMode: false,
    comparedStations: [],
    comparisonData: {},
    selectedPollutant: initialSelectedPollutant,
    timeRange: {
      type: "preset",
      preset: "24h",
    },
    timeStep: "heure",
    loading: false,
    error: null,
  });

  const handleCloseSidePanel = () => {
    setIsSidePanelOpen(false);
    setSelectedStation(null);
    setPanelSize("normal");
    // Réinitialiser le mode comparaison à la fermeture
    setComparisonState((prev) => ({
      ...prev,
      isComparisonMode: false,
      comparedStations: [],
      comparisonData: {},
    }));
  };

  const handleSidePanelSizeChange = (
    newSize: "normal" | "fullscreen" | "hidden"
  ) => {
    setPanelSize(newSize);
  };

  // Fonction pour basculer le mode comparaison
  const handleComparisonModeToggle = (pollutantToPreserve?: string) => {
    const isActivatingComparison = !comparisonState.isComparisonMode;

    if (isActivatingComparison) {
      setLastSelectedStationBeforeComparison(selectedStation);

      // Préserver le polluant actuel du panel ou utiliser celui passé en paramètre
      const pollutantToUse = pollutantToPreserve || comparisonState.selectedPollutant;

      setComparisonState((prev) => ({
        ...prev,
        isComparisonMode: true,
        // Si on active le mode comparaison, ajouter la station actuelle comme première
        comparedStations:
          selectedStation ? [selectedStation] : prev.comparedStations,
        // Préserver le polluant sélectionné dans le panel normal
        selectedPollutant: pollutantToUse,
      }));

      // Nettoyer selectedStation quand on active le mode comparaison pour éviter les conflits
      setSelectedStation(null);
      setIsSidePanelOpen(false);
    } else {
      const remainingStations = comparisonState.comparedStations;
      const lastStationStillPresent =
        lastSelectedStationBeforeComparison &&
        remainingStations.some(
          (station) => station.id === lastSelectedStationBeforeComparison.id
        )
          ? lastSelectedStationBeforeComparison
          : null;

      setComparisonState((prev) => ({
        ...prev,
        isComparisonMode: false,
        comparedStations: [],
        comparisonData: {},
      }));

      const stationToRestore =
        (remainingStations.length === 1
          ? remainingStations[0]
          : lastStationStillPresent) ||
        remainingStations[0] ||
        null;

      if (stationToRestore) {
        setSelectedStation(stationToRestore);
        setIsSidePanelOpen(true);
        setPanelSize("normal");
      } else {
        setSelectedStation(null);
        setIsSidePanelOpen(false);
      }

      setLastSelectedStationBeforeComparison(null);
    }
  };

  return {
    // États
    selectedStation,
    setSelectedStation,
    isSidePanelOpen,
    setIsSidePanelOpen,
    panelSize,
    setPanelSize,
    comparisonState,
    setComparisonState,

    // Handlers
    handleCloseSidePanel,
    handleSidePanelSizeChange,
    handleComparisonModeToggle,
  };
};

