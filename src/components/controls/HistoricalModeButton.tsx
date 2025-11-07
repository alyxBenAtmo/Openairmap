import React from "react";
import { HistoricalModeButtonProps } from "../../types";

const HistoricalModeButton: React.FC<HistoricalModeButtonProps> = ({
  isActive,
  onToggle,
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        relative flex items-center space-x-2 px-3 py-1.5 rounded-md shadow-sm
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4271B3]
        ${
          isActive
            ? "bg-[#4271B3] text-white border-2 border-[#4271B3] hover:bg-[#325a96]"
            : "bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
        }
      `}
      title={
        isActive
          ? "Désactiver le mode historique"
          : "Activer le mode historique"
      }
    >
      {/* Icône horloge */}
      <svg
        className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-600"}`}
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
      <span className="font-medium text-sm">
        {isActive ? "Mode Historique" : "Mode Historique"}
      </span>

      {/* Indicateur d'état */}
      {isActive && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
      )}
    </button>
  );
};

export default HistoricalModeButton;

