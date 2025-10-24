import React, { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

interface ScaleControlProps {
  isSidePanelOpen?: boolean;
  panelSize?: "normal" | "fullscreen" | "hidden";
}

/**
 * Composant pour afficher une échelle qui s'ajuste automatiquement selon le zoom
 * Utilise le contrôle d'échelle natif de Leaflet
 * Se cache sur mobile quand le side panel est ouvert
 */
const ScaleControl: React.FC<ScaleControlProps> = ({
  isSidePanelOpen = false,
  panelSize = "normal",
}) => {
  const map = useMap();

  useEffect(() => {
    // Créer le contrôle d'échelle
    const scaleControl = L.control.scale({
      position: "bottomleft", // Position en bas à gauche
      metric: true, // Afficher les unités métriques (km, m)
      imperial: false, // Ne pas afficher les unités impériales
      maxWidth: 120, // Largeur maximale de l'échelle (réduite pour être plus proportionnée)
    });

    // Ajouter le contrôle à la carte
    scaleControl.addTo(map);

    // Cleanup : supprimer le contrôle quand le composant est démonté
    return () => {
      scaleControl.remove();
    };
  }, [map]);

  // Effet pour gérer la visibilité selon l'état du side panel
  useEffect(() => {
    // Attendre que le contrôle soit ajouté au DOM
    setTimeout(() => {
      const scaleElement = document.querySelector(".leaflet-control-scale");
      if (scaleElement) {
        // Sur mobile, cacher l'échelle quand le side panel est ouvert
        if (isSidePanelOpen && panelSize !== "hidden") {
          scaleElement.classList.add("hidden", "md:block");
        } else {
          scaleElement.classList.remove("hidden", "md:block");
        }

        // Appliquer des styles personnalisés pour réduire la taille
        const scaleLine = scaleElement.querySelector(
          ".leaflet-control-scale-line"
        );
        if (scaleLine) {
          (scaleLine as HTMLElement).style.fontSize = "10px";
          (scaleLine as HTMLElement).style.lineHeight = "1.2";
          (scaleLine as HTMLElement).style.padding = "2px 4px";
        }
      }
    }, 100);
  }, [isSidePanelOpen, panelSize]);

  // Ce composant ne rend rien directement
  return null;
};

export default ScaleControl;
