import { useState, useCallback, useRef, useEffect } from 'react';
import L from 'leaflet';
import { MeasurementDevice } from '../../../types';
import { useIsMobile } from '../../../hooks/useIsMobile';

interface TooltipState {
  device: MeasurementDevice | null;
  position: { x: number; y: number };
}

/**
 * Hook pour gérer l'affichage du tooltip au hover sur les marqueurs
 * Désactive automatiquement le tooltip sur les appareils mobiles
 */
export const useMarkerTooltip = () => {
  const [tooltip, setTooltip] = useState<TooltipState>({
    device: null,
    position: { x: 0, y: 0 },
  });
  const isMobile = useIsMobile();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour afficher le tooltip
  const showTooltip = useCallback(
    (device: MeasurementDevice, event: L.LeafletMouseEvent) => {
      // Ne pas afficher sur mobile
      if (isMobile) {
        return;
      }

      // Annuler le timeout précédent s'il existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Obtenir la position du curseur dans la fenêtre
      // Utiliser l'événement natif pour obtenir les coordonnées absolues
      const originalEvent = event.originalEvent as MouseEvent;
      const x = originalEvent.clientX;
      const y = originalEvent.clientY;

      setTooltip({
        device,
        position: { x, y },
      });
    },
    [isMobile]
  );

  // Fonction pour masquer le tooltip
  const hideTooltip = useCallback(() => {
    // Ajouter un petit délai pour éviter les clignotements
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setTooltip({
        device: null,
        position: { x: 0, y: 0 },
      });
    }, 100);
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
  };
};

