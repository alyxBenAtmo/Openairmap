import React from "react";

interface AutoRefreshControlProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  lastRefresh?: Date | null;
  loading?: boolean;
  selectedTimeStep: string;
}

const AutoRefreshControl: React.FC<AutoRefreshControlProps> = ({
  enabled,
  onToggle,
  lastRefresh,
  loading = false,
  selectedTimeStep,
}) => {
  const formatLastRefresh = (date: Date): string => {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fonction pour obtenir la période de données actuellement affichée
  const getCurrentDataPeriod = (timeStep: string): string => {
    const now = new Date();

    switch (timeStep) {
      case "jour":
        // Dernier jour plein (veille)
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

      case "heure":
        // Dernière heure pleine (heure précédente)
        const lastHour = new Date(now);
        lastHour.setHours(lastHour.getHours() - 1, 0, 0);
        lastHour.setMilliseconds(0);
        const endHour = new Date(lastHour);
        endHour.setHours(endHour.getHours() + 1);

        return `${lastHour.getHours()}h-${endHour.getHours()}h`;

      case "quartHeure":
        // Dernier quart d'heure plein (quart précédent)
        const lastQuarter = new Date(now);
        const currentMinutes = lastQuarter.getMinutes();
        const quarterStart = Math.floor(currentMinutes / 15) * 15;

        // Toujours prendre le quart précédent (dernier quart terminé)
        lastQuarter.setMinutes(quarterStart - 15, 0);
        lastQuarter.setMilliseconds(0);

        const quarterEnd = new Date(lastQuarter);
        quarterEnd.setMinutes(quarterEnd.getMinutes() + 15);

        const formatTime = (date: Date): string => {
          const hours = date.getHours();
          const minutes = date.getMinutes();
          return `${hours}h${minutes.toString().padStart(2, "0")}`;
        };

        return `${formatTime(lastQuarter)}-${formatTime(quarterEnd)}`;

      case "instantane":
        // Heure et minute actuelles
        return now.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });

      case "deuxMin":
        // Dernière période de 2 minutes pleine (période précédente)
        const lastTwoMin = new Date(now);
        const currentMin = lastTwoMin.getMinutes();
        const twoMinStart = Math.floor(currentMin / 2) * 2;
        lastTwoMin.setMinutes(twoMinStart, 0);
        lastTwoMin.setMilliseconds(0);

        // Si on est au début de la période actuelle, prendre la période précédente
        if (twoMinStart === currentMin) {
          lastTwoMin.setMinutes(lastTwoMin.getMinutes() - 2);
        }

        const twoMinEnd = new Date(lastTwoMin);
        twoMinEnd.setMinutes(twoMinEnd.getMinutes() + 2);

        const formatTwoMinTime = (date: Date): string => {
          const hours = date.getHours();
          const minutes = date.getMinutes();
          return `${hours}h${minutes.toString().padStart(2, "0")}`;
        };

        return `${formatTwoMinTime(lastTwoMin)}-${formatTwoMinTime(twoMinEnd)}`;

      default:
        return "";
    }
  };

  const currentPeriod = getCurrentDataPeriod(selectedTimeStep);

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Bouton toggle */}
      <button
        onClick={() => onToggle(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          enabled ? "bg-blue-600" : "bg-gray-200"
        }`}
        disabled={loading}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>

      {/* Label */}
      <span className="text-xs font-medium text-gray-700">Auto-refresh</span>

      {/* Indicateur de statut */}
      <div className="flex items-center space-x-1">
        {loading ? (
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        ) : enabled ? (
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        ) : (
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        )}
      </div>

      {/* Période de données actuellement affichée */}
      {currentPeriod && (
        <>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-600">Période:</span>
            <span className="text-xs font-medium text-gray-800">
              {currentPeriod}
            </span>
          </div>
        </>
      )}

      {/* Dernier rafraîchissement */}
      {lastRefresh && (
        <>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-600">Dernier:</span>
            <span className="text-xs font-medium text-gray-800">
              {formatLastRefresh(lastRefresh)}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default AutoRefreshControl;
