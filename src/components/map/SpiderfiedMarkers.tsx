import React, { useEffect, useRef, useMemo } from "react";
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

// Fonction pour normaliser et comparer les positions géographiques
// Utilise une précision de 9 décimales (environ 0.11 mm de précision)
// Cette précision garantit que seules les positions vraiment identiques sont regroupées
const normalizeCoordinate = (coord: number): number => {
  // Arrondir à 9 décimales pour éviter les problèmes de précision des nombres flottants
  return Math.round(coord * 1000000000) / 1000000000;
};

// Fonction pour créer une clé de position normalisée
const getPositionKey = (lat: number, lng: number): string => {
  const normalizedLat = normalizeCoordinate(lat);
  const normalizedLng = normalizeCoordinate(lng);
  return `${normalizedLat},${normalizedLng}`;
};

const SpiderfiedMarkers: React.FC<SpiderfiedMarkersProps> = ({
  devices,
  createCustomIcon,
  handleMarkerClick,
  enabled,
  nearbyDistance = 20,
}) => {
  const markerRefs = useRef<Map<string, any>>(new Map());

  // Grouper les devices par position exacte (lat, lng) avec comparaison numérique robuste
  const devicesByPosition = useMemo(() => {
    const groups = new Map<string, MeasurementDevice[]>();
    devices.forEach((device) => {
      // Utiliser une clé normalisée pour éviter les problèmes de précision flottante
      const key = getPositionKey(device.latitude, device.longitude);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(device);
    });
    return groups;
  }, [devices]);

  // Déterminer quels devices doivent être spiderfiés (seulement ceux avec position exacte identique)
  const devicesToSpiderfy = useMemo(() => {
    const result: MeasurementDevice[] = [];
    devicesByPosition.forEach((group) => {
      // Seulement spiderfier si plus d'un device à la même position exacte
      if (group.length > 1) {
        result.push(...group);
      }
    });
    return result;
  }, [devicesByPosition]);

  // Créer un Set des IDs des devices à spiderfier pour une vérification efficace
  const devicesToSpiderfyIds = useMemo(() => {
    return new Set(devicesToSpiderfy.map((device) => device.id));
  }, [devicesToSpiderfy]);

  const { addMarker, removeMarker, clearMarkers } = useSpiderfier({
    devices: devicesToSpiderfy,
    enabled,
    // nearbyDistance: 0 signifie que la bibliothèque ne regroupera que les marqueurs
    // exactement au même pixel. Mais comme nous avons déjà filtré les devices
    // par position géographique exacte ci-dessus, seuls les marqueurs avec
    // les mêmes coordonnées seront ajoutés au spiderfier.
    nearbyDistance: 0,
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

    // Ajouter uniquement les marqueurs des devices qui doivent être spiderfiés
    devicesToSpiderfy.forEach((device) => {
      const marker = markerRefs.current.get(device.id);
      if (marker) {
        addMarker(marker);
      }
    });
  }, [devicesToSpiderfy, enabled, addMarker, clearMarkers]);

  return (
    <>
      {devices.map((device) => (
        <Marker
          key={device.id}
          position={[device.latitude, device.longitude]}
          icon={createCustomIcon(device)}
          eventHandlers={{
            click: (e: L.LeafletMouseEvent) => {
              handleMarkerClick(device);
            },
          }}
          ref={(marker) => {
            if (marker) {
              markerRefs.current.set(device.id, marker);
              // Ajouter au spiderfier seulement si le device fait partie de ceux à spiderfier
              if (enabled && devicesToSpiderfyIds.has(device.id)) {
                addMarker(marker);
              }
            } else {
              // Marqueur supprimé
              const oldMarker = markerRefs.current.get(device.id);
              if (oldMarker && enabled && devicesToSpiderfyIds.has(device.id)) {
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
