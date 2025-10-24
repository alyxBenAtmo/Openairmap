import React, { useEffect, useRef } from "react";
import { Marker, Polyline, CircleMarker } from "react-leaflet";
import { MeasurementDevice } from "../../types";
import { useCustomSpiderfier } from "../../hooks/useCustomSpiderfier";

interface CustomSpiderfiedMarkersProps {
  devices: MeasurementDevice[];
  createCustomIcon: (device: MeasurementDevice) => any;
  handleMarkerClick: (device: MeasurementDevice) => void;
  enabled: boolean;
  nearbyDistance?: number;
  zoomThreshold?: number;
}

const CustomSpiderfiedMarkers: React.FC<CustomSpiderfiedMarkersProps> = ({
  devices,
  createCustomIcon,
  handleMarkerClick,
  enabled,
  nearbyDistance = 20,
  zoomThreshold = 12,
}) => {
  const markerRefs = useRef<Map<string, any>>(new Map());
  const {
    getMarkerPosition,
    isMarkerSpiderfied,
    getSpiderfiedData,
    spiderfiedMarkers,
    groupCenters,
  } = useCustomSpiderfier({
    devices,
    enabled,
    nearbyDistance,
    zoomThreshold,
  });

  return (
    <>
      {/* Marqueurs normaux ou éclatés */}
      {devices.map((device) => {
        const position = getMarkerPosition(device);
        const isSpiderfied = isMarkerSpiderfied(device);
        const spiderfiedData = getSpiderfiedData(device);

        return (
          <React.Fragment key={device.id}>
            <Marker
              position={position}
              icon={createCustomIcon(device)}
              eventHandlers={{
                click: () => handleMarkerClick(device),
              }}
              ref={(marker) => {
                if (marker) {
                  markerRefs.current.set(device.id, marker);
                } else {
                  markerRefs.current.delete(device.id);
                }
              }}
            />

            {/* Trait de connexion pour les marqueurs éclatés */}
            {isSpiderfied && spiderfiedData && (
              <Polyline
                positions={[
                  spiderfiedData.originalPosition,
                  spiderfiedData.spiderfiedPosition,
                ]}
                color="#3388ff"
                weight={2}
                opacity={0.8}
                dashArray="5, 5"
                interactive={false}
              />
            )}
          </React.Fragment>
        );
      })}

      {/* Points centraux pour indiquer l'emplacement initial des groupes éclatés */}
      {groupCenters.map(([groupIndex, centerPosition]) => (
        <CircleMarker
          key={`center-${groupIndex}`}
          center={centerPosition}
          radius={3}
          color="#3388ff"
          weight={1}
          opacity={0.6}
          fillColor="#3388ff"
          fillOpacity={0.4}
          interactive={false}
        />
      ))}
    </>
  );
};

export default CustomSpiderfiedMarkers;
