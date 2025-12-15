import React, { useState, useRef, useEffect } from "react";
import { Checkbox } from "../ui/checkbox";
import { cn } from "../../lib/utils";

interface SourceSettingsControlProps {
  selectedSources: string[];
  onSourceChange: (sources: string[]) => void;
}

const SourceSettingsControl: React.FC<SourceSettingsControlProps> = ({
  selectedSources,
  onSourceChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Vérifier si NebuleAir est activé
  const isNebuleAirActive = selectedSources.some(s => 
    s === "microcapteursQualifies.atmoMicro" || 
    s === "microcapteursQualifies.nebuleair"
  );

  // Vérifier si Autre capteur communautaire est activé
  const isAutreCapteurCommunautaireActive = selectedSources.some(s => 
    s === "autreCapteurCommunautaire.purpleair" || 
    s === "autreCapteurCommunautaire.sensorCommunity"
  );

  // Vérifier l'état des sources NebuleAir
  const isAtmoMicroSelected = selectedSources.includes("microcapteursQualifies.atmoMicro");
  const isNebuleAirSelected = selectedSources.includes("microcapteursQualifies.nebuleair");

  // Vérifier l'état des sources Autre capteur communautaire
  const isPurpleAirSelected = selectedSources.includes("autreCapteurCommunautaire.purpleair");
  const isSensorCommunitySelected = selectedSources.includes("autreCapteurCommunautaire.sensorCommunity");

  // Ne pas afficher si aucune source avec réglages n'est activée
  if (!isNebuleAirActive && !isAutreCapteurCommunautaireActive) {
    return null;
  }

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = (groupCode: string, sourceType: string) => {
    const sourceCode = `${groupCode}.${sourceType}`;
    const isCurrentlySelected = selectedSources.includes(sourceCode);

    if (isCurrentlySelected) {
      // Désélectionner
      const newSources = selectedSources.filter(s => s !== sourceCode);
      onSourceChange(newSources);
    } else {
      // Sélectionner
      const newSources = [...selectedSources, sourceCode];
      onSourceChange(newSources);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-md p-2 text-center shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 hover:border-gray-300/70 transition-colors"
        title="Réglage source capteurs"
      >
        <svg
          className="w-5 h-5 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-[2000] w-72 mb-2 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-md shadow-lg bottom-full left-0 max-h-96 overflow-y-auto">
          <div className="p-3 space-y-4">
            {/* Section NebuleAir */}
            {isNebuleAirActive && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  NebuleAir
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={isAtmoMicroSelected}
                      onCheckedChange={() => handleToggle("microcapteursQualifies", "atmoMicro")}
                    />
                    <span className="text-sm text-gray-700">
                      NebuleAir qualifiés AtmoSud
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={isNebuleAirSelected}
                      onCheckedChange={() => handleToggle("microcapteursQualifies", "nebuleair")}
                    />
                    <span className="text-sm text-gray-700">
                      NebuleAir AirCarto
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Section Autre capteur communautaire */}
            {isAutreCapteurCommunautaireActive && (
              <div>
                {isNebuleAirActive && <div className="border-t border-gray-200 my-3"></div>}
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Autre capteur communautaire
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={isPurpleAirSelected}
                      onCheckedChange={() => handleToggle("autreCapteurCommunautaire", "purpleair")}
                    />
                    <span className="text-sm text-gray-700">
                      PurpleAir
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={isSensorCommunitySelected}
                      onCheckedChange={() => handleToggle("autreCapteurCommunautaire", "sensorCommunity")}
                    />
                    <span className="text-sm text-gray-700">
                      Sensor.Community
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SourceSettingsControl;

