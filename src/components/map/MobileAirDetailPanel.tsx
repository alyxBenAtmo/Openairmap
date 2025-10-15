import React, { useState, useEffect, useCallback } from "react";
import {
  MobileAirRoute,
  MobileAirDataPoint,
  MOBILEAIR_POLLUTANT_MAPPING,
} from "../../types";
import { pollutants } from "../../constants/pollutants";
import {
  getQualityColor,
  getQualityLevel,
} from "../../constants/qualityColors";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from "recharts";

interface MobileAirDetailPanelProps {
  isOpen: boolean;
  selectedRoute: MobileAirRoute | null;
  activeRoute: MobileAirRoute | null;
  allRoutes: MobileAirRoute[];
  selectedPollutant: string;
  highlightedPoint?: MobileAirDataPoint | null;
  onClose: () => void;
  onHidden?: () => void;
  onSizeChange?: (size: "normal" | "fullscreen" | "hidden") => void;
  onPointHover?: (point: MobileAirDataPoint | null) => void;
  onPointHighlight?: (point: MobileAirDataPoint | null) => void;
  onRouteSelect?: (route: MobileAirRoute) => void;
  panelSize?: "normal" | "fullscreen" | "hidden";
}

type PanelSize = "normal" | "fullscreen" | "hidden";

