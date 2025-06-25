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

  const period = getTimePeriod();

  if (!period) return null;

  return <span className="text-xs text-gray-600">Période: {period}</span>;
};

export default TimePeriodDisplay;
