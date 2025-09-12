import React from "react";
import { MeasurementDevice } from "../../types";

interface SensorCommunityPopupProps {
  device: MeasurementDevice & {
    sensorId?: string;
    manufacturer?: string;
    sensorType?: string;
    altitude?: string;
  };
  onClose: () => void;
}

const SensorCommunityPopup: React.FC<SensorCommunityPopupProps> = ({
  device,
  onClose,
}) => {
  // Extraire l'ID du capteur depuis l'ID du device (format: sensorId_locationId)
  const sensorId = device.sensorId || device.id.split("_")[0];

  // URL Grafana pour le capteur
  const grafanaUrl = `https://api-rrd.madavi.de:3000/grafana/d-solo/000000004/single-sensor-view-for-map?orgId=1&var-node=${sensorId}&panelId=2&theme=light`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[3000]">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {device.name}
            </h3>
            <p className="text-sm text-gray-500">
              Capteur Sensor Community #{sensorId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
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

        {/* Contenu */}
        <div className="p-4 space-y-6">
          {/* Graphique Grafana */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">
              Historique des données
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensorCommunityPopup;
