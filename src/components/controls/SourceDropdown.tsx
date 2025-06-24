import React, { useState, useRef, useEffect } from "react";
import { sources } from "../../constants/sources";

interface SourceDropdownProps {
  selectedSources: string[];
  onSourceChange: (sources: string[]) => void;
}

const SourceDropdown: React.FC<SourceDropdownProps> = ({
  selectedSources,
  onSourceChange,
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

  // Définir les sources communautaires
  const communautaireSources = [
    "communautaire.nebuleair",
    "communautaire.sensorCommunity",
    "communautaire.purpleair",
  ];

  // Vérifier l'état des groupes
  const allCommunautaireSelected = communautaireSources.every((source) =>
    selectedSources.includes(source)
  );
  const someCommunautaireSelected = communautaireSources.some((source) =>
    selectedSources.includes(source)
  );

  const handleSourceToggle = (sourceCode: string) => {
    const newSources = selectedSources.includes(sourceCode)
      ? selectedSources.filter((s) => s !== sourceCode)
      : [...selectedSources, sourceCode];
    onSourceChange(newSources);
  };

  const handleGroupToggle = (groupCode: string) => {
    if (groupCode === "communautaire") {
      if (allCommunautaireSelected) {
        // Désélectionner toutes les sources communautaires
        const newSources = selectedSources.filter(
          (source) => !communautaireSources.includes(source)
        );
        onSourceChange(newSources);
      } else {
        // Sélectionner toutes les sources communautaires
        const newSources = [...selectedSources];
        communautaireSources.forEach((source) => {
          if (!newSources.includes(source)) {
            newSources.push(source);
          }
        });
        onSourceChange(newSources);
      }
    }
  };

  const getDisplayText = () => {
    if (selectedSources.length === 0) {
      return "Choisir des sources";
    }
    if (selectedSources.length === 1) {
      const source = selectedSources[0];
      if (source === "atmoRef") return "Station de référence atmosud";
      if (source === "atmoMicro") return "Microcapteurs qualifiés";
      if (source === "signalair") return "SignalAir";
      if (source.includes("communautaire.")) {
        const subSource = source.split(".")[1];
        if (subSource === "nebuleair") return "NebuleAir";
        if (subSource === "sensorCommunity") return "Sensor.Community";
        if (subSource === "purpleair") return "PurpleAir";
      }
      return source;
    }
    return `${selectedSources.length} sources sélectionnées`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Sources de données
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors text-sm"
      >
        <span
          className={`block truncate ${
            selectedSources.length === 0 ? "text-gray-500" : "text-gray-900"
          }`}
        >
          {getDisplayText()}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${
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
      </button>

      {isOpen && (
        <div className="absolute z-[2000] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg right-0 max-h-64 overflow-auto">
          {/* Sources principales */}
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 px-1">
              Sources principales
            </div>

            {/* AtmoRef */}
            <button
              type="button"
              onClick={() => handleSourceToggle("atmoRef")}
              className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                selectedSources.includes("atmoRef")
                  ? "bg-blue-50 text-blue-900 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div
                className={`w-4 h-4 rounded border mr-3 flex items-center justify-center ${
                  selectedSources.includes("atmoRef")
                    ? "bg-blue-600 border-blue-600"
                    : "border-gray-300"
                }`}
              >
                {selectedSources.includes("atmoRef") && (
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
              <span>Station de référence atmosud</span>
            </button>

            {/* AtmoMicro */}
            <button
              type="button"
              onClick={() => handleSourceToggle("atmoMicro")}
              className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                selectedSources.includes("atmoMicro")
                  ? "bg-blue-50 text-blue-900 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div
                className={`w-4 h-4 rounded border mr-3 flex items-center justify-center ${
                  selectedSources.includes("atmoMicro")
                    ? "bg-blue-600 border-blue-600"
                    : "border-gray-300"
                }`}
              >
                {selectedSources.includes("atmoMicro") && (
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
              <span>Microcapteurs qualifiés</span>
            </button>
          </div>

          {/* Séparateur */}
          <div className="border-t border-gray-200 mx-2"></div>

          {/* Groupe communautaire - toujours visible */}
          <div className="p-2">
            <button
              type="button"
              onClick={() => handleGroupToggle("communautaire")}
              className="w-full flex items-center px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <div
                  className={`w-4 h-4 rounded border mr-3 flex items-center justify-center ${
                    allCommunautaireSelected
                      ? "bg-blue-600 border-blue-600"
                      : someCommunautaireSelected
                      ? "bg-blue-200 border-blue-300"
                      : "border-gray-300"
                  }`}
                >
                  {allCommunautaireSelected && (
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
                  {someCommunautaireSelected && !allCommunautaireSelected && (
                    <div className="w-2 h-2 bg-blue-600 rounded-sm"></div>
                  )}
                </div>
                <span className="font-medium">
                  Autres capteurs communautaires
                </span>
              </div>
            </button>

            {/* Sous-menu communautaire - toujours visible */}
            <div className="ml-6 mt-1 space-y-1">
              {[
                { code: "communautaire.nebuleair", name: "NebuleAir" },
                {
                  code: "communautaire.sensorCommunity",
                  name: "Sensor.Community",
                },
                { code: "communautaire.purpleair", name: "PurpleAir" },
              ].map(({ code, name }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleSourceToggle(code)}
                  className={`w-full flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
                    selectedSources.includes(code)
                      ? "bg-blue-50 text-blue-900"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded border mr-2 flex items-center justify-center ${
                      selectedSources.includes(code)
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedSources.includes(code) && (
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
                  <span>{name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SignalAir - à la fin */}
          <div className="p-2">
            <button
              type="button"
              onClick={() => handleSourceToggle("signalair")}
              className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                selectedSources.includes("signalair")
                  ? "bg-blue-50 text-blue-900 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div
                className={`w-4 h-4 rounded border mr-3 flex items-center justify-center ${
                  selectedSources.includes("signalair")
                    ? "bg-blue-600 border-blue-600"
                    : "border-gray-300"
                }`}
              >
                {selectedSources.includes("signalair") && (
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
              <span>SignalAir</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SourceDropdown;
