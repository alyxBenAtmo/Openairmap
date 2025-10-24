import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { MeasurementDevice } from "../types";
import "overlapping-marker-spiderfier-leaflet";

interface UseSpiderfierProps {
  devices: MeasurementDevice[];
  enabled: boolean;
  nearbyDistance?: number;
  keepSpiderfied?: boolean;
}

export const useSpiderfier = ({
  devices,
  enabled,
  nearbyDistance = 20,
  keepSpiderfied = true,
}: UseSpiderfierProps) => {
  const map = useMap();
  const omsRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!enabled || !map) return;

    // Nettoyer l'ancien spiderfier s'il existe
    if (omsRef.current && typeof omsRef.current.clearMarkers === "function") {
      omsRef.current.clearMarkers();
    }

    try {
      // Accéder à la classe via window
      const OverlappingMarkerSpiderfier = (window as any)
        .OverlappingMarkerSpiderfier;

      if (!OverlappingMarkerSpiderfier) {
        throw new Error(
          "OverlappingMarkerSpiderfier not found on window object"
        );
      }

      // Créer une nouvelle instance
      omsRef.current = new OverlappingMarkerSpiderfier(map, {
        keepSpiderfied,
        nearbyDistance,
        circleSpiralSwitchover: 9,
        spiralLengthStart: 11,
        spiralLengthFactor: 4,
        spiralFootSeparation: 28,
        circleFootSeparation: 23,
        maxCircleFootprints: 8,
        legWeight: 1.5,
        legColors: {
          usual: "#222",
          highlighted: "#f00",
        },
      });

      // Ajouter les marqueurs
      markersRef.current.forEach((marker) => {
        omsRef.current.addMarker(marker);
      });
    } catch (error) {
      console.error("Erreur lors de l'initialisation du spiderfier:", error);
    }

    // Nettoyer à la destruction
    return () => {
      if (omsRef.current && typeof omsRef.current.clearMarkers === "function") {
        omsRef.current.clearMarkers();
        omsRef.current = null;
      }
    };
  }, [enabled, map, nearbyDistance, keepSpiderfied]);

  // Fonction pour ajouter un marqueur au spiderfier
  const addMarker = (marker: any) => {
    if (
      omsRef.current &&
      enabled &&
      typeof omsRef.current.addMarker === "function"
    ) {
      omsRef.current.addMarker(marker);
      markersRef.current.push(marker);
    }
  };

  // Fonction pour supprimer un marqueur du spiderfier
  const removeMarker = (marker: any) => {
    if (
      omsRef.current &&
      enabled &&
      typeof omsRef.current.removeMarker === "function"
    ) {
      omsRef.current.removeMarker(marker);
      markersRef.current = markersRef.current.filter((m) => m !== marker);
    }
  };

  // Fonction pour nettoyer tous les marqueurs
  const clearMarkers = () => {
    if (omsRef.current && typeof omsRef.current.clearMarkers === "function") {
      omsRef.current.clearMarkers();
      markersRef.current = [];
    }
  };

  return {
    addMarker,
    removeMarker,
    clearMarkers,
    isEnabled: enabled && omsRef.current !== null,
  };
};
