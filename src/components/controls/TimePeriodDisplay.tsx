import React from "react";

interface TimePeriodDisplayProps {
  timeStep: string;
}

const TimePeriodDisplay: React.FC<TimePeriodDisplayProps> = ({ timeStep }) => {
  const getTimePeriod = (): string => {
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

  const getTimeStepIcon = (): string => {
    switch (timeStep) {
      case "jour":
        return "📅";
      case "heure":
        return "🕐";
      case "quartHeure":
        return "⏰";
      case "instantane":
        return "⚡";
      case "deuxMin":
        return "⏱️";
      default:
        return "📊";
    }
  };

  const getTimeStepLabel = (): string => {
    switch (timeStep) {
      case "jour":
        return "Jour";
      case "heure":
        return "Horaire";
      case "quartHeure":
        return "15 min";
      case "instantane":
        return "Scan";
      case "deuxMin":
        return "≤2 min";
      default:
        return "";
    }
  };

  const period = getTimePeriod();

  if (!period) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-2">
        <span className="text-lg">{getTimeStepIcon()}</span>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-gray-700 leading-tight">
            {getTimeStepLabel()}
          </span>
          <span className="text-sm font-semibold text-gray-900 leading-tight">
            {period}
          </span>
        </div>
      </div>
      {/* <div className="w-px h-6 bg-gray-300"></div> */}
      {/* <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs text-gray-600">Données</span>
      </div> */}
    </div>
  );
};

export default TimePeriodDisplay;
