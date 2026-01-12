import React, { useEffect, useRef, useCallback } from "react";
import { Marker, Polyline, CircleMarker } from "react-leaflet";
import L from "leaflet";
import { MeasurementDevice } from "../../types";
import { useCustomSpiderfier } from "../../hooks/useCustomSpiderfier";

interface CustomSpiderfiedMarkersProps {
  devices: MeasurementDevice[];
  createCustomIcon: (device: MeasurementDevice) => any;
  handleMarkerClick: (device: MeasurementDevice) => void;
  enabled: boolean;
  nearbyDistance?: number;
  zoomThreshold?: number;
  getMarkerKey?: (device: MeasurementDevice) => string;
  onMarkerHover?: (device: MeasurementDevice, event: L.LeafletMouseEvent) => void;
  onMarkerHoverOut?: () => void;
  onMarkerClick?: (device: MeasurementDevice) => void;
}

const CustomSpiderfiedMarkers: React.FC<CustomSpiderfiedMarkersProps> = ({
  devices,
  createCustomIcon,
  handleMarkerClick,
  enabled,
  nearbyDistance = 20,
  zoomThreshold = 12,
  getMarkerKey,
  onMarkerHover,
  onMarkerHoverOut,
  onMarkerClick,
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

  // Mettre à jour la position des marqueurs éclatés manuellement et réattacher les eventHandlers
  useEffect(() => {
    markerRefs.current.forEach((marker, deviceId) => {
      if (!marker) return;
      
      const device = devices.find(d => d.id === deviceId);
      if (!device) return;
      
      const newPosition = getMarkerPosition(device);
      const leafletMarker = (marker as any).leafletElement || marker;
      
      if (!leafletMarker || typeof leafletMarker.setLatLng !== 'function') return;
      
      const currentLatLng = leafletMarker.getLatLng();
      const newLatLng = L.latLng(newPosition[0], newPosition[1]);
      
      // Mettre à jour la position seulement si elle a changé
      if (!currentLatLng || !currentLatLng.equals(newLatLng)) {
        // Supprimer les anciens eventHandlers
        leafletMarker.off('click');
        
        // Mettre à jour la position
        leafletMarker.setLatLng(newLatLng);
        
        // Réattacher les eventHandlers après la mise à jour de position
        leafletMarker.on('click', (e: L.LeafletMouseEvent) => {
          console.log(`🖱️ [CustomSpiderfiedMarkers] Clic détecté (via Leaflet natif après setLatLng) sur marqueur: ${deviceId} (source: ${device.source})`, {
            device,
            event: e,
            isSpiderfied: isMarkerSpiderfied(device),
            position: newPosition,
            timestamp: new Date().toISOString(),
          });
          
          // Empêcher la propagation
          e.originalEvent?.stopPropagation?.();
          
          // Masquer le tooltip lors du clic si la fonction est fournie
          if (onMarkerClick) {
            console.log(`🔄 [CustomSpiderfiedMarkers] Appel onMarkerClick pour ${deviceId}`);
            onMarkerClick(device);
          }
          
          console.log(`🔄 [CustomSpiderfiedMarkers] Appel handleMarkerClick pour ${deviceId}`);
          handleMarkerClick(device);
        });
      }
    });
  }, [devices, getMarkerPosition, spiderfiedMarkers, handleMarkerClick, onMarkerClick, isMarkerSpiderfied]);

  // Mémoriser les eventHandlers pour éviter les re-renders inutiles
  // Ce handler est utilisé pour les marqueurs NON-ÉCLATÉS (React-Leaflet eventHandlers)
  const clickHandler = useCallback((device: MeasurementDevice) => (e: L.LeafletMouseEvent) => {
    console.log(`🖱️ [CustomSpiderfiedMarkers] Clic détecté (React-Leaflet) sur marqueur: ${device.id} (source: ${device.source})`, {
      device,
      event: e,
      isSpiderfied: false, // Les marqueurs non-éclatés utilisent ce handler
      position: getMarkerPosition(device),
      timestamp: new Date().toISOString(),
    });
    
    // Empêcher la propagation pour éviter les conflits
    e.originalEvent?.stopPropagation?.();
    
    // Masquer le tooltip lors du clic si la fonction est fournie
    if (onMarkerClick) {
      console.log(`🔄 [CustomSpiderfiedMarkers] Appel onMarkerClick pour ${device.id}`);
      onMarkerClick(device);
    }
    
    console.log(`🔄 [CustomSpiderfiedMarkers] Appel handleMarkerClick pour ${device.id}`);
    handleMarkerClick(device);
  }, [handleMarkerClick, onMarkerClick, getMarkerPosition]);

  return (
    <>
      {/* Marqueurs normaux ou éclatés */}
      {devices.map((device) => {
        const position = getMarkerPosition(device);
        const isSpiderfied = isMarkerSpiderfied(device);
        const spiderfiedData = getSpiderfiedData(device);
        const markerKey = getMarkerKey ? getMarkerKey(device) : device.id;

        // Log pour debug du zoom et vérification des sources
        if (isSpiderfied && spiderfiedData) {
          console.log(`🕷️ [CustomSpiderfiedMarkers] Marqueur éclaté: ${device.id} (source: ${device.source})`, {
            originalPosition: spiderfiedData.originalPosition,
            spiderfiedPosition: spiderfiedData.spiderfiedPosition,
            currentPosition: position,
            source: device.source, // Ajout du source pour vérification
          });
        }

        return (
          <React.Fragment key={markerKey}>
            <Marker
              key={markerKey}
              position={position}
              icon={createCustomIcon(device)}
              interactive={true}
              bubblingMouseEvents={true}
              eventHandlers={
                // Pour les marqueurs éclatés, on n'utilise pas les eventHandlers React-Leaflet
                // car ils ne fonctionnent pas correctement quand la position change
                // On utilise uniquement les eventHandlers Leaflet natifs attachés dans le useEffect
                isSpiderfied ? {} : {
                  click: clickHandler(device),
                  ...(onMarkerHover && {
                    mouseover: (e: L.LeafletMouseEvent) => onMarkerHover(device, e),
                  }),
                  ...(onMarkerHoverOut && {
                    mouseout: () => onMarkerHoverOut(),
                  }),
                }
              }
              ref={(marker) => {
                if (marker) {
                  markerRefs.current.set(device.id, marker);
                  
                  // Attacher immédiatement les eventHandlers pour les marqueurs éclatés
                  if (isSpiderfied) {
                    const leafletMarker = (marker as any).leafletElement || marker;
                    if (leafletMarker && typeof leafletMarker.on === 'function') {
                      // Supprimer les anciens eventHandlers
                      leafletMarker.off('click');
                      
                      // Attacher le nouvel eventHandler
                      leafletMarker.on('click', (e: L.LeafletMouseEvent) => {
                        console.log(`🖱️ [CustomSpiderfiedMarkers] Clic détecté (via Leaflet natif dans ref) sur marqueur: ${device.id} (source: ${device.source})`, {
                          device,
                          event: e,
                          isSpiderfied: true,
                          position,
                          timestamp: new Date().toISOString(),
                        });
                        
                        // Empêcher la propagation
                        e.originalEvent?.stopPropagation?.();
                        
                        // Masquer le tooltip lors du clic si la fonction est fournie
                        if (onMarkerClick) {
                          console.log(`🔄 [CustomSpiderfiedMarkers] Appel onMarkerClick pour ${device.id}`);
                          onMarkerClick(device);
                        }
                        
                        console.log(`🔄 [CustomSpiderfiedMarkers] Appel handleMarkerClick pour ${device.id}`);
                        handleMarkerClick(device);
                      });
                    }
                  }
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
                bubblingMouseEvents={false}
                eventHandlers={{
                  click: (e) => {
                    // Empêcher les clics sur la ligne de passer au marqueur
                    e.originalEvent?.stopPropagation?.();
                  },
                }}
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
          bubblingMouseEvents={false}
        />
      ))}
    </>
  );
};

export default CustomSpiderfiedMarkers;
