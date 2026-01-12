import React, { useState, useCallback, useRef, useEffect } from "react";
import L from "leaflet";
import { MeasurementDevice } from "../../../types";
import { useIsMobile } from "../../../hooks/useIsMobile";

interface TooltipState {
  device: MeasurementDevice | null;
  position: { x: number; y: number };
  markerPosition?: { x: number; y: number }; // Position du marqueur en pixels
}

interface UseMarkerTooltipOptions {
  minZoom?: number;
  mapRef?: React.RefObject<L.Map | null>;
}

/**
 * Hook pour gérer l'affichage du tooltip au hover sur les marqueurs
 * Désactive automatiquement le tooltip sur les appareils mobiles
 * N'affiche le tooltip qu'à partir du niveau de zoom 11 (par défaut)
 */
export const useMarkerTooltip = (options: UseMarkerTooltipOptions = {}) => {
  const { minZoom = 11, mapRef } = options;
  const [tooltip, setTooltip] = useState<TooltipState>({
    device: null,
    position: { x: 0, y: 0 },
  });
  const [currentZoom, setCurrentZoom] = useState<number>(0);
  const [isHidden, setIsHidden] = useState(false); // État pour masquer complètement le tooltip pendant un clic
  const isMobile = useIsMobile();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<TooltipState>(tooltip);

  // Mettre à jour la ref du tooltip à chaque changement
  useEffect(() => {
    tooltipRef.current = tooltip;
  }, [tooltip]);

  // Écouter les changements de zoom et masquer le tooltip si nécessaire
  useEffect(() => {
    const map = mapRef?.current;
    if (!map) {
      // Si pas de mapRef, initialiser à 0
      setCurrentZoom(0);
      return;
    }

    const handleZoom = () => {
      const zoom = map.getZoom();
      setCurrentZoom(zoom);

      // Masquer le tooltip si le zoom devient inférieur au minimum
      // Utiliser tooltipRef pour avoir la valeur actuelle
      if (zoom < minZoom && tooltipRef.current.device) {
        setTooltip({
          device: null,
          position: { x: 0, y: 0 },
        });
      }
    };

    const handleZoomEnd = () => {
      const zoom = map.getZoom();
      setCurrentZoom(zoom);

      // Masquer le tooltip si le zoom devient inférieur au minimum
      // Utiliser tooltipRef pour avoir la valeur actuelle
      if (zoom < minZoom && tooltipRef.current.device) {
        setTooltip({
          device: null,
          position: { x: 0, y: 0 },
        });
      }
    };

    // Écouter les événements de zoom
    map.on("zoom", handleZoom);
    map.on("zoomend", handleZoomEnd);

    // Initialiser le zoom actuel
    const initialZoom = map.getZoom();
    if (initialZoom !== undefined) {
      setCurrentZoom(initialZoom);
    }

    return () => {
      map.off("zoom", handleZoom);
      map.off("zoomend", handleZoomEnd);
    };
  }, [mapRef, minZoom]);

  // Fonction pour afficher le tooltip
  const showTooltip = useCallback(
    (device: MeasurementDevice, event: L.LeafletMouseEvent) => {
      // Ne pas afficher sur mobile
      if (isMobile) {
        return;
      }

      // Ne pas afficher si le zoom est inférieur au minimum
      const map = mapRef?.current;
      const zoom = map?.getZoom() || 0;
      if (zoom < minZoom) {
        return;
      }

      // Annuler le timeout précédent s'il existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Obtenir la position du curseur dans la fenêtre
      const originalEvent = event.originalEvent as MouseEvent;
      const x = originalEvent.clientX;
      const y = originalEvent.clientY;

      // Calculer la position du marqueur en pixels pour éviter que le tooltip soit au-dessus
      let markerPosition: { x: number; y: number } | undefined;
      if (map) {
        const markerPoint = map.latLngToContainerPoint([device.latitude, device.longitude]);
        const mapContainer = map.getContainer();
        const mapRect = mapContainer.getBoundingClientRect();
        markerPosition = {
          x: mapRect.left + markerPoint.x,
          y: mapRect.top + markerPoint.y,
        };
      }

      setTooltip({
        device,
        position: { x, y },
        markerPosition,
      });
    },
    [isMobile, mapRef, minZoom]
  );

  // Fonction pour masquer le tooltip
  const hideTooltip = useCallback((immediate = false) => {
    // Annuler le timeout précédent s'il existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (immediate) {
      // Masquer complètement le tooltip de manière synchrone (lors d'un clic)
      setIsHidden(true);
      setTooltip({
        device: null,
        position: { x: 0, y: 0 },
      });
      // Réinitialiser isHidden après un court délai
      setTimeout(() => {
        setIsHidden(false);
      }, 200);
    } else {
      // Ajouter un petit délai pour éviter les clignotements lors du hover
      timeoutRef.current = setTimeout(() => {
        setTooltip({
          device: null,
          position: { x: 0, y: 0 },
        });
      }, 100);
    }
  }, []);

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Masquer le tooltip si on passe en mode mobile
  useEffect(() => {
    if (isMobile) {
      setTooltip({
        device: null,
        position: { x: 0, y: 0 },
      });
    }
  }, [isMobile]);


  return {
    tooltip,
    showTooltip,
    hideTooltip,
    isMobile,
    isHidden, // Exposer isHidden pour que le composant puisse l'utiliser
  };
};
