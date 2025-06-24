import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MeasurementDevice } from "../../types";
import { baseLayers, BaseLayerKey } from "../../constants/mapLayers";
import BaseLayerControl from "../controls/BaseLayerControl";
import Legend from "./Legend";

// Correction pour les icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface AirQualityMapProps {
  devices: MeasurementDevice[];
  center: [number, number];
  zoom: number;
  selectedPollutant: string;
}

const AirQualityMap: React.FC<AirQualityMapProps> = ({
  devices,
  center,
  zoom,
  selectedPollutant,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const [currentBaseLayer, setCurrentBaseLayer] =
    useState<BaseLayerKey>("Carte standard");
  const [currentTileLayer, setCurrentTileLayer] = useState<L.TileLayer | null>(
    null
  );

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  useEffect(() => {
    if (mapRef.current) {
      // Supprimer l'ancien fond de carte s'il existe
      if (currentTileLayer) {
        mapRef.current.removeLayer(currentTileLayer);
      }

      // Ajouter le nouveau fond de carte seulement si ce n'est pas la carte standard
      if (currentBaseLayer !== "Carte standard") {
        const newTileLayer = baseLayers[currentBaseLayer];
        newTileLayer.addTo(mapRef.current);
        setCurrentTileLayer(newTileLayer);
      } else {
        setCurrentTileLayer(null);
      }
    }
  }, [currentBaseLayer]);

  const handleBaseLayerChange = (layerKey: BaseLayerKey) => {
    setCurrentBaseLayer(layerKey);
  };

  const getMarkerColor = (device: MeasurementDevice) => {
    // Logique simple pour la couleur basée sur la valeur
    // À améliorer avec les seuils des polluants
    const value = device.value;
    if (value < 20) return "#10b981"; // Vert (success)
    if (value < 40) return "#f59e0b"; // Jaune (warning)
    if (value < 60) return "#f97316"; // Orange
    return "#ef4444"; // Rouge (error)
  };

  const createCustomIcon = (color: string) => {
    return L.divIcon({
      className: "custom-marker",
      html: `<div style="
        width: 20px;
        height: 20px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{
          height: "100%",
          width: "100%",
          minHeight: "100%",
        }}
        ref={mapRef}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        touchZoom={true}
      >
        {/* Fond de carte initial */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {devices.map((device) => (
          <Marker
            key={device.id}
            position={[device.latitude, device.longitude]}
            icon={createCustomIcon(getMarkerColor(device))}
          >
            <Popup>
              <div className="device-popup">
                <h3>{device.name}</h3>
                <p>
                  <strong>Source:</strong> {device.source}
                </p>
                <p>
                  <strong>Polluant:</strong> {device.pollutant}
                </p>
                <p>
                  <strong>Valeur:</strong> {device.value} {device.unit}
                </p>
                <p>
                  <strong>Statut:</strong> {device.status}
                </p>
                <p>
                  <strong>Dernière mise à jour:</strong>{" "}
                  {new Date(device.timestamp).toLocaleString()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Contrôle du fond de carte */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <BaseLayerControl
          currentBaseLayer={currentBaseLayer}
          onBaseLayerChange={handleBaseLayerChange}
        />
      </div>

      {/* Légende */}
      <Legend selectedPollutant={selectedPollutant} />
    </div>
  );
};

export default AirQualityMap;
