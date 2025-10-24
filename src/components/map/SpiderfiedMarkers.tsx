import React, { useEffect, useRef } from "react";
import { Marker } from "react-leaflet";
import { MeasurementDevice } from "../../types";
import { useSpiderfier } from "../../hooks/useSpiderfier";

interface SpiderfiedMarkersProps {
  devices: MeasurementDevice[];
  createCustomIcon: (device: MeasurementDevice) => any;
  handleMarkerClick: (device: MeasurementDevice) => void;
  enabled: boolean;
  nearbyDistance?: number;
}

const SpiderfiedMarkers: React.FC<SpiderfiedMarkersProps> = ({
  devices,
  createCustomIcon,
  handleMarkerClick,
  enabled,
  nearbyDistance = 20,
}) => {
  const markerRefs = useRef<Map<string, any>>(new Map());
  const { addMarker, removeMarker, clearMarkers } = useSpiderfier({
    devices,
    enabled,
    nearbyDistance,
    keepSpiderfied: true, // Toujours garder les marqueurs éclatés
  });

  // Nettoyer les marqueurs quand le composant se démonte ou quand les devices changent
  useEffect(() => {
    return () => {
      clearMarkers();
    };
  }, [clearMarkers]);

  // Gérer l'ajout/suppression des marqueurs
  useEffect(() => {
    if (!enabled) return;

    // Nettoyer les anciens marqueurs
    clearMarkers();
    markerRefs.current.clear();

    // Ajouter les nouveaux marqueurs
    devices.forEach((device) => {
      const marker = markerRefs.current.get(device.id);
      if (marker) {
        addMarker(marker);
      }
    });
  }, [devices, enabled, addMarker, clearMarkers]);

  return (
    <>
      {devices.map((device) => (
        <Marker
          key={device.id}
          position={[device.latitude, device.longitude]}
          icon={createCustomIcon(device)}
          eventHandlers={{
            click: () => handleMarkerClick(device),
          }}
          ref={(marker) => {
            if (marker) {
              markerRefs.current.set(device.id, marker);
              if (enabled) {
                addMarker(marker);
              }
            } else {
              // Marqueur supprimé
              const oldMarker = markerRefs.current.get(device.id);
              if (oldMarker && enabled) {
                removeMarker(oldMarker);
              }
              markerRefs.current.delete(device.id);
            }
          }}
        />
      ))}
    </>
  );
};

export default SpiderfiedMarkers;
