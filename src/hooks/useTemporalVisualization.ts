import { useState, useCallback, useRef, useEffect } from "react";
import {
  TemporalVisualizationState,
  TemporalControls,
  TemporalDataPoint,
} from "../types";
import { AtmoMicroService } from "../services/AtmoMicroService";

interface UseTemporalVisualizationProps {
  selectedPollutant: string;
  selectedSources: string[];
  timeStep: string;
}

export const useTemporalVisualization = ({
  selectedPollutant,
  selectedSources,
  timeStep,
}: UseTemporalVisualizationProps) => {
  // État de la visualisation temporelle
  const [state, setState] = useState<TemporalVisualizationState>({
    isActive: false,
    startDate: "",
    endDate: "",
    currentDate: "",
    isPlaying: false,
    playbackSpeed: 1,
    timeStep: timeStep,
    data: [],
    loading: false,
    error: null,
  });

  // Références pour la gestion des intervalles
  const playbackIntervalRef = useRef<number | null>(null);
  const atmoMicroService = useRef(new AtmoMicroService());

  // Fonction pour activer/désactiver le mode historique
  const toggleHistoricalMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: !prev.isActive,
      // Réinitialiser les données quand on désactive
      data: !prev.isActive ? prev.data : [],
      currentDate: !prev.isActive ? prev.currentDate : "",
      isPlaying: false,
      error: null,
    }));

    // Arrêter la lecture si on désactive le mode
    if (state.isActive) {
      stopPlayback();
    }
  }, [state.isActive]);

  // Fonction pour charger les données historiques
  const loadHistoricalData = useCallback(async () => {
    if (!state.startDate || !state.endDate || state.loading) {
      return;
    }

    // Vérifier que AtmoMicro est sélectionné
    if (!selectedSources.includes("atmoMicro")) {
      setState((prev) => ({
        ...prev,
        error: "Le mode historique n'est disponible que pour AtmoMicro",
        loading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      console.log("🕒 [HOOK] Chargement des données historiques...", {
        startDate: state.startDate,
        endDate: state.endDate,
        pollutant: selectedPollutant,
        timeStep: state.timeStep,
      });

      const temporalData = await atmoMicroService.current.fetchTemporalData({
        pollutant: selectedPollutant,
        timeStep: state.timeStep,
        startDate: state.startDate,
        endDate: state.endDate,
      });

      console.log(`✅ [HOOK] ${temporalData.length} points temporels chargés`);

      setState((prev) => ({
        ...prev,
        data: temporalData,
        currentDate:
          temporalData.length > 0 ? temporalData[0].timestamp : prev.startDate,
        loading: false,
        error: null,
      }));
    } catch (error) {
      console.error(
        "❌ [HOOK] Erreur lors du chargement des données historiques:",
        error
      );
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors du chargement des données",
      }));
    }
  }, [
    state.startDate,
    state.endDate,
    state.loading,
    selectedPollutant,
    state.timeStep,
    selectedSources,
  ]);

  // Fonction pour démarrer/arrêter la lecture
  const togglePlayback = useCallback(() => {
    if (state.data.length === 0) {
      console.warn("Aucune donnée temporelle disponible pour la lecture");
      return;
    }

    setState((prev) => ({
      ...prev,
      isPlaying: !prev.isPlaying,
    }));
  }, [state.data.length]);

  // Fonction pour arrêter la lecture
  const stopPlayback = useCallback(() => {
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isPlaying: false,
    }));
  }, []);

  // Fonction pour changer la vitesse de lecture
  const changePlaybackSpeed = useCallback((speed: number) => {
    setState((prev) => ({ ...prev, playbackSpeed: speed }));
  }, []);

  // Fonction pour changer la date actuelle
  const changeCurrentDate = useCallback((date: string) => {
    setState((prev) => ({ ...prev, currentDate: date }));
  }, []);

  // Fonction pour réinitialiser
  const reset = useCallback(() => {
    stopPlayback();
    setState((prev) => ({
      ...prev,
      startDate: "",
      endDate: "",
      currentDate: "",
      data: [],
      error: null,
    }));
  }, [stopPlayback]);

  // Effet pour gérer la lecture automatique
  useEffect(() => {
    if (state.isPlaying && state.data.length > 0) {
      const interval = setInterval(() => {
        setState((prev) => {
          const currentIndex = prev.data.findIndex(
            (point) => point.timestamp === prev.currentDate
          );

          if (currentIndex === -1 || currentIndex >= prev.data.length - 1) {
            // Fin des données, arrêter la lecture
            stopPlayback();
            return prev;
          }

          const nextIndex = currentIndex + 1;
          return {
            ...prev,
            currentDate: prev.data[nextIndex].timestamp,
          };
        });
      }, 1000 / state.playbackSpeed); // Ajuster selon la vitesse

      playbackIntervalRef.current = interval as any;

      return () => {
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current);
          playbackIntervalRef.current = null;
        }
      };
    }
  }, [state.isPlaying, state.data, state.playbackSpeed, stopPlayback]);

  // Fonction pour naviguer vers une date spécifique
  const seekToDate = useCallback(
    (targetDate: string) => {
      if (state.data.length === 0) return;

      // Trouver le point temporel le plus proche de la date cible
      const targetTime = new Date(targetDate).getTime();
      let closestPoint = state.data[0];
      let minDiff = Math.abs(
        new Date(closestPoint.timestamp).getTime() - targetTime
      );

      for (const point of state.data) {
        const pointTime = new Date(point.timestamp).getTime();
        const diff = Math.abs(pointTime - targetTime);

        if (diff < minDiff) {
          minDiff = diff;
          closestPoint = point;
        }
      }

      setState((prev) => ({
        ...prev,
        currentDate: closestPoint.timestamp,
      }));
    },
    [state.data]
  );

  // Fonction pour naviguer vers l'étape précédente
  const goToPrevious = useCallback(() => {
    if (state.data.length === 0) return;

    const currentIndex = state.data.findIndex(
      (point) => point.timestamp === state.currentDate
    );

    if (currentIndex > 0) {
      setState((prev) => ({
        ...prev,
        currentDate: prev.data[currentIndex - 1].timestamp,
      }));
    }
  }, [state.data, state.currentDate]);

  // Fonction pour naviguer vers l'étape suivante
  const goToNext = useCallback(() => {
    if (state.data.length === 0) return;

    const currentIndex = state.data.findIndex(
      (point) => point.timestamp === state.currentDate
    );

    if (currentIndex < state.data.length - 1) {
      setState((prev) => ({
        ...prev,
        currentDate: prev.data[currentIndex + 1].timestamp,
      }));
    }
  }, [state.data, state.currentDate]);

  // Fonction pour aller au début
  const goToStart = useCallback(() => {
    if (state.data.length > 0) {
      setState((prev) => ({
        ...prev,
        currentDate: prev.data[0].timestamp,
      }));
    }
  }, [state.data]);

  // Fonction pour aller à la fin
  const goToEnd = useCallback(() => {
    if (state.data.length > 0) {
      setState((prev) => ({
        ...prev,
        currentDate: prev.data[prev.data.length - 1].timestamp,
      }));
    }
  }, [state.data]);

  // Nettoyage à la destruction du composant
  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, []);

  // Obtenir les données du point temporel actuel
  const getCurrentDataPoint = useCallback((): TemporalDataPoint | null => {
    if (!state.currentDate || state.data.length === 0) {
      return null;
    }

    return (
      state.data.find((point) => point.timestamp === state.currentDate) || null
    );
  }, [state.currentDate, state.data]);

  // Obtenir les devices du point temporel actuel
  const getCurrentDevices = useCallback(() => {
    const currentPoint = getCurrentDataPoint();
    return currentPoint ? currentPoint.devices : [];
  }, [getCurrentDataPoint]);

  // Contrôles exposés
  const controls: TemporalControls = {
    startDate: state.startDate,
    endDate: state.endDate,
    currentDate: state.currentDate,
    isPlaying: state.isPlaying,
    playbackSpeed: state.playbackSpeed,
    timeStep: state.timeStep,
    onStartDateChange: (date: string) => {
      setState((prev) => ({ ...prev, startDate: date }));
    },
    onEndDateChange: (date: string) => {
      setState((prev) => ({ ...prev, endDate: date }));
    },
    onCurrentDateChange: changeCurrentDate,
    onPlayPause: togglePlayback,
    onSpeedChange: changePlaybackSpeed,
    onTimeStepChange: (newTimeStep: string) => {
      setState((prev) => ({ ...prev, timeStep: newTimeStep }));
    },
    onReset: reset,
  };

  return {
    // État
    state,
    controls,

    // Actions
    toggleHistoricalMode,
    loadHistoricalData,
    getCurrentDataPoint,
    getCurrentDevices,

    // Navigation temporelle
    seekToDate,
    goToPrevious,
    goToNext,
    goToStart,
    goToEnd,

    // Utilitaires
    isHistoricalModeActive: state.isActive,
    hasHistoricalData: state.data.length > 0,
    canPlay: state.data.length > 0 && !state.loading,
  };
};