const MobileAirDetailPanel: React.FC<MobileAirDetailPanelProps> = ({
  isOpen,
  selectedRoute,
  activeRoute,
  allRoutes,
  selectedPollutant,
  highlightedPoint,
  onClose,
  onHidden,
  onSizeChange,
  onPointHover,
  onPointHighlight,
  onRouteSelect,
  panelSize: externalPanelSize,
}) => {
  const [internalPanelSize, setInternalPanelSize] =
    useState<PanelSize>("normal");
  const [hoveredPoint, setHoveredPoint] = useState<MobileAirDataPoint | null>(
    null
  );

  // Callbacks optimisés pour éviter les re-renders
  const handleMouseMove = useCallback(
    (data: any) => {
      if (data && data.activePayload && data.activePayload[0]) {
        const point = data.activePayload[0].payload.point;
        setHoveredPoint(point);
        if (onPointHover) {
          onPointHover(point);
        }
        if (onPointHighlight) {
          onPointHighlight(point);
        }
      }
    },
    [onPointHover, onPointHighlight]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredPoint(null);
    if (onPointHover) {
      onPointHover(null);
    }
    if (onPointHighlight) {
      onPointHighlight(null);
    }
  }, [onPointHover, onPointHighlight]);

  // Utiliser la taille externe si fournie, sinon la taille interne
  const currentPanelSize = externalPanelSize || internalPanelSize;

  const handlePanelSizeChange = (newSize: PanelSize) => {
    if (onSizeChange) {
      onSizeChange(newSize);
    } else {
      setInternalPanelSize(newSize);
    }

    if (newSize === "hidden" && onHidden) {
      onHidden();
    }
  };

  // Fonction pour obtenir la clé du polluant dans les données
  const getPollutantKey = (pollutant: string): string => {
    const mapping: Record<string, string> = {
      pm1: "PM1",
      pm25: "PM25",
      pm10: "PM10",
    };
    return mapping[pollutant] || "PM25";
  };

  // Utiliser les fonctions centralisées pour la cohérence avec la légende

  // Préparer les données pour le graphique
  const prepareChartData = () => {
    const routeToUse = selectedRoute || activeRoute;
    if (!routeToUse) return [];

    const pollutantKey = getPollutantKey(selectedPollutant);

    return routeToUse.points
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      .map((point, index) => {
        const value = point[pollutantKey as keyof MobileAirDataPoint] as number;
        return {
          index,
          time: new Date(point.time).toLocaleString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          value: value || 0,
          color: getQualityColor(value || 0, selectedPollutant, pollutants),
          quality: getQualityLevel(value || 0, selectedPollutant, pollutants),
          point: point,
        };
      });
  };

  // Fonction pour formater la durée
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.round(minutes % 60);
      return `${hours}h ${remainingMinutes}min`;
    }
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fonction pour générer un identifiant unique pour un point
  const getPointId = (point: MobileAirDataPoint): string => {
    return `${point.sensorId}-${point.sessionId}-${
      point.time
    }-${point.lat.toFixed(6)}-${point.lon.toFixed(6)}`;
  };

  // Fonction pour comparer deux points avec une tolérance appropriée
  const isSamePoint = (
    point1: MobileAirDataPoint,
    point2: MobileAirDataPoint
  ): boolean => {
    // Comparaison d'abord par identifiant unique (plus fiable)
    if (
      point1.sensorId === point2.sensorId &&
      point1.sessionId === point2.sessionId &&
      point1.time === point2.time
    ) {
      return true;
    }

    // Fallback avec tolérance pour les coordonnées
    const COORDINATE_TOLERANCE = 0.0001; // Environ 10 mètres

    // Comparaison des coordonnées avec tolérance
    const latMatch = Math.abs(point1.lat - point2.lat) < COORDINATE_TOLERANCE;
    const lonMatch = Math.abs(point1.lon - point2.lon) < COORDINATE_TOLERANCE;

    // Comparaison des timestamps (plus flexible)
    const time1 = new Date(point1.time).getTime();
    const time2 = new Date(point2.time).getTime();
    const timeMatch = Math.abs(time1 - time2) < 1000; // Tolérance de 1 seconde

    return latMatch && lonMatch && timeMatch;
  };

  // Composant personnalisé pour les points du graphique
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const isHighlighted =
      highlightedPoint && isSamePoint(highlightedPoint, payload.point);

    const handleMouseEnter = () => {
      setHoveredPoint(payload.point);
      if (onPointHover) {
        onPointHover(payload.point);
      }
      if (onPointHighlight) {
        onPointHighlight(payload.point);
      }
    };

    const handleMouseLeave = () => {
      setHoveredPoint(null);
      if (onPointHover) {
        onPointHover(null);
      }
      if (onPointHighlight) {
        onPointHighlight(null);
      }
    };

    const handleClick = () => {
      console.log(
        "🖱️ Click sur point du graphique:",
        getPointId(payload.point)
      );
      if (onPointHighlight) {
        onPointHighlight(payload.point);
      }
    };

    return (
      <Dot
        cx={cx}
        cy={cy}
        r={isHighlighted ? 6 : 4}
        fill={payload.color}
        stroke={isHighlighted ? "#1D4ED8" : "#fff"}
        strokeWidth={isHighlighted ? 3 : 2}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{ cursor: "pointer" }}
      />
    );
  };

  const routeToUse = selectedRoute || activeRoute;
  if (!isOpen || !routeToUse) {
    return null;
  }

  // Vérifier si le polluant est supporté par MobileAir
  const isPollutantSupported = Object.values(
    MOBILEAIR_POLLUTANT_MAPPING
  ).includes(selectedPollutant);

  const chartData = prepareChartData();
  const pollutantConfig = pollutants[selectedPollutant];

  const getPanelClasses = () => {
    const baseClasses =
      "bg-white shadow-xl flex flex-col border-r border-gray-200 transition-all duration-300 h-[calc(100vh-70px)]";

    switch (currentPanelSize) {
      case "fullscreen":
        return `${baseClasses} w-full`;
      case "hidden":
        return `${baseClasses} w-0 overflow-hidden`;
      case "normal":
      default:
        // Responsive: plein écran sur mobile, largeur réduite pour les petits écrans en paysage
        return `${baseClasses} w-full sm:w-[350px] md:w-[450px] lg:w-[600px] xl:w-[650px]`;
    }
  };

  return (
    <div className={getPanelClasses()}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
            Session {routeToUse.sessionId}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 truncate">
            Capteur {routeToUse.sensorId} •{" "}
            {pollutantConfig?.name || selectedPollutant}
          </p>
        </div>

        {/* Contrôles de taille du panel */}
        <div className="hidden sm:flex items-center space-x-1 sm:space-x-2 mr-2">
          <button
            onClick={() => handlePanelSizeChange("normal")}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
              currentPanelSize === "normal"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
            title="Taille normale"
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
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>

          <button
            onClick={() => handlePanelSizeChange("fullscreen")}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
              currentPanelSize === "fullscreen"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
            title="Plein écran"
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
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>

          <button
            onClick={() => handlePanelSizeChange("hidden")}
            className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Masquer"
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

        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 sm:p-1 rounded-full hover:bg-gray-200 ml-2"
          title="Fermer"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
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
      {currentPanelSize !== "hidden" && (
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
          {/* Informations de la session */}
          <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">
              Informations de la session
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Début:</span>
                <p className="font-medium">
                  {formatDate(routeToUse.startTime)}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Fin:</span>
                <p className="font-medium">{formatDate(routeToUse.endTime)}</p>
              </div>
              <div>
                <span className="text-gray-600">Durée:</span>
                <p className="font-medium">
                  {formatDuration(routeToUse.duration)}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Points:</span>
                <p className="font-medium">{routeToUse.points.length}</p>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">
              Statistiques
            </h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center">
                <span className="text-gray-600 block">Moyenne</span>
                <p className="font-medium text-lg">
                  {routeToUse.averageValue.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">
                  {pollutantConfig?.unit || "µg/m³"}
                </p>
              </div>
              <div className="text-center">
                <span className="text-gray-600 block">Maximum</span>
                <p className="font-medium text-lg">
                  {routeToUse.maxValue.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">
                  {pollutantConfig?.unit || "µg/m³"}
                </p>
              </div>
              <div className="text-center">
                <span className="text-gray-600 block">Minimum</span>
                <p className="font-medium text-lg">
                  {routeToUse.minValue.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">
                  {pollutantConfig?.unit || "µg/m³"}
                </p>
              </div>
            </div>
          </div>

          {/* Graphique */}
          <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">
              Évolution temporelle
            </h3>
            {!isPollutantSupported ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="w-12 h-12 text-red-400 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Polluant non supporté
                  </h4>
                  <p className="text-xs text-red-600 mb-3">
                    Le polluant{" "}
                    <strong>
                      {pollutants[selectedPollutant]?.name || selectedPollutant}
                    </strong>{" "}
                    ne peut pas être affiché.
                  </p>
                  <div className="bg-red-50 rounded-md p-2">
                    <p className="text-xs text-red-700">
                      Seuls PM₁, PM₂.₅ et PM₁₀ sont supportés par MobileAir.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      label={{
                        value: pollutantConfig?.unit || "µg/m³",
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: "middle" },
                      }}
                    />
                    <Tooltip
                      formatter={(value: number, name: string, props: any) => [
                        `${value.toFixed(1)} ${
                          pollutantConfig?.unit || "µg/m³"
                        }`,
                        pollutantConfig?.name || selectedPollutant,
                      ]}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0] && payload[0].payload) {
                          const point = payload[0].payload.point;
                          return formatDate(point.time);
                        }
                        return label;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={<CustomDot />}
                      activeDot={false}
                      animationDuration={0}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Point mis en surbrillance */}
          {(highlightedPoint || hoveredPoint) && (
            <div className="border border-yellow-300 rounded-lg p-3 sm:p-4 bg-blue-50">
              <h3 className="text-sm font-medium text-yellow-800 mb-3 flex items-center">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                Point mis en surbrillance
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Heure:</span>
                  <p className="font-medium">
                    {formatDate((highlightedPoint || hoveredPoint)!.time)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Position:</span>
                  <p className="font-medium text-xs">
                    {(highlightedPoint || hoveredPoint)!.lat.toFixed(6)},{" "}
                    {(highlightedPoint || hoveredPoint)!.lon.toFixed(6)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Valeur:</span>
                  <p className="font-medium">
                    {(
                      (highlightedPoint || hoveredPoint)![
                        getPollutantKey(
                          selectedPollutant
                        ) as keyof MobileAirDataPoint
                      ] as number
                    )?.toFixed(1) || "N/A"}{" "}
                    {pollutantConfig?.unit || "µg/m³"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Niveau:</span>
                  <p
                    className="font-medium capitalize"
                    style={{
                      color: getQualityColor(
                        ((highlightedPoint || hoveredPoint)![
                          getPollutantKey(
                            selectedPollutant
                          ) as keyof MobileAirDataPoint
                        ] as number) || 0,
                        selectedPollutant,
                        pollutants
                      ),
                    }}
                  >
                    {getQualityLevel(
                      ((highlightedPoint || hoveredPoint)![
                        getPollutantKey(
                          selectedPollutant
                        ) as keyof MobileAirDataPoint
                      ] as number) || 0,
                      selectedPollutant,
                      pollutants
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Autres sessions disponibles */}
          {allRoutes.length > 1 && (
            <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">
                Autres sessions disponibles ({allRoutes.length - 1})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {allRoutes
                  .filter((route) => route.sessionId !== routeToUse.sessionId)
                  .sort(
                    (a, b) =>
                      new Date(b.startTime).getTime() -
                      new Date(a.startTime).getTime()
                  )
                  .map((route) => (
                    <button
                      key={route.sessionId}
                      onClick={() => onRouteSelect && onRouteSelect(route)}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">
                          Session {route.sessionId}
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatDate(route.startTime)} •{" "}
                          {formatDuration(route.duration)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {route.averageValue.toFixed(1)}{" "}
                          {pollutantConfig?.unit || "µg/m³"}
                        </div>
                        <div className="text-xs text-gray-600">
                          {route.points.length} points
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileAirDetailPanel;
