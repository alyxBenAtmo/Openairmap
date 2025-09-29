import React, { useRef, useEffect, useState } from "react";
import { TemporalDataPoint } from "../../types";

interface TemporalTimelineProps {
  startDate: string;
  endDate: string;
  currentDate: string;
  dataPoints: TemporalDataPoint[];
  onSeek: (date: string) => void;
  timeStep: string;
  disabled?: boolean;
}

const TemporalTimeline: React.FC<TemporalTimelineProps> = ({
  startDate,
  endDate,
  currentDate,
  dataPoints,
  onSeek,
  timeStep,
  disabled = false,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);

  // Calculer la position du curseur en pourcentage
  const getCurrentPosition = (): number => {
    if (!startDate || !endDate || !currentDate) return 0;

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const current = new Date(currentDate).getTime();

    if (end <= start) return 0;

    return Math.max(
      0,
      Math.min(100, ((current - start) / (end - start)) * 100)
    );
  };

  // Calculer la position d'un timestamp en pourcentage
  const getTimestampPosition = (timestamp: string): number => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const time = new Date(timestamp).getTime();

    if (end <= start) return 0;

    return Math.max(0, Math.min(100, ((time - start) / (end - start)) * 100));
  };

  // Convertir une position en pourcentage en timestamp
  const positionToTimestamp = (position: number): string => {
    if (!startDate || !endDate) return currentDate;

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const time = start + (position / 100) * (end - start);

    return new Date(time).toISOString();
  };

  // Gérer le clic sur la timeline
  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;

    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const position = (x / rect.width) * 100;
    const timestamp = positionToTimestamp(position);

    onSeek(timestamp);
  };

  // Gérer le survol de la timeline
  const handleTimelineHover = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;

    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const position = (x / rect.width) * 100;
    setHoverPosition(position);
  };

  // Gérer la sortie du survol
  const handleTimelineLeave = () => {
    setHoverPosition(null);
  };

  // Gérer le début du drag
  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;

    event.preventDefault();
    setIsDragging(true);
    handleTimelineClick(event);
  };

  // Gérer le drag
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging || !timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const timestamp = positionToTimestamp(position);

      onSeek(timestamp);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, onSeek, startDate, endDate]);

  // Formater la date pour l'affichage
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculer la densité des données pour l'affichage
  const getDataDensity = (position: number): number => {
    const timestamp = positionToTimestamp(position);
    const time = new Date(timestamp).getTime();
    const window = 24 * 60 * 60 * 1000; // 24 heures

    return dataPoints.filter((point) => {
      const pointTime = new Date(point.timestamp).getTime();
      return Math.abs(pointTime - time) <= window / 2;
    }).length;
  };

  const currentPosition = getCurrentPosition();
  const hoverTimestamp = hoverPosition
    ? positionToTimestamp(hoverPosition)
    : null;

  return (
    <div className="space-y-3">
      {/* Timeline principale */}
      <div className="relative">
        <div
          ref={timelineRef}
          className={`
            relative h-8 bg-gray-200 rounded-lg cursor-pointer
            ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-300"}
            transition-colors duration-200
          `}
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineHover}
          onMouseLeave={handleTimelineLeave}
          onMouseDown={handleMouseDown}
        >
          {/* Fond de la timeline */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-100 to-green-100" />

          {/* Marqueurs de données */}
          {dataPoints.map((point, index) => {
            const position = getTimestampPosition(point.timestamp);
            const density = getDataDensity(position);
            const height = Math.max(2, Math.min(8, (density / 10) * 6 + 2));

            return (
              <div
                key={`${point.timestamp}-${index}`}
                className="absolute top-1/2 transform -translate-y-1/2 w-1 bg-blue-400 rounded-full opacity-60"
                style={{
                  left: `${position}%`,
                  height: `${height}px`,
                }}
                title={`${formatDate(point.timestamp)} - ${
                  point.deviceCount
                } appareils`}
              />
            );
          })}

          {/* Curseur de position actuelle */}
          <div
            className={`
              absolute top-1/2 transform -translate-y-1/2 w-1 h-6 rounded-full
              ${disabled ? "bg-gray-400" : "bg-blue-600"}
              transition-all duration-200
              ${isDragging ? "scale-110 shadow-lg" : ""}
            `}
            style={{ left: `${currentPosition}%` }}
          />

          {/* Indicateur de survol */}
          {hoverPosition !== null && !disabled && (
            <div
              className="absolute top-1/2 transform -translate-y-1/2 w-0.5 h-6 bg-gray-500 rounded-full opacity-70"
              style={{ left: `${hoverPosition}%` }}
            />
          )}
        </div>

        {/* Labels de dates */}
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>{formatDate(startDate)}</span>
          <span className="font-medium">
            {hoverTimestamp
              ? formatDate(hoverTimestamp)
              : formatDate(currentDate)}
          </span>
          <span>{formatDate(endDate)}</span>
        </div>
      </div>

      {/* Informations sur la position actuelle */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
          <span className="text-gray-700">
            Position actuelle : {formatDate(currentDate)}
          </span>
        </div>

        {dataPoints.length > 0 && (
          <div className="text-gray-500">
            {dataPoints.length} points temporels
          </div>
        )}
      </div>

      {/* Barre de progression */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${currentPosition}%` }}
        />
      </div>
    </div>
  );
};

export default TemporalTimeline;
