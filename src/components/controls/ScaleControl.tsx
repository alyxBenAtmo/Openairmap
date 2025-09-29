import React, { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

/**
 * Composant pour afficher une échelle qui s'ajuste automatiquement selon le zoom
 * Utilise le contrôle d'échelle natif de Leaflet
 */
const ScaleControl: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    // Créer le contrôle d'échelle
    const scaleControl = L.control.scale({
      position: "bottomleft", // Position en bas à gauche
      metric: true, // Afficher les unités métriques (km, m)
      imperial: false, // Ne pas afficher les unités impériales
      maxWidth: 200, // Largeur maximale de l'échelle
    });

    // Ajouter le contrôle à la carte
    scaleControl.addTo(map);

    // Cleanup : supprimer le contrôle quand le composant est démonté
    return () => {
      scaleControl.remove();
    };
  }, [map]);

  // Ce composant ne rend rien directement
  return null;
};

export default ScaleControl;
