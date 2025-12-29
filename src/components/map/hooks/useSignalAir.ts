import { useState, useEffect, useRef } from "react";
import { SignalAirReport } from "../../../types";
import L from "leaflet";

interface UseSignalAirProps {
  selectedSources: string[];
  signalAirHasLoaded: boolean;
  signalAirReportsCount: number;
  isSignalAirLoading: boolean;
  reports: SignalAirReport[];
  mapRef: React.RefObject<L.Map | null>;
  onSignalAirLoadRequest?: () => void;
}

export const useSignalAir = ({
  selectedSources,
  signalAirHasLoaded,
  signalAirReportsCount,
  isSignalAirLoading,
  reports,
  mapRef,
  onSignalAirLoadRequest,
}: UseSignalAirProps) => {
  const [isSignalAirPanelOpen, setIsSignalAirPanelOpen] = useState(false);
  const [signalAirPanelSize, setSignalAirPanelSize] = useState<
    "normal" | "fullscreen" | "hidden"
  >("normal");
  const [userClosedSignalAirPanel, setUserClosedSignalAirPanel] =
    useState(false);
  const [selectedSignalAirReport, setSelectedSignalAirReport] =
    useState<SignalAirReport | null>(null);
  const [isSignalAirDetailPanelOpen, setIsSignalAirDetailPanelOpen] =
    useState(false);
  const [signalAirDetailPanelSize, setSignalAirDetailPanelSize] = useState<
    "normal" | "fullscreen" | "hidden"
  >("normal");
  const signalAirLoadPendingRef = useRef(false);
  const [signalAirFeedback, setSignalAirFeedback] = useState<string | null>(
    null
  );
  const prevSelectedSourcesRef = useRef<string[]>([]);

  // Effet pour gérer l'ouverture/fermeture automatique du panel SignalAir
  useEffect(() => {
    const isSignalAirSourceSelected = selectedSources.some(s => s.includes("signalair"));
    const wasSignalAirSelected = prevSelectedSourcesRef.current.some(s => s.includes("signalair"));
    const isNewlySelected = isSignalAirSourceSelected && !wasSignalAirSelected;

    // Mettre à jour la référence pour la prochaine fois
    prevSelectedSourcesRef.current = [...selectedSources];

    if (!isSignalAirSourceSelected) {
      signalAirLoadPendingRef.current = false;
      setIsSignalAirPanelOpen(false);
      setSignalAirPanelSize("normal");
      setIsSignalAirDetailPanelOpen(false);
      setSignalAirDetailPanelSize("normal");
      setSelectedSignalAirReport(null);
      setSignalAirFeedback(null);
      setUserClosedSignalAirPanel(false);
      return;
    }

    if (signalAirLoadPendingRef.current) {
      if (signalAirHasLoaded) {
        signalAirLoadPendingRef.current = false;
      } else {
        return;
      }
    }

    // Ne rouvrir le panel que si:
    // 1. SignalAir vient d'être sélectionné (nouvelle sélection)
    // 2. L'utilisateur ne l'a pas fermé manuellement
    // 3. Le panel n'est pas déjà caché
    // 4. Les données n'ont pas encore été chargées
    if (
      isNewlySelected &&
      !signalAirHasLoaded &&
      !userClosedSignalAirPanel &&
      signalAirPanelSize !== "hidden"
    ) {
      setIsSignalAirPanelOpen(true);
      setSignalAirPanelSize("normal");
      setUserClosedSignalAirPanel(false);
    }
  }, [selectedSources, signalAirHasLoaded, userClosedSignalAirPanel, signalAirPanelSize]);

  // Effet pour gérer le feedback quand aucun signalement n'est trouvé
  useEffect(() => {
    if (signalAirHasLoaded && signalAirReportsCount === 0) {
      setSignalAirFeedback(
        "Aucun signalement SignalAir n'a été trouvé pour la période sélectionnée."
      );
      setIsSignalAirDetailPanelOpen(false);
      setSelectedSignalAirReport(null);
    } else if (signalAirReportsCount > 0) {
      setSignalAirFeedback(null);
    }
  }, [signalAirHasLoaded, signalAirReportsCount]);

  // Effet pour nettoyer le feedback pendant le chargement
  useEffect(() => {
    if (isSignalAirLoading) {
      setSignalAirFeedback(null);
    }
  }, [isSignalAirLoading]);

  // Effet pour vérifier que le rapport sélectionné existe toujours
  useEffect(() => {
    if (!selectedSignalAirReport) {
      return;
    }

    const exists = reports.some(
      (report) => report.id === selectedSignalAirReport.id
    );

    if (!exists) {
      setSelectedSignalAirReport(null);
      setIsSignalAirDetailPanelOpen(false);
      setSignalAirDetailPanelSize("normal");
    }
  }, [reports, selectedSignalAirReport]);

  // Handlers
  const handleSignalAirLoad = () => {
    signalAirLoadPendingRef.current = true;
    if (onSignalAirLoadRequest) {
      onSignalAirLoadRequest();
    }
    setIsSignalAirPanelOpen(false);
    setSignalAirPanelSize("normal");
    setUserClosedSignalAirPanel(true);
  };

  const handleCloseSignalAirPanel = () => {
    setIsSignalAirPanelOpen(false);
    setSignalAirPanelSize("normal");
    setIsSignalAirDetailPanelOpen(false);
    setSignalAirDetailPanelSize("normal");
    setSelectedSignalAirReport(null);
    setUserClosedSignalAirPanel(true);
  };

  const handleSignalAirPanelSizeChange = (
    newSize: "normal" | "fullscreen" | "hidden"
  ) => {
    setSignalAirPanelSize(newSize);
    if (newSize === "hidden") {
      setIsSignalAirPanelOpen(false);
      setUserClosedSignalAirPanel(true);
    } else {
      setIsSignalAirPanelOpen(true);
      setUserClosedSignalAirPanel(false);
    }
  };

  const handleSignalAirPanelHidden = () => {
    setSignalAirPanelSize("hidden");
    setIsSignalAirPanelOpen(false);
    setUserClosedSignalAirPanel(true);
  };

  const handleSignalAirMarkerClick = (report: SignalAirReport) => {
    setSelectedSignalAirReport(report);
    setIsSignalAirDetailPanelOpen(true);
    setSignalAirDetailPanelSize("normal");

    if (mapRef.current) {
      mapRef.current.panTo([report.latitude, report.longitude], {
        animate: true,
        duration: 0.5,
      });
    }
  };

  const handleCloseSignalAirDetailPanel = () => {
    setIsSignalAirDetailPanelOpen(false);
    setSignalAirDetailPanelSize("normal");
    setSelectedSignalAirReport(null);
  };

  const handleSignalAirDetailPanelSizeChange = (
    newSize: "normal" | "fullscreen" | "hidden"
  ) => {
    setSignalAirDetailPanelSize(newSize);
    // Réactiver le panel si on change de "hidden" à autre chose
    if (newSize !== "hidden" && !isSignalAirDetailPanelOpen) {
      setIsSignalAirDetailPanelOpen(true);
    }
  };

  const handleCenterOnSignalAirReport = (report: SignalAirReport) => {
    if (mapRef.current) {
      mapRef.current.panTo([report.latitude, report.longitude], {
        animate: true,
        duration: 0.5,
      });
    }
  };

  const handleDismissSignalAirFeedback = () => {
    setSignalAirFeedback(null);
  };

  const handleOpenSignalAirPanel = () => {
    setIsSignalAirPanelOpen(true);
    setSignalAirPanelSize("normal");
    setUserClosedSignalAirPanel(false);
  };

  return {
    // États
    isSignalAirPanelOpen,
    signalAirPanelSize,
    userClosedSignalAirPanel,
    selectedSignalAirReport,
    isSignalAirDetailPanelOpen,
    signalAirDetailPanelSize,
    signalAirFeedback,

    // Handlers
    handleSignalAirLoad,
    handleCloseSignalAirPanel,
    handleSignalAirPanelSizeChange,
    handleSignalAirPanelHidden,
    handleSignalAirMarkerClick,
    handleCloseSignalAirDetailPanel,
    handleSignalAirDetailPanelSizeChange,
    handleCenterOnSignalAirReport,
    handleDismissSignalAirFeedback,
    handleOpenSignalAirPanel,
  };
};

