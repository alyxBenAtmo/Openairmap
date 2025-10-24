import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

interface NorthArrowProps {
  isSidePanelOpen?: boolean;
  panelSize?: "normal" | "fullscreen" | "hidden";
}

/**
 * Composant pour afficher une flèche indiquant le nord
 * Utilise un contrôle personnalisé Leaflet
 * Se cache sur mobile quand le side panel est ouvert
 */
const NorthArrow: React.FC<NorthArrowProps> = ({
  isSidePanelOpen = false,
  panelSize = "normal",
}) => {
  const map = useMap();
  const controlRef = useRef<L.Control | null>(null);

  useEffect(() => {
    // Créer un contrôle personnalisé pour la flèche du nord
    const NorthArrowControl = L.Control.extend({
      onAdd: function () {
        // Créer le conteneur de la flèche
        const container = L.DomUtil.create("div", "north-arrow-container");

        // Ajouter le texte "N"
        const text = L.DomUtil.create("div", "north-arrow-text", container);
        text.textContent = "N";

        // Créer l'élément de la flèche
        const arrow = L.DomUtil.create("div", "north-arrow", container);

        // Ajouter l'icône SVG de la flèche
        arrow.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L16 10L12 8.5L8 10L12 2Z" fill="#3B82F6" stroke="#1E40AF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 8.5L16 10L12 22L8 10L12 8.5Z" fill="#E5E7EB" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;

        // Empêcher les événements de la carte quand on interagit avec la flèche
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        return container;
      },

      onRemove: function () {
        // Cleanup si nécessaire
      },
    });

    // Créer et ajouter le contrôle
    controlRef.current = new NorthArrowControl({
      position: "topleft", // Position en haut à gauche
    });

    controlRef.current.addTo(map);

    // Cleanup : supprimer le contrôle quand le composant est démonté
    return () => {
      if (controlRef.current) {
        controlRef.current.remove();
      }
    };
  }, [map]);

  // Effet pour gérer la visibilité selon l'état du side panel
  useEffect(() => {
    // Attendre que le contrôle soit ajouté au DOM
    setTimeout(() => {
      const northArrowElement = document.querySelector(
        ".north-arrow-container"
      );
      if (northArrowElement) {
        // Sur mobile, cacher la flèche du nord quand le side panel est ouvert
        if (isSidePanelOpen && panelSize !== "hidden") {
          northArrowElement.classList.add("hidden", "md:flex");
        } else {
          northArrowElement.classList.remove("hidden", "md:flex");
        }
      }
    }, 100);
  }, [isSidePanelOpen, panelSize]);

  // Ce composant ne rend rien directement
  return null;
};

export default NorthArrow;
