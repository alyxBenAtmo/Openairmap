import React, { useState, useRef, useEffect } from "react";
import { ModelingLayerType, modelingLayers } from "../../constants/mapLayers";
import { pollutants } from "../../constants/pollutants";
import { isModelingAvailable } from "../../services/ModelingLayerService";

interface ModelingLayerControlProps {
  currentModelingLayer: ModelingLayerType | null;
  onModelingLayerChange: (layerType: ModelingLayerType | null) => void;
  selectedPollutant?: string;
  selectedTimeStep?: string;
}

const ModelingLayerControl: React.FC<ModelingLayerControlProps> = ({
  currentModelingLayer,
  onModelingLayerChange,
  selectedPollutant,
  selectedTimeStep = "heure",
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

  const handleLayerSelect = (layerType: ModelingLayerType) => {
    // Toggle: si le layer est déjà sélectionné, on le désélectionne
    if (currentModelingLayer === layerType) {
      onModelingLayerChange(null);
    } else {
      onModelingLayerChange(layerType);
    }
    setIsOpen(false);
  };

  const getDisplayLabel = (layerType: ModelingLayerType): string => {
    if (layerType === "pollutant" && selectedPollutant) {
      const pollutantName = pollutants[selectedPollutant]?.name || selectedPollutant;
      return `Modélisation ${pollutantName}`;
    }
    return modelingLayers[layerType];
  };

  const getDisplayText = () => {
    if (currentModelingLayer) {
      return getDisplayLabel(currentModelingLayer);
    }
    return "Carte de modélisation";
  };

  const layerTypes: ModelingLayerType[] = ["icaireh", "pollutant", "vent"];
  const isDisabled = !isModelingAvailable(selectedTimeStep);

  // Désactiver automatiquement si le pas de temps ne permet pas les modélisations
  useEffect(() => {
    if (isDisabled && currentModelingLayer) {
      onModelingLayerChange(null);
    }
  }, [isDisabled, currentModelingLayer, onModelingLayerChange]);

  return (
    <div className="relative flex items-center space-x-2" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        disabled={isDisabled}
        className={`relative border rounded-md px-3 py-1 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm min-w-[150px] ${
          isDisabled
            ? "bg-gray-300 border-gray-300 cursor-not-allowed opacity-60"
            : "bg-[#0074d9] border-[#0074d9] hover:bg-[#0056b3] hover:border-[#0056b3]"
        }`}
        title={
          isDisabled
            ? "Modélisations non disponibles pour le pas de temps sélectionné"
            : currentModelingLayer
            ? `Carte de modélisation: ${getDisplayLabel(currentModelingLayer)}`
            : "Carte de modélisation"
        }
      >
        <span
          className={`block truncate pr-6 ${
            isDisabled
              ? "text-gray-600"
              : currentModelingLayer
              ? "text-white"
              : "text-white/80"
          }`}
        >
          {isDisabled ? "Modélisation (indisponible)" : getDisplayText()}
        </span>
        {!isDisabled && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg
              className={`h-4 w-4 text-white/80 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
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
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-[2000] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg right-0 top-full">
          <div className="p-1">
            {layerTypes.map((layerType) => {
              const isSelected = currentModelingLayer === layerType;
              const isPollutantLayer = layerType === "pollutant";
              const isDisabled = isPollutantLayer && !selectedPollutant;

              return (
                <button
                  key={layerType}
                  type="button"
                  onClick={() => !isDisabled && handleLayerSelect(layerType)}
                  disabled={isDisabled}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                    isSelected
                      ? "bg-blue-50 text-blue-900 border border-blue-200"
                      : isDisabled
                      ? "text-gray-400 cursor-not-allowed opacity-50"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border mr-3 flex items-center justify-center ${
                      isSelected
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span>{getDisplayLabel(layerType)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelingLayerControl;

