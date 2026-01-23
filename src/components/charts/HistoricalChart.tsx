import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { HistoricalDataPoint, StationInfo, NebuleAirContextComment } from "../../types";
import {
  exportAmChartsAsPNG,
  exportDataAsCSV,
  generateExportFilename,
} from "../../utils/exportUtils";
import { featureFlags } from "../../config/featureFlags";
import ExportMenu from "./ExportMenu";
import { useHistoricalChartData } from "./hooks/useHistoricalChartData";
import { useAmChartsChart } from "./hooks/useAmChartsChart";
import { getChartMargins } from "./utils/historicalChartConfig";

interface HistoricalChartProps {
  data: Record<string, HistoricalDataPoint[]>;
  selectedPollutants: string[];
  source: string; // Source de données (atmoRef, atmoMicro, comparison, etc.)
  onHasCorrectedDataChange?: (hasCorrectedData: boolean) => void;
  stations?: any[]; // Stations pour le mode comparaison
  showRawData?: boolean; // Contrôler l'affichage des données brutes
  stationInfo?: StationInfo | null; // Informations de la station pour les exports
  timeStep?: string; // Pas de temps sélectionné (pour les métadonnées d'export)
  sensorTimeStep?: number | null; // Pas de temps du capteur en secondes (pour le mode instantane)
  modelingData?: Record<string, HistoricalDataPoint[]>; // Données de modélisation
  contextComments?: NebuleAirContextComment[]; // Commentaires de contexte pour NebuleAir
  onChartDoubleClick?: () => void; // Callback pour le double-clic sur le graphique
}

