import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

/**
 * Composant pour afficher une flèche indiquant le nord
 * Utilise un contrôle personnalisé Leaflet
 */
const NorthArrow: React.FC = () => {
  const map = useMap();
  const controlRef = useRef<L.Control | null>(null);

  useEffect(() => {
    // Créer un contrôle personnalisé pour la flèche du nord
    const NorthArrowControl = L.Control.extend({
      onAdd: function () {
        // Créer le conteneur de la flèche
        const container = L.DomUtil.create("div", "north-arrow-container");

        // Créer l'élément de la flèche
        const arrow = L.DomUtil.create("div", "north-arrow", container);

        // Ajouter l'icône SVG de la flèche
        arrow.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L13.09 8.26L19 7L13.09 8.26L12 14L10.91 8.26L5 7L10.91 8.26L12 2Z" 
                  fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 14L12 22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        `;

        // Ajouter le texte "N"
        const text = L.DomUtil.create("div", "north-arrow-text", container);
        text.textContent = "N";

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

  // Ce composant ne rend rien directement
  return null;
};

export default NorthArrow;
