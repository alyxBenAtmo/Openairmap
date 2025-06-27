import React, { useState, useRef, useEffect } from "react";
import { ClusterConfig } from "../../types";

interface ClusterControlProps {
  config: ClusterConfig;
  onConfigChange: (config: ClusterConfig) => void;
}

const ClusterControl: React.FC<ClusterControlProps> = ({
  config,
  onConfigChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleEnabled = () => {
    onConfigChange({
      ...config,
      enabled: !config.enabled,
    });
  };

  const handleRadiusChange = (value: number) => {
    onConfigChange({
      ...config,
      maxClusterRadius: value,
    });
  };

  const handleOptionChange = (option: keyof ClusterConfig, value: boolean) => {
    onConfigChange({
      ...config,
      [option]: value,
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-md p-2 text-center shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 hover:border-gray-300/70 transition-colors"
        title="Paramètres de clustering"
      >
        <div className="flex items-center justify-center">
          <svg
            className="w-4 h-4 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-[2000] w-80 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-md shadow-sm bottom-full mb-1 left-0">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Paramètres de clustering
            </h3>

            {/* Activation du clustering */}
            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={handleToggleEnabled}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Activer le clustering
                </span>
              </label>
            </div>

            {config.enabled && (
              <>
                {/* Rayon de clustering */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rayon de clustering: {config.maxClusterRadius}px
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    step="10"
                    value={config.maxClusterRadius}
                    onChange={(e) => handleRadiusChange(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>20px</span>
                    <span>200px</span>
                  </div>
                </div>

                {/* Options avancées */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">
                    Options avancées
                  </h4>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.spiderfyOnMaxZoom}
                      onChange={(e) =>
                        handleOptionChange(
                          "spiderfyOnMaxZoom",
                          e.target.checked
                        )
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Spiderfy au zoom maximum
                    </span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.showCoverageOnHover}
                      onChange={(e) =>
                        handleOptionChange(
                          "showCoverageOnHover",
                          e.target.checked
                        )
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Afficher la zone au survol
                    </span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.zoomToBoundsOnClick}
                      onChange={(e) =>
                        handleOptionChange(
                          "zoomToBoundsOnClick",
                          e.target.checked
                        )
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Zoom sur la zone au clic
                    </span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.animate}
                      onChange={(e) =>
                        handleOptionChange("animate", e.target.checked)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Animations de clustering
                    </span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.animateAddingMarkers}
                      onChange={(e) =>
                        handleOptionChange(
                          "animateAddingMarkers",
                          e.target.checked
                        )
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Animations d'ajout de marqueurs
                    </span>
                  </label>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClusterControl;
