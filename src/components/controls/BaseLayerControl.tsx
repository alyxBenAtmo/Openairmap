import React, { useState, useRef, useEffect } from "react";
import { baseLayers, BaseLayerKey } from "../../constants/mapLayers";

interface BaseLayerControlProps {
  currentBaseLayer: BaseLayerKey;
  onBaseLayerChange: (layerKey: BaseLayerKey) => void;
}

const BaseLayerControl: React.FC<BaseLayerControlProps> = ({
  currentBaseLayer,
  onBaseLayerChange,
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

  const handleLayerSelect = (layerKey: BaseLayerKey) => {
    onBaseLayerChange(layerKey);
    setIsOpen(false);
  };

  const getLayerIcon = (layerKey: BaseLayerKey) => {
    if (layerKey === "Satellite") {
      return (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"
          />
        </svg>
      );
    }
    // Icône pour la carte standard
    return (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
        />
      </svg>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-md p-2 text-center shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 hover:border-gray-300/70 transition-colors"
        title={`Fond de carte: ${currentBaseLayer}`}
      >
        <div className="flex items-center justify-center">
          <span className="text-gray-700">
            {getLayerIcon(currentBaseLayer)}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-[2000] w-auto min-w-full mb-1 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-md shadow-sm bottom-full">
          <div className="p-1">
            {Object.keys(baseLayers).map((layerKey) => (
              <button
                key={layerKey}
                type="button"
                onClick={() => handleLayerSelect(layerKey as BaseLayerKey)}
                className={`w-full flex items-center px-2.5 py-1.5 rounded text-xs transition-colors whitespace-nowrap ${
                  currentBaseLayer === layerKey
                    ? "bg-blue-50/80 text-blue-900 border border-blue-200/50"
                    : "text-gray-700 hover:bg-gray-50/80"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded border mr-2 flex items-center justify-center ${
                    currentBaseLayer === layerKey
                      ? "bg-blue-600 border-blue-600"
                      : "border-gray-300/50"
                  }`}
                >
                  {currentBaseLayer === layerKey && (
                    <svg
                      className="w-2 h-2 text-white"
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
                <span>{layerKey}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BaseLayerControl;
