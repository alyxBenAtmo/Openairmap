import React from "react";
import { HistoricalModeButtonProps } from "../../types";
import { Toggle } from "../ui/toggle";
import { cn } from "../../lib/utils";

const HistoricalModeButton: React.FC<HistoricalModeButtonProps> = ({
  isActive,
  onToggle,
}) => {
  return (
    <Toggle
      pressed={isActive}
      onPressedChange={onToggle}
      className={cn(
        "relative flex items-center space-x-2 px-3 py-2 rounded-lg shadow-sm transition-all duration-200",
        "data-[state=on]:bg-gradient-to-br data-[state=on]:from-[#4271B3] data-[state=on]:to-[#325a96]",
        "data-[state=off]:bg-gradient-to-br data-[state=off]:from-gray-50 data-[state=off]:to-white data-[state=off]:border data-[state=off]:border-gray-200/60"
      )}
      title={
        isActive
          ? "Désactiver le mode historique"
          : "Activer le mode historique"
      }
    >
      {/* Icône horloge */}
      <svg
        className={cn(
          "w-5 h-5 transition-colors",
          isActive ? "text-white" : "text-gray-600"
        )}
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

      {/* Texte du bouton */}
      <span className="font-medium text-sm">Mode Historique</span>

      {/* Indicateur d'état */}
      {isActive && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
      )}
    </Toggle>
  );
};

export default HistoricalModeButton;

