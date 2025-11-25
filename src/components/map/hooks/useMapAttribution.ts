import { useEffect } from "react";

interface UseMapAttributionProps {
  shouldHide: boolean;
}

export const useMapAttribution = ({ shouldHide }: UseMapAttributionProps) => {
  useEffect(() => {
    const toggleAttributionVisibility = () => {
      const attributionElement = document.querySelector(
        ".leaflet-control-attribution"
      );
      if (!attributionElement) {
        return;
      }

      if (shouldHide) {
        attributionElement.classList.add("oam-attribution-hidden");
      } else {
        attributionElement.classList.remove("oam-attribution-hidden");
      }
    };

    // Tenter immédiatement
    toggleAttributionVisibility();

    // Éventuels re-render tardifs
    const timer = window.setTimeout(toggleAttributionVisibility, 100);

    return () => {
      window.clearTimeout(timer);
      const attributionElement = document.querySelector(
        ".leaflet-control-attribution"
      );
      attributionElement?.classList.remove("oam-attribution-hidden");
    };
  }, [shouldHide]);
};

