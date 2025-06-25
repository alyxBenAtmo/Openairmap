import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MeasurementDevice, StationInfo } from "../../types";
import { baseLayers, BaseLayerKey } from "../../constants/mapLayers";
import BaseLayerControl from "../controls/BaseLayerControl";
import Legend from "./Legend";
import StationSidePanel from "./StationSidePanel";
import { getMarkerPath } from "../../utils";
import { AtmoRefService } from "../../services/AtmoRefService";

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
  const [selectedStation, setSelectedStation] = useState<StationInfo | null>(
    null
  );
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [panelSize, setPanelSize] = useState<
    "normal" | "fullscreen" | "hidden"
  >("normal");

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
    const qualityLevel = device.qualityLevel || "default";
    const markerPath = getMarkerPath(device.source, qualityLevel);

    // Créer un élément HTML personnalisé pour le marqueur
    const div = document.createElement("div");
    div.className = "custom-marker-container";

    // Image de base du marqueur
    const img = document.createElement("img");
    img.src = markerPath;
    img.alt = `${device.source} marker`;

    // Pour SignalAir, on n'ajoute pas de texte par-dessus le marqueur
    if (device.source === "signalair") {
      div.appendChild(img);
    } else {
      // Texte de la valeur pour les autres sources
      const valueText = document.createElement("div");
      valueText.className = "value-text";

      // Gestion normale pour les autres sources
      if (device.status === "active" && device.value > 0) {
        const displayValue = Math.round(device.value);
        valueText.textContent = displayValue.toString();

        // Ajuster la taille du texte selon la longueur de la valeur
        if (displayValue >= 100) {
          valueText.style.fontSize = "12px"; // Police plus petite pour les valeurs à 3 chiffres
        } else if (displayValue >= 10) {
          valueText.style.fontSize = "16px"; // Police moyenne pour les valeurs à 2 chiffres
        } else {
          valueText.style.fontSize = "18px"; // Police normale pour les valeurs à 1 chiffre
        }

        // Couleur du texte selon le niveau de qualité
        const textColors: Record<string, string> = {
          bon: "#000000",
          moyen: "#000000",
          degrade: "#000000",
          mauvais: "#000000", // Noir au lieu de blanc pour les marqueurs rouges
          tresMauvais: "#000000", // Noir au lieu de blanc pour les marqueurs rouges
          extrMauvais: "#000000", // Noir au lieu de blanc pour les marqueurs rouges
          default: "#666666",
        };

        valueText.style.color = textColors[qualityLevel] || "#000000";

        // Ajouter un contour blanc pour améliorer la lisibilité
        if (qualityLevel !== "default") {
          // Contour plus subtil pour éviter l'effet de "paté"
          valueText.style.textShadow =
            "1px 1px 2px rgba(255,255,255,0.8), -1px -1px 2px rgba(255,255,255,0.8)";
        }
      }

      div.appendChild(img);
      div.appendChild(valueText);
    }

    return L.divIcon({
      html: div.outerHTML,
      className: "custom-marker-div",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
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

  const handleMarkerClick = async (device: MeasurementDevice) => {
    // Pour l'instant, on ne supporte que AtmoRef
    if (device.source !== "atmoRef") {
      console.log(
        "Side panel non disponible pour cette source:",
        device.source
      );
      return;
    }

    try {
      // Récupérer les informations détaillées de la station
      const atmoRefService = new AtmoRefService();
      const variables = await atmoRefService.fetchStationVariables(device.id);

      const stationInfo: StationInfo = {
        id: device.id,
        name: device.name,
        address: device.address || "",
        departmentId: device.departmentId || "",
        source: device.source,
        variables,
      };

      setSelectedStation(stationInfo);
      setIsSidePanelOpen(true);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des informations de la station:",
        error
      );
    }
  };

  const handleCloseSidePanel = () => {
    setIsSidePanelOpen(false);
    setSelectedStation(null);
    setPanelSize("normal");
  };

  const handleSidePanelSizeChange = (
    newSize: "normal" | "fullscreen" | "hidden"
  ) => {
    setPanelSize(newSize);
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
            eventHandlers={{
              click: () => handleMarkerClick(device),
            }}
          >
            <Popup>
              <div className="device-popup min-w-[250px]">
                <h3 className="font-bold text-lg mb-2">{device.name}</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Source:</strong> {device.source}
                  </p>

                  {/* Informations spécifiques à SignalAir */}
                  {device.source === "signalair" && (
                    <>
                      <p>
                        <strong>Type:</strong>{" "}
                        {(device as any).signalType || "Non spécifié"}
                      </p>
                      <p>
                        <strong>Intensité:</strong>{" "}
                        {(device as any).signalIntensity || "Non spécifiée"}
                      </p>
                      {(device as any).signalDescription && (
                        <p>
                          <strong>Description:</strong>{" "}
                          {(device as any).signalDescription}
                        </p>
                      )}
                    </>
                  )}

                  {/* Informations pour les autres sources */}
                  {device.source !== "signalair" && (
                    <>
                      <p>
                        <strong>Polluant:</strong> {device.pollutant}
                      </p>
                      <p>
                        <strong>Valeur:</strong> {formatValue(device)}
                      </p>
                      {device.qualityLevel &&
                        device.qualityLevel !== "default" && (
                          <p>
                            <strong>Qualité:</strong> {device.qualityLevel}
                          </p>
                        )}
                    </>
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

      {/* Side Panel */}
      <StationSidePanel
        isOpen={isSidePanelOpen}
        selectedStation={selectedStation}
        onClose={handleCloseSidePanel}
        onHidden={() => handleSidePanelSizeChange("hidden")}
        onSizeChange={handleSidePanelSizeChange}
        panelSize={panelSize}
        initialPollutant={selectedPollutant}
      />

      {/* Bouton pour rouvrir le panel masqué */}
      {isSidePanelOpen && panelSize === "hidden" && (
        <button
          onClick={() => handleSidePanelSizeChange("normal")}
          className="fixed top-4 left-4 z-[2001] bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          title="Rouvrir le panneau de données"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default AirQualityMap;
