import React, { useState, useRef, useEffect } from "react";
import { TemporalVisualizationState, TemporalControls } from "../../types";
import TemporalTimeline from "./TemporalTimeline";

interface HistoricalPlaybackControlProps {
  state: TemporalVisualizationState;
  controls: TemporalControls;
  onToggleHistoricalMode: () => void;
  onOpenDatePanel: () => void;
  onSeekToDate?: (date: string) => void;
  onGoToPrevious?: () => void;
  onGoToNext?: () => void;
}

const HistoricalPlaybackControl: React.FC<HistoricalPlaybackControlProps> = ({
  state,
  controls,
  onToggleHistoricalMode,
  onOpenDatePanel,
  onSeekToDate,
  onGoToPrevious,
  onGoToNext,
}) => {
  // Position initiale : même position que le panel de sélection (haut à droite : top-[60px] right-4)
  // right-4 = 16px, top-[60px] = 60px
  // On utilise useEffect pour calculer après le premier rendu car on a besoin de la largeur du conteneur
  const [position, setPosition] = useState({ x: window.innerWidth - 320 - 16, y: 60 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Ajuster la position initiale après le premier rendu pour utiliser la vraie largeur
  useEffect(() => {
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth || 320;
      const rightOffset = 16; // right-4 = 1rem = 16px
      setPosition({
        x: window.innerWidth - width - rightOffset,
        y: 60, // top-[60px]
      });
    }
  }, []);

  // Réinitialiser la position si la fenêtre est redimensionnée
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const maxX = window.innerWidth - (containerRef.current.offsetWidth || 0);
        const maxY = window.innerHeight - (containerRef.current.offsetHeight || 0);
        setPosition((prev) => ({
          x: Math.min(prev.x, maxX),
          y: Math.min(prev.y, maxY),
        }));
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Gérer le début du drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  // Gérer le drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Limiter la position aux limites de la fenêtre
      const maxX = window.innerWidth - (containerRef.current?.offsetWidth || 0);
      const maxY = window.innerHeight - (containerRef.current?.offsetHeight || 0);

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Formater la date pour l'affichage
  const formatDate = (dateString: string): string => {
    if (!dateString) return "--";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculer le pourcentage de progression
  const getProgressPercentage = (): number => {
    if (!state.currentDate || state.data.length === 0) return 0;
    
    const currentIndex = state.data.findIndex(
      (point) => point.timestamp === state.currentDate
    );

    if (state.data.length > 1 && currentIndex >= 0) {
      return (currentIndex / (state.data.length - 1)) * 100;
    }

    return 0;
  };

  const progressPercentage = getProgressPercentage();
  const hasData = state.data.length > 0;

  return (
    <div
      ref={containerRef}
      className={`fixed z-[2000] bg-white border border-gray-300 rounded-lg shadow-xl p-4 min-w-[280px] max-w-[320px] transition-shadow ${
        isDragging ? "shadow-2xl" : ""
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        userSelect: "none",
      }}
    >
      {/* Header draggable */}
      <div
        className={`flex items-center justify-between mb-3 pb-2 border-b border-gray-200 ${
          state.loading ? "cursor-not-allowed opacity-75" : isDragging ? "cursor-grabbing" : "cursor-grab"
        } select-none`}
        onMouseDown={state.loading ? undefined : handleMouseDown}
      >
        <div className="flex items-center space-x-2">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
          <h4 className="text-sm font-semibold text-gray-900">
            Contrôles de lecture
          </h4>
        </div>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={onOpenDatePanel}
            disabled={state.loading}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-500 disabled:hover:bg-transparent"
            title="Ouvrir le panel de sélection de date"
          >
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={onToggleHistoricalMode}
            disabled={state.loading}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-500 disabled:hover:bg-transparent"
            title="Désactiver le mode historique"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Indicateur de chargement */}
      {state.loading && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-center space-x-2">
            <svg
              className="animate-spin w-4 h-4 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm font-medium text-blue-800">
              Chargement des données en cours...
            </span>
          </div>
        </div>
      )}

      {/* Date actuelle */}
      <div className={`mb-3 text-center ${state.loading ? "opacity-50" : ""}`}>
        <div className="text-xs text-gray-500 mb-1">Date actuelle</div>
        <div className="text-sm font-medium text-gray-900">
          {formatDate(state.currentDate)}
        </div>
      </div>

      {/* Timeline interactive (barre de progression) */}
      {hasData && !state.loading && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>Navigation temporelle</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <TemporalTimeline
            startDate={state.startDate}
            endDate={state.endDate}
            currentDate={state.currentDate}
            dataPoints={state.data}
            onSeek={onSeekToDate || controls.onCurrentDateChange}
            timeStep={state.timeStep}
            disabled={state.loading}
          />
        </div>
      )}

      {/* Contrôles de lecture */}
      {hasData && !state.loading && (
        <div className="flex items-center justify-center space-x-2 mb-3">
          <button
            type="button"
            onClick={onGoToPrevious || (() => {
              const currentIndex = state.data.findIndex(
                (point) => point.timestamp === state.currentDate
              );
              if (currentIndex > 0) {
                controls.onCurrentDateChange(state.data[currentIndex - 1].timestamp);
              }
            })}
            disabled={false}
            className="p-2 rounded-full bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
            title="Étape précédente"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={controls.onPlayPause}
            disabled={false}
            className={`
              p-2.5 rounded-full transition-all duration-200
              ${
                state.isPlaying
                  ? "bg-red-500 text-white hover:bg-red-600 shadow-lg active:scale-95"
                  : "bg-green-500 text-white hover:bg-green-600 shadow-lg active:scale-95"
              }
            `}
            title={state.isPlaying ? "Pause" : "Lecture"}
          >
            {state.isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 ml-0.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={onGoToNext || (() => {
              const currentIndex = state.data.findIndex(
                (point) => point.timestamp === state.currentDate
              );
              if (currentIndex < state.data.length - 1) {
                controls.onCurrentDateChange(state.data[currentIndex + 1].timestamp);
              }
            })}
            disabled={false}
            className="p-2 rounded-full bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
            title="Étape suivante"
          >
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Vitesse de lecture */}
      {hasData && !state.loading && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700">Vitesse :</span>
          <div className="flex space-x-1">
            {[0.5, 1, 2, 4, 8].map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => controls.onSpeedChange(speed)}
                disabled={state.loading}
                className={`
                  px-2 py-0.5 rounded text-xs font-medium transition-all
                  ${
                    state.loading
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : state.playbackSpeed === speed
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 active:scale-95"
                  }
                `}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      )}

      {/* État */}
      <div className={`flex items-center justify-between text-xs ${state.loading ? "opacity-50" : ""}`}>
        <div className="flex items-center space-x-1.5">
          {state.loading ? (
            <>
              <svg
                className="animate-spin w-3 h-3 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-gray-600">Chargement...</span>
            </>
          ) : (
            <>
              <div
                className={`w-2 h-2 rounded-full ${
                  state.isPlaying ? "bg-green-500 animate-pulse" : "bg-gray-400"
                }`}
              />
              <span className="text-gray-600">
                {state.isPlaying ? "Lecture" : "Pause"}
              </span>
            </>
          )}
        </div>
        {hasData && !state.loading && (
          <span className="text-gray-500">
            {state.data.length} points
          </span>
        )}
      </div>

      {!hasData && !state.loading && (
        <div className="text-xs text-center text-gray-500 py-2">
          Aucune donnée chargée
        </div>
      )}
    </div>
  );
};

export default HistoricalPlaybackControl;

