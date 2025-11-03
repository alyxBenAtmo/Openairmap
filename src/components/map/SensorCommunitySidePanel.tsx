import React, { useState, useEffect } from "react";
import { StationInfo } from "../../types";

interface SensorCommunitySidePanelProps {
  isOpen: boolean;
  selectedStation: StationInfo | null;
  onClose: () => void;
  onHidden?: () => void;
  onSizeChange?: (size: "normal" | "fullscreen" | "hidden") => void;
  initialPollutant: string;
  panelSize?: "normal" | "fullscreen" | "hidden";
}

type PanelSize = "normal" | "fullscreen" | "hidden";

const SensorCommunitySidePanel: React.FC<SensorCommunitySidePanelProps> = ({
  isOpen,
  selectedStation,
  onClose,
  onHidden,
  onSizeChange,
  initialPollutant,
  panelSize: externalPanelSize,
}) => {
  const [internalPanelSize, setInternalPanelSize] =
    useState<PanelSize>("normal");

  // Utiliser la taille externe si fournie, sinon la taille interne
  const currentPanelSize = externalPanelSize || internalPanelSize;

  // Extraire l'ID du capteur depuis l'ID du device (format: sensorId_locationId)
  // ou depuis l'ID de la station si c'est directement le sensorId
  const getSensorId = (): string => {
    if (!selectedStation) return "";
    // Vérifier si l'ID contient un underscore (format sensorId_locationId)
    if (selectedStation.id.includes("_")) {
      return selectedStation.id.split("_")[0];
    }
    return selectedStation.id;
  };

  const sensorId = getSensorId();

  // URL Grafana pour le capteur
  const grafanaUrl = `https://api-rrd.madavi.de:3000/grafana/d-solo/000000004/single-sensor-view-for-map?orgId=1&var-node=${sensorId}&panelId=2&theme=light`;

  const handlePanelSizeChange = (newSize: PanelSize) => {
    if (onSizeChange) {
      // Si on a un callback externe, l'utiliser
      onSizeChange(newSize);
    } else {
      // Sinon, utiliser l'état interne
      setInternalPanelSize(newSize);
    }

    if (newSize === "hidden" && onHidden) {
      onHidden();
    }
  };

  // Réinitialiser la taille du panel quand la station change
  useEffect(() => {
    if (isOpen && selectedStation) {
      setInternalPanelSize("normal");
    } else {
      setInternalPanelSize("hidden");
    }
  }, [isOpen, selectedStation]);

  if (!isOpen || !selectedStation) {
    return null;
  }

  const getPanelClasses = () => {
    const baseClasses =
      "bg-white shadow-xl flex flex-col border-r border-gray-200 transition-all duration-300 h-[calc(100vh-64px)]";

    switch (currentPanelSize) {
      case "fullscreen":
        return `${baseClasses} w-full`;
      case "hidden":
        // Retirer complètement du flux pour éviter l'espace réservé
        return `${baseClasses} hidden`;
      case "normal":
      default:
        // Responsive: plein écran sur mobile, largeur réduite pour les petits écrans en paysage
        return `${baseClasses} w-full sm:w-[320px] md:w-[400px] lg:w-[600px] xl:w-[650px]`;
    }
  };

  return (
    <div className={getPanelClasses()}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
            {selectedStation.name || selectedStation.id}
          </h2>
          <p className="text-xs text-gray-500 truncate">
            Capteur Sensor Community #{sensorId}
          </p>
        </div>

        {/* Contrôles unifiés du panel */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Bouton agrandir/rétrécir */}
          <button
            onClick={() =>
              handlePanelSizeChange(
                currentPanelSize === "fullscreen" ? "normal" : "fullscreen"
              )
            }
            className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title={
              currentPanelSize === "fullscreen"
                ? "Rétrécir le panel"
                : "Agrandir le panel"
            }
          >
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {currentPanelSize === "fullscreen" ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              )}
            </svg>
          </button>

          {/* Bouton rabattre */}
          <button
            onClick={() => handlePanelSizeChange("hidden")}
            className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Rabattre le panel"
          >
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Contenu - masqué quand currentPanelSize === 'hidden' */}
      {currentPanelSize !== "hidden" && (
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
          {/* Graphique Grafana avec contrôles intégrés */}
          <div className="flex-1 min-h-80 sm:min-h-96 md:min-h-[28rem]">
            <h3 className="text-sm font-medium text-gray-700 mb-2 sm:mb-3">
              Historique des données (Sensor Community)
            </h3>
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
              {/* Sélection des polluants - en haut du graphique (GRISÉE) */}
              <div className="border border-gray-200 rounded-lg mb-3 sm:mb-4 opacity-50 pointer-events-none">
                <button
                  disabled
                  className="w-full flex items-center justify-between p-2.5 sm:p-3 text-left rounded-lg cursor-not-allowed"
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <svg
                      className="w-4 h-4 text-gray-600 flex-shrink-0"
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
                    <span className="text-sm font-medium text-gray-700 truncate">
                      Polluants affichés
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
                      Non disponible
                    </span>
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-400 transition-transform flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>

              {/* Graphique Grafana */}
              <div className="bg-gray-50 rounded-lg p-4 mb-3 sm:mb-4">
                <div className="aspect-video w-full">
                  <iframe
                    src={grafanaUrl}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    title={`Historique Sensor Community - Capteur ${sensorId}`}
                    className="rounded-lg"
                  />
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  <p>
                    Graphique fourni par{" "}
                    <a
                      href="https://grafana.sensor.community"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Sensor Community Grafana
                    </a>
                  </p>
                </div>
              </div>

              {/* Contrôles du graphique - en bas du graphique */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {/* Contrôles de la période - Seul 24h est actif */}
                <div className="flex-1 border border-gray-200 rounded-lg p-2.5 sm:p-3">
                  <div className="flex items-center space-x-2 mb-2.5 sm:mb-3">
                    <svg
                      className="w-4 h-4 text-gray-600 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      Historique
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 mb-2">
                    {[
                      { key: "3h", label: "3h", active: false },
                      { key: "24h", label: "24h", active: true },
                      { key: "7d", label: "7j", active: false },
                      { key: "1y", label: "1an", active: false },
                    ].map(({ key, label, active }) => (
                      <button
                        key={key}
                        disabled={!active}
                        className={`px-1.5 py-1 text-xs rounded-md transition-all duration-200 ${
                          !active
                            ? "bg-gray-100 text-gray-500 cursor-not-allowed opacity-50"
                            : key === "24h"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {/* Bouton période personnalisée grisé */}
                  <button
                    disabled
                    className="w-full px-2.5 py-1.5 text-xs rounded-md transition-all duration-200 border bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Période personnalisée
                      </span>
                    </div>
                  </button>
                </div>

                {/* Contrôles du pas de temps - Seul Scan 2min est actif */}
                <div className="flex-1 border border-gray-200 rounded-lg p-2.5 sm:p-3">
                  <div className="flex items-center space-x-2 mb-2.5 sm:mb-3">
                    <svg
                      className="w-4 h-4 text-gray-600 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      Pas de temps
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { key: "instantane", label: "Scan 2min", active: true },
                      { key: "quartHeure", label: "15min", active: false },
                      { key: "heure", label: "1h", active: false },
                      { key: "jour", label: "1j", active: false },
                    ].map(({ key, label, active }) => (
                      <button
                        key={key}
                        disabled={!active}
                        className={`px-1.5 py-1 text-xs rounded-md transition-all duration-200 ${
                          !active
                            ? "bg-gray-100 text-gray-500 cursor-not-allowed opacity-50"
                            : key === "instantane"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Note d'information */}
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> Les contrôles ne sont pas disponibles
                  pour les données Sensor Community. Le graphique est fourni
                  directement par Sensor Community Grafana et ne peut pas être
                  contrôlé depuis cette interface.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SensorCommunitySidePanel;

