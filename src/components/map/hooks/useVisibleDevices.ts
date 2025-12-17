import { useEffect, useState, useCallback } from "react";
import L from "leaflet";
import { MeasurementDevice, SignalAirReport } from "../../../types";

interface UseVisibleDevicesProps {
  mapRef: React.RefObject<L.Map | null>;
  devices: MeasurementDevice[];
  reports: SignalAirReport[];
  debounceMs?: number;
}

/**
 * Hook personnalisé pour filtrer les appareils et signalements visibles dans le viewport de la carte
 * @param mapRef - Référence à l'instance de la carte Leaflet
 * @param devices - Liste de tous les appareils
 * @param reports - Liste de tous les signalements
 * @param debounceMs - Délai de debounce pour les mises à jour (défaut: 100ms)
 * @returns Objet contenant les appareils et signalements visibles, ainsi que des statistiques
 */
export const useVisibleDevices = ({
  mapRef,
  devices,
  reports,
  debounceMs = 100,
}: UseVisibleDevicesProps) => {
  const [visibleDevices, setVisibleDevices] = useState<MeasurementDevice[]>([]);
  const [visibleReports, setVisibleReports] = useState<SignalAirReport[]>([]);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);

  // Fonction pour vérifier si un point est dans les limites de la carte
  const isPointInBounds = useCallback(
    (lat: number, lng: number, bounds: L.LatLngBounds): boolean => {
      return bounds.contains([lat, lng]);
    },
    []
  );

  // Fonction pour mettre à jour les appareils visibles
  const updateVisibleDevices = useCallback(() => {
    if (!mapRef.current) {
      setVisibleDevices([]);
      setVisibleReports([]);
      setMapBounds(null);
      return;
    }

    const bounds = mapRef.current.getBounds();
    setMapBounds(bounds);

    // Filtrer les appareils visibles
    const visible = devices.filter((device) =>
      isPointInBounds(device.latitude, device.longitude, bounds)
    );
    setVisibleDevices(visible);

    // Filtrer les signalements visibles
    const visibleReps = reports.filter((report) =>
      isPointInBounds(report.latitude, report.longitude, bounds)
    );
    setVisibleReports(visibleReps);
  }, [mapRef, devices, reports, isPointInBounds]);

  // Effet pour écouter les changements de vue de la carte
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Mise à jour initiale
    updateVisibleDevices();

    // Debounce pour optimiser les performances
    let debounceTimer: NodeJS.Timeout | null = null;

    const handleMapMove = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        updateVisibleDevices();
      }, debounceMs);
    };

    // Écouter les événements de mouvement de la carte
    map.on("moveend", handleMapMove);
    map.on("zoomend", handleMapMove);
    map.on("resize", handleMapMove);

    // Nettoyage
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      map.off("moveend", handleMapMove);
      map.off("zoomend", handleMapMove);
      map.off("resize", handleMapMove);
    };
  }, [mapRef, updateVisibleDevices, debounceMs]);

  // Mettre à jour quand les listes d'appareils ou signalements changent
  useEffect(() => {
    updateVisibleDevices();
  }, [devices, reports, updateVisibleDevices]);

  // Calculer les statistiques des appareils visibles
  const statistics = {
    totalDevices: visibleDevices.length,
    totalReports: visibleReports.length,
    devicesBySource: visibleDevices.reduce((acc, device) => {
      acc[device.source] = (acc[device.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    reportsByType: visibleReports.reduce((acc, report) => {
      acc[report.signalType] = (acc[report.signalType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    qualityLevels: visibleDevices.reduce((acc, device) => {
      const level = device.qualityLevel || "default";
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    averageValue:
      visibleDevices.length > 0
        ? visibleDevices.reduce((sum, device) => sum + device.value, 0) /
          visibleDevices.length
        : 0,
    minValue:
      visibleDevices.length > 0
        ? Math.min(...visibleDevices.map((device) => device.value))
        : 0,
    maxValue:
      visibleDevices.length > 0
        ? Math.max(...visibleDevices.map((device) => device.value))
        : 0,
    activeDevices: visibleDevices.filter(
      (device) => device.status === "active"
    ).length,
    inactiveDevices: visibleDevices.filter(
      (device) => device.status !== "active"
    ).length,
  };

  return {
    visibleDevices,
    visibleReports,
    mapBounds,
    statistics,
    updateVisibleDevices,
  };
};