const HistoricalChart: React.FC<HistoricalChartProps> = ({
  data,
  selectedPollutants,
  source,
  onHasCorrectedDataChange,
  stations = [],
  showRawData = true,
  stationInfo = null,
  timeStep,
  sensorTimeStep,
  modelingData,
  contextComments = [],
  onChartDoubleClick,
}) => {
  // État pour détecter le mode paysage sur mobile
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(false);
  // État pour détecter si on est sur mobile
  const [isMobile, setIsMobile] = useState(false);
  // État pour le tooltip de commentaire
  const [selectedComment, setSelectedComment] = useState<{
    comment: NebuleAirContextComment;
    position: { x: number; y: number };
  } | null>(null);

  // Références pour le conteneur
  const containerRef = useRef<HTMLDivElement>(null);
  const containerIdRef = useRef<string>(
    `historical-chart-${Math.random().toString(36).substr(2, 9)}`
  );

  const useSolidNebuleAirLines =
    featureFlags.solidLineNebuleAir &&
    (source?.toLowerCase() === "nebuleair" ||
      (source === "comparison" &&
        stations.some((station) => station.source === "nebuleair")));

  // Créer une clé stable basée sur les IDs des stations pour éviter les recréations inutiles
  const prevStationsKeyRef = useRef<string>("");
  const stationsKey = useMemo(() => {
    if (stations.length === 0) {
      const emptyKey = "";
      if (prevStationsKeyRef.current !== emptyKey) {
        prevStationsKeyRef.current = emptyKey;
      }
      return prevStationsKeyRef.current;
    }
    const newKey = stations
      .map((s) => s.id)
      .sort()
      .join(",");
    if (newKey !== prevStationsKeyRef.current) {
      prevStationsKeyRef.current = newKey;
    }
    return prevStationsKeyRef.current;
  }, [stations]);

  // Mémoriser stationInfo basé sur son ID pour éviter les recréations inutiles
  const stationInfoKey = useMemo(() => {
    return stationInfo?.id || null;
  }, [stationInfo?.id]);

  // Effet pour détecter le mode paysage sur mobile
  useEffect(() => {
    const checkOrientation = () => {
      const mobile = window.innerWidth <= 768;
      const isLandscape = window.innerHeight < window.innerWidth;
      setIsMobile(mobile);
      setIsLandscapeMobile(mobile && isLandscape);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  // Utiliser le hook pour gérer les données transformées
  const {
    chartData,
    amChartsData,
    unitKeys,
    xAxisDateFormat,
    commonThresholds,
    seriesConfigs,
    hasCorrectedData,
  } = useHistoricalChartData({
    data,
    selectedPollutants,
    source,
    stations,
    isMobile,
    showRawData,
    useSolidNebuleAirLines,
    timeStep,
    modelingData,
  });

  // Calculer les marges du graphique
  const chartMargins = useMemo(() => {
    return getChartMargins(isLandscapeMobile, isMobile);
  }, [isLandscapeMobile, isMobile]);

  // Callback pour gérer le clic sur un commentaire
  const handleCommentClick = useCallback((comment: NebuleAirContextComment, event: MouseEvent) => {
    setSelectedComment({
      comment,
      position: { x: event.clientX, y: event.clientY },
    });
  }, []);

  // Utiliser le hook pour gérer le graphique amCharts
  const { chartRef, rootRef } = useAmChartsChart({
    containerRef,
    containerId: containerIdRef.current,
    chartData,
    amChartsData,
    seriesConfigs,
    unitKeys,
    commonThresholds,
    xAxisDateFormat,
    chartMargins,
    isMobile,
    isLandscapeMobile,
    stationInfo,
    timeStep,
    contextComments,
    onCommentClick: handleCommentClick,
    onChartDoubleClick,
  });

  // Notifier le composant parent si des données corrigées sont disponibles
  useEffect(() => {
    if (onHasCorrectedDataChange) {
      onHasCorrectedDataChange(hasCorrectedData);
    }
  }, [hasCorrectedData, onHasCorrectedDataChange]);

  // Fonctions d'exportation - Mémorisées pour éviter les recréations inutiles
  const handleExportPNG = useCallback(async () => {
    if (!chartData.length || !chartRef.current || !rootRef.current) return;

    try {
      const filename = generateExportFilename(
        source,
        selectedPollutants,
        stations,
        stationInfo
      );

      await exportAmChartsAsPNG(
        containerRef,
        filename,
        stationInfo,
        selectedPollutants,
        source,
        stations,
        timeStep,
        sensorTimeStep
      );
    } catch (error) {
      console.error("Erreur lors de l'export PNG:", error);
      alert("Erreur lors de l'exportation en PNG");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    chartData.length,
    source,
    selectedPollutants,
    stationsKey,
    stationInfoKey,
  ]);

  const handleExportCSV = useCallback(() => {
    if (!chartData.length) return;

    try {
      const filename = generateExportFilename(
        source,
        selectedPollutants,
        stations,
        stationInfo
      );
      exportDataAsCSV(
        chartData,
        filename,
        source,
        stations,
        selectedPollutants,
        stationInfo,
        timeStep,
        sensorTimeStep
      );
    } catch (error) {
      console.error("Erreur lors de l'export CSV:", error);
      alert("Erreur lors de l'exportation en CSV");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData, source, selectedPollutants, stationsKey, stationInfoKey]);

  // Afficher un message si aucune donnée n'est disponible
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

  // Fonction helper pour obtenir le label du commentaire
  // Utilise context_type en priorité, sinon analyse comments
  const getCommentLabel = (comment: NebuleAirContextComment): string => {
    // Utiliser context_type si disponible
    if (comment.context_type) {
      const contextTypeLower = comment.context_type.toLowerCase();
      if (contextTypeLower === "fire" || contextTypeLower === "feu") {
        return "🔥 Feu";
      } else if (contextTypeLower === "traffic" || contextTypeLower === "trafic" || contextTypeLower === "routier") {
        return "🚗 Trafic";
      } else if (contextTypeLower === "industrial" || contextTypeLower === "industriel") {
        return "🏭 Industriel";
      } else if (contextTypeLower === "voisinage") {
        return "🏘️ Voisinage";
      }
    }
    
    // Fallback sur comments si context_type n'est pas disponible
    const commentLower = comment.comments?.toLowerCase() || "";
    if (commentLower.includes("fire") || commentLower.includes("feu")) {
      return "🔥 Feu";
    } else if (commentLower.includes("traffic") || commentLower.includes("routier")) {
      return "🚗 Trafic";
    } else if (commentLower.includes("industrial") || commentLower.includes("industriel")) {
      return "🏭 Industriel";
    } else if (commentLower.includes("voisinage")) {
      return "🏘️ Voisinage";
    }
    
    return "📝 Contexte";
  };

  // Formater la date du commentaire
  const formatCommentDate = (dateString: string): string => {
    try {
      const isoDateString = dateString.replace(" ", "T");
      const date = new Date(isoDateString);
      return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Bouton burger et menu d'export en haut à droite */}
      <ExportMenu
        hasData={chartData.length > 0}
        onExportPNG={handleExportPNG}
        onExportCSV={handleExportCSV}
      />

      {/* Graphique */}
      <div className="flex-1">
        <div
          ref={containerRef}
          id={containerIdRef.current}
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </div>

      {/* Tooltip discret pour le commentaire */}
      {selectedComment && (
        <>
          {/* Overlay transparent pour fermer le tooltip */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setSelectedComment(null)}
            aria-hidden="true"
          />
          
          {/* Tooltip discret */}
          <div
            className="fixed z-50 bg-gray-900 text-white text-xs rounded-md shadow-lg px-3 py-2 max-w-xs pointer-events-none animate-in fade-in duration-150"
            style={{
              left: `${Math.min(Math.max(selectedComment.position.x + 10, 10), window.innerWidth - 280)}px`,
              top: `${Math.min(Math.max(selectedComment.position.y - 10, 10), window.innerHeight - 100)}px`,
              transform: "translateY(-100%)",
            }}
            role="tooltip"
            aria-live="polite"
          >
            {/* Flèche pointant vers le point */}
            <div
              className="absolute bottom-0 left-4 transform translate-y-full"
              style={{
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: "6px solid rgb(17, 24, 39)",
              }}
            />
            
            {/* Contenu du commentaire */}
            <div className="space-y-1">
              <div className="font-medium text-white">
                {getCommentLabel(selectedComment.comment)}
              </div>
              {selectedComment.comment.comments && (
                <div className="text-gray-300 text-xs">
                  {selectedComment.comment.comments}
                </div>
              )}
              <div className="text-gray-400 text-xs pt-1 border-t border-gray-700">
                {formatCommentDate(selectedComment.comment.datetime_start)}
                {selectedComment.comment.datetime_stop && (
                  <span className="ml-2">
                    → {formatCommentDate(selectedComment.comment.datetime_stop)}
                  </span>
                )}
              </div>
              {selectedComment.comment.user && (
                <div className="text-gray-400 text-xs">
                  Par {selectedComment.comment.user}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HistoricalChart;
