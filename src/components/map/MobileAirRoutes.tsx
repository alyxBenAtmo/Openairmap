import React, { memo } from "react";
import { Polyline, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import {
  MobileAirRoute,
  MeasurementDevice,
  MobileAirDataPoint,
  MOBILEAIR_POLLUTANT_MAPPING,
} from "../../types";
import { pollutants } from "../../constants/pollutants";
import {
  getQualityColor,
  getQualityLevel,
} from "../../constants/qualityColors";

interface MobileAirRoutesProps {
  routes: MobileAirRoute[];
  selectedPollutant: string;
  onPointClick?: (route: MobileAirRoute, point: MobileAirDataPoint) => void;
  onPointHover?: (point: MobileAirDataPoint | null) => void;
  onRouteClick?: (route: MobileAirRoute) => void;
  highlightedPoint?: MobileAirDataPoint | null;
}

const MobileAirRoutes: React.FC<MobileAirRoutesProps> = memo(
  ({
    routes,
    selectedPollutant,
    onPointClick,
    onPointHover,
    onRouteClick,
    highlightedPoint,
  }) => {
    // Vérifier si le polluant est supporté par MobileAir
    const isPollutantSupported = Object.values(
      MOBILEAIR_POLLUTANT_MAPPING
    ).includes(selectedPollutant);

    // Si le polluant n'est pas supporté, ne rien afficher
    if (!isPollutantSupported) {
      return null;
    }
    // Fonction pour générer un identifiant unique pour un point
    const getPointId = (point: MobileAirDataPoint): string => {
      return `${point.sensorId}-${point.sessionId}-${
        point.time
      }-${point.lat.toFixed(6)}-${point.lon.toFixed(6)}`;
    };

    // Fonction pour comparer deux points avec une tolérance appropriée (optimisée)
    const isSamePoint = (
      point1: MobileAirDataPoint,
      point2: MobileAirDataPoint
    ): boolean => {
      // Comparaison rapide par identifiant unique (plus fiable et plus rapide)
      return (
        point1.sensorId === point2.sensorId &&
        point1.sessionId === point2.sessionId &&
        point1.time === point2.time
      );
    };
    // Utiliser les fonctions centralisées pour la cohérence avec la légende

    // Fonction pour créer des segments colorés pour un parcours
    const createColoredSegments = (route: MobileAirRoute) => {
      const segments: Array<{
        positions: [number, number][];
        color: string;
        quality: string;
        value: number;
      }> = [];

      // Trier les points par timestamp pour s'assurer de l'ordre
      const sortedPoints = [...route.points].sort(
        (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
      );

      // Créer des segments entre chaque point consécutif
      for (let i = 0; i < sortedPoints.length - 1; i++) {
        const currentPoint = sortedPoints[i];
        const nextPoint = sortedPoints[i + 1];

        // Obtenir la valeur du polluant pour le point actuel
        const pollutantKey = getPollutantKey(selectedPollutant);
        const value = currentPoint[
          pollutantKey as keyof typeof currentPoint
        ] as number;

        if (value != null && !isNaN(value)) {
          const color = getQualityColor(value, selectedPollutant, pollutants);
          const quality = getQualityLevel(value, selectedPollutant, pollutants);

          segments.push({
            positions: [
              [currentPoint.lat, currentPoint.lon],
              [nextPoint.lat, nextPoint.lon],
            ],
            color,
            quality,
            value,
          });
        }
      }

      return segments;
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

    return (
      <>
        {routes.map((route) => {
          const segments = createColoredSegments(route);
          const pollutantConfig = pollutants[selectedPollutant];

          return (
            <React.Fragment key={`${route.sensorId}-${route.sessionId}`}>
              {/* Lignes de connexion entre les points */}
              {segments.map((segment, index) => (
                <Polyline
                  key={`${route.sensorId}-${route.sessionId}-${index}`}
                  positions={segment.positions}
                  color={segment.color}
                  weight={3}
                  opacity={0.6}
                  smoothFactor={1}
                />
              ))}

              {/* Points cliquables */}
              {route.points.map((point, index) => {
                const pollutantKey = getPollutantKey(selectedPollutant);
                const value = point[
                  pollutantKey as keyof MobileAirDataPoint
                ] as number;
                const color = getQualityColor(
                  value || 0,
                  selectedPollutant,
                  pollutants
                );
                const quality = getQualityLevel(
                  value || 0,
                  selectedPollutant,
                  pollutants
                );

                // Vérifier si ce point est mis en évidence
                const isHighlighted =
                  highlightedPoint && isSamePoint(highlightedPoint, point);

                // Debug simplifié - seulement pour les points mis en surbrillance
                if (isHighlighted) {
                  console.log(
                    "🎨 Point mis en surbrillance:",
                    getPointId(point),
                    "radius:",
                    10
                  );
                }

                return (
                  <React.Fragment
                    key={`${route.sensorId}-${route.sessionId}-point-${index}`}
                  >
                    {/* Ombre portée pour le point mis en évidence */}
                    {isHighlighted && (
                      <CircleMarker
                        center={[point.lat, point.lon]}
                        radius={18}
                        pathOptions={{
                          color: "rgba(0, 0, 0, 0.2)",
                          fillColor: "rgba(0, 0, 0, 0.1)",
                          fillOpacity: 0.3,
                          weight: 0,
                          opacity: 0.6,
                        }}
                      />
                    )}

                    {/* Point principal */}
                    <CircleMarker
                      center={[point.lat, point.lon]}
                      radius={isHighlighted ? 12 : 6}
                      pathOptions={{
                        color: isHighlighted ? "#FFFFFF" : color, // Bordure blanche pour le point mis en évidence
                        fillColor: color, // Garder la couleur de qualité
                        fillOpacity: isHighlighted ? 0.9 : 0.8,
                        weight: isHighlighted ? 3 : 2, // Bordure plus épaisse pour la mise en évidence
                        opacity: 1,
                      }}
                      eventHandlers={{
                        click: () => {
                          console.log(
                            "🖱️ Click sur point de la carte:",
                            getPointId(point)
                          );
                          if (onPointClick) {
                            onPointClick(route, point);
                          }
                        },
                        mouseover: () => {
                          console.log(
                            "🖱️ Mouse over sur point de la carte:",
                            getPointId(point)
                          );
                          if (onPointHover) {
                            onPointHover(point);
                          }
                        },
                        mouseout: () => {
                          console.log("🖱️ Mouse out sur point de la carte");
                          if (onPointHover) {
                            onPointHover(null);
                          }
                        },
                      }}
                    >
                      <Popup>
                        <div className="p-2 min-w-[200px]">
                          <div className="mb-2">
                            <h3 className="font-semibold text-gray-900 text-sm">
                              Point {index + 1} - Session {route.sessionId}
                            </h3>
                          </div>

                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Polluant:</span>
                              <span className="font-medium">
                                {pollutantConfig?.name || selectedPollutant}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-600">Valeur:</span>
                              <span className="font-medium">
                                {(value || 0).toFixed(1)}{" "}
                                {pollutantConfig?.unit || "µg/m³"}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-600">Niveau:</span>
                              <span
                                className="font-medium capitalize"
                                style={{ color: color }}
                              >
                                {quality}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-600">Heure:</span>
                              <span className="font-medium">
                                {formatDate(point.time)}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-600">Position:</span>
                              <span className="font-medium text-xs">
                                {point.lat.toFixed(6)}, {point.lon.toFixed(6)}
                              </span>
                            </div>

                            <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                              <button
                                onClick={() => {
                                  if (onPointClick) {
                                    onPointClick(route, point);
                                  }
                                }}
                                className="w-full px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                              >
                                Voir le graphique de la session
                              </button>
                              {onRouteClick && (
                                <button
                                  onClick={() => {
                                    onRouteClick(route);
                                  }}
                                  className="w-full px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                                >
                                  Sélectionner cette session
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}
      </>
    );
  }
);

MobileAirRoutes.displayName = "MobileAirRoutes";

export default MobileAirRoutes;
