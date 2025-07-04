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
        <div className="absolute z-[2000] w-64 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-md shadow-sm bottom-full mb-1 left-0">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Paramètres de clustering
            </h3>

            {/* Activation du clustering */}
            <div className="mb-2">
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

            {/* Description */}
            <p className="text-xs text-gray-500 mt-3">
              Le clustering regroupe automatiquement les marqueurs proches pour
              améliorer la lisibilité de la carte.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClusterControl;
