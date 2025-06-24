import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MeasurementDevice } from "../../types";
import { baseLayers, BaseLayerKey } from "../../constants/mapLayers";
import BaseLayerControl from "../controls/BaseLayerControl";
import Legend from "./Legend";
import { getMarkerPath } from "../../utils";

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

  const createCustomIcon = (device: MeasurementDevice) => {
    // Utiliser le marqueur personnalisé selon la source et le niveau de qualité
    const qualityLevel = device.qualityLevel || "default";
    const markerPath = getMarkerPath(device.source, qualityLevel);

    return L.icon({
      iconUrl: markerPath,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  const formatValue = (device: MeasurementDevice) => {
    if (device.status === "inactive") {
      return "Pas de données récentes";
    }
    return `${device.value} ${device.unit}`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
            icon={createCustomIcon(device)}
          >
            <Popup>
              <div className="device-popup min-w-[250px]">
                <h3 className="font-bold text-lg mb-2">{device.name}</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Source:</strong> {device.source}
                  </p>
                  <p>
                    <strong>Polluant:</strong> {device.pollutant}
                  </p>
                  <p>
                    <strong>Valeur:</strong> {formatValue(device)}
                  </p>
                  {device.qualityLevel && device.qualityLevel !== "default" && (
                    <p>
                      <strong>Qualité:</strong> {device.qualityLevel}
                    </p>
                  )}
                  <p>
                    <strong>Statut:</strong> {device.status}
                  </p>
                  <p>
                    <strong>Dernière mise à jour:</strong>{" "}
                    {formatTimestamp(device.timestamp)}
                  </p>
                  {device.address && (
                    <p>
                      <strong>Adresse:</strong> {device.address}
                    </p>
                  )}
                </div>
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
