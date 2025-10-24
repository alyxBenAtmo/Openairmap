import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import { MeasurementDevice } from "../types";

interface UseCustomSpiderfierProps {
  devices: MeasurementDevice[];
  enabled: boolean;
  nearbyDistance?: number;
  zoomThreshold?: number;
}

export const useCustomSpiderfier = ({
  devices,
  enabled,
  nearbyDistance = 20,
  zoomThreshold = 12,
}: UseCustomSpiderfierProps) => {
  const map = useMap();
  const [spiderfiedMarkers, setSpiderfiedMarkers] = useState<Map<string, any>>(
    new Map()
  );
  const [groupCenters, setGroupCenters] = useState<
    Map<number, [number, number]>
  >(new Map());
  const [currentZoom, setCurrentZoom] = useState<number>(map?.getZoom() || 0);
  const markerRefs = useRef<Map<string, any>>(new Map());

  // Écouter les changements de zoom
  useEffect(() => {
    if (!map) return;

    const handleZoomEnd = () => {
      const zoom = map.getZoom();
      setCurrentZoom(zoom);
    };

    map.on("zoomend", handleZoomEnd);

    // Initialiser le zoom actuel
    setCurrentZoom(map.getZoom());

    return () => {
      map.off("zoomend", handleZoomEnd);
    };
  }, [map, zoomThreshold]);

  useEffect(() => {
    if (!enabled || !map || devices.length === 0) return;

    // Vérifier si le zoom est suffisant pour activer le spiderfier
    const shouldSpiderfy = currentZoom >= zoomThreshold;

    if (!shouldSpiderfy) {
      // Désactiver le spiderfier si le zoom n'est pas suffisant
      setSpiderfiedMarkers(new Map());
      setGroupCenters(new Map());
      return;
    }

    // Fonction pour calculer la distance entre deux points en pixels
    const getDistanceInPixels = (
      lat1: number,
      lng1: number,
      lat2: number,
      lng2: number
    ) => {
      const point1 = map.latLngToLayerPoint([lat1, lng1]);
      const point2 = map.latLngToLayerPoint([lat2, lng2]);
      return Math.sqrt(
        Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)
      );
    };

    // Fonction pour générer des positions en spirale
    const generateSpiralPositions = (
      centerLat: number,
      centerLng: number,
      count: number
    ) => {
      const positions = [];
      const angleStep = (2 * Math.PI) / count;
      const radius = 0.001; // Rayon en degrés

      for (let i = 0; i < count; i++) {
        const angle = i * angleStep;
        const lat = centerLat + radius * Math.cos(angle);
        const lng = centerLng + radius * Math.sin(angle);
        positions.push([lat, lng]);
      }
      return positions;
    };

    // Analyser les marqueurs qui se chevauchent
    const analyzeOverlappingMarkers = () => {
      const overlappingGroups: MeasurementDevice[][] = [];
      const processed = new Set<string>();

      devices.forEach((device, index) => {
        if (processed.has(device.id)) return;

        const group = [device];
        processed.add(device.id);

        // Trouver tous les marqueurs proches
        devices.forEach((otherDevice, otherIndex) => {
          if (otherIndex === index || processed.has(otherDevice.id)) return;

          const distance = getDistanceInPixels(
            device.latitude,
            device.longitude,
            otherDevice.latitude,
            otherDevice.longitude
          );

          // Seuil plus strict : seulement si les marqueurs sont vraiment proches
          if (distance < nearbyDistance) {
            // Vérification supplémentaire : s'assurer que les marqueurs se chevauchent visuellement
            const isReallyOverlapping = distance < nearbyDistance * 0.7; // 70% du seuil pour être plus strict

            if (isReallyOverlapping) {
              group.push(otherDevice);
              processed.add(otherDevice.id);
            }
          }
        });

        // Seulement créer un groupe si on a au moins 2 marqueurs ET qu'ils sont vraiment proches
        if (group.length > 1) {
          // Vérification finale : s'assurer que tous les marqueurs du groupe sont vraiment proches les uns des autres
          let allClose = true;
          for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
              const dist = getDistanceInPixels(
                group[i].latitude,
                group[i].longitude,
                group[j].latitude,
                group[j].longitude
              );
              if (dist > nearbyDistance) {
                allClose = false;
                break;
              }
            }
            if (!allClose) break;
          }

          if (allClose) {
            overlappingGroups.push(group);
          }
        }
      });

      return overlappingGroups;
    };

    // Traiter les groupes qui se chevauchent
    const processOverlappingGroups = (groups: MeasurementDevice[][]) => {
      const newSpiderfiedMarkers = new Map<string, any>();
      const newGroupCenters = new Map<number, [number, number]>();

      groups.forEach((group, groupIndex) => {
        if (group.length < 2) return;

        // Calculer le centre du groupe
        const centerLat =
          group.reduce((sum, device) => sum + device.latitude, 0) /
          group.length;
        const centerLng =
          group.reduce((sum, device) => sum + device.longitude, 0) /
          group.length;

        // Stocker le centre du groupe
        newGroupCenters.set(groupIndex, [centerLat, centerLng]);

        // Générer des positions en spirale
        const spiralPositions = generateSpiralPositions(
          centerLat,
          centerLng,
          group.length
        );

        group.forEach((device, deviceIndex) => {
          const newPosition = spiralPositions[deviceIndex];
          newSpiderfiedMarkers.set(device.id, {
            originalPosition: [device.latitude, device.longitude],
            spiderfiedPosition: newPosition,
            device: device,
            groupIndex: groupIndex,
          });
        });
      });

      setSpiderfiedMarkers(newSpiderfiedMarkers);
      setGroupCenters(newGroupCenters);
    };

    // Analyser et traiter les marqueurs
    const groups = analyzeOverlappingMarkers();
    processOverlappingGroups(groups);
  }, [enabled, map, devices, nearbyDistance, currentZoom, zoomThreshold]);

  // Fonction pour obtenir la position d'un marqueur (originale ou éclatée)
  const getMarkerPosition = (device: MeasurementDevice) => {
    const spiderfiedData = spiderfiedMarkers.get(device.id);
    if (spiderfiedData) {
      return spiderfiedData.spiderfiedPosition;
    }
    return [device.latitude, device.longitude];
  };

  // Fonction pour vérifier si un marqueur est éclaté
  const isMarkerSpiderfied = (device: MeasurementDevice) => {
    return spiderfiedMarkers.has(device.id);
  };

  // Fonction pour obtenir les données d'éclatement d'un marqueur
  const getSpiderfiedData = (device: MeasurementDevice) => {
    return spiderfiedMarkers.get(device.id);
  };

  return {
    getMarkerPosition,
    isMarkerSpiderfied,
    getSpiderfiedData,
    spiderfiedMarkers: Array.from(spiderfiedMarkers.values()),
    groupCenters: Array.from(groupCenters.entries()),
  };
};
