import React, { memo } from "react";
import { Polyline, CircleMarker } from "react-leaflet";
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

    // Fonction pour forcer les valeurs négatives à 0
    // Les concentrations de polluants ne peuvent pas être négatives
    const ensureNonNegativeValue = (value: number | undefined | null): number | undefined => {
      // Retourner undefined/null si la valeur n'est pas définie
      if (value === undefined || value === null) return undefined;
      // Vérifier que c'est un nombre valide et forcer les négatives à 0
      if (typeof value === "number" && !isNaN(value)) {
        return Math.max(0, value);
      }
      // Si ce n'est pas un nombre valide, retourner undefined
      return undefined;
    };

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
        const rawValue = currentPoint[
          pollutantKey as keyof typeof currentPoint
        ] as number;

        // Forcer les valeurs négatives à 0 avant de calculer les couleurs
        const correctedValue = ensureNonNegativeValue(rawValue);
        if (correctedValue !== undefined) {
          const color = getQualityColor(correctedValue, selectedPollutant, pollutants);
          const quality = getQualityLevel(correctedValue, selectedPollutant, pollutants);

          segments.push({
            positions: [
              [currentPoint.lat, currentPoint.lon],
              [nextPoint.lat, nextPoint.lon],
            ],
            color,
            quality,
            value: correctedValue,
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
                const rawValue = point[
                  pollutantKey as keyof MobileAirDataPoint
                ] as number;
                // Forcer les valeurs négatives à 0 avant de calculer les couleurs
                const correctedValue = ensureNonNegativeValue(rawValue) || 0;
                const color = getQualityColor(
                  correctedValue,
                  selectedPollutant,
                  pollutants
                );
                const quality = getQualityLevel(
                  correctedValue,
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
                    />
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
