import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import { baseLayers, BaseLayerKey } from "../../../constants/mapLayers";
import {
  getModelingLayerHour,
  formatHourLayerName,
  getIcairehLayerName,
  getPollutantLayerName,
  createModelingWMTSLayer,
  getModelingLegendUrl,
  getModelingLegendTitle,
  isModelingAvailable,
  loadWindFromAtmoSud,
} from "../../../services/ModelingLayerService";

interface UseMapLayersProps {
  mapRef: React.RefObject<L.Map | null>;
  currentBaseLayer: BaseLayerKey;
  selectedTimeStep: string;
  selectedPollutant: string;
  currentModelingLayer: "icaireh" | "pollutant" | "vent" | null;
}

export const useMapLayers = ({
  mapRef,
  currentBaseLayer,
  selectedTimeStep,
  selectedPollutant,
  currentModelingLayer,
}: UseMapLayersProps) => {
  const [currentTileLayer, setCurrentTileLayer] = useState<L.TileLayer | null>(
    null
  );
  const [currentModelingWMTSLayer, setCurrentModelingWMTSLayer] =
    useState<L.TileLayer | null>(null);
  const [currentModelingLegendUrl, setCurrentModelingLegendUrl] = useState<
    string | null
  >(null);
  const [currentModelingLegendTitle, setCurrentModelingLegendTitle] =
    useState<string | null>(null);

  const modelingLayerRef = useRef<L.TileLayer | null>(null);
  const windLayerRef = useRef<L.Layer | null>(null);
  const windLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Fonction pour charger la modélisation de vent
  const loadWindModeling = useCallback(async () => {
    if (!mapRef.current) return;

    try {
      // Nettoyage de la couche existante
      if (windLayerGroupRef.current && mapRef.current) {
        mapRef.current.removeLayer(windLayerGroupRef.current);
        windLayerGroupRef.current = null;
      }
      if (windLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(windLayerRef.current);
        windLayerRef.current = null;
      }

      // Calculer la date et l'heure
      const now = new Date();
      const yyyy = now.getFullYear();
      const MM = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const HH = String(now.getHours()).padStart(2, "0");
      const dateStr = `${yyyy}${MM}${dd}`;

      // Charger les données de vent depuis AtmoSud
      const data = await loadWindFromAtmoSud(dateStr, HH);
      console.log("✅ [WIND-AtmoSud] Données chargées avec succès");

      // Créer le LayerGroup pour le vent
      const windLayerGroup = L.layerGroup();

      // Utiliser leaflet-velocity pour afficher les données de vent
      const velocityLayer = (L as any).velocityLayer({
        displayValues: false,
        displayOptions: false,
        data: data,
        velocityScale: 0.004,
        lineWidth: 2,
        colorScale: [
          "#8cb38a", // couleur unique pour tout le vent
        ],
        minVelocity: 0,
        maxVelocity: 30,
        overlayName: "wind_layer",
      });

      // Ajouter le layer au groupe
      velocityLayer.addTo(windLayerGroup);
      windLayerRef.current = velocityLayer;

      // Ajouter le groupe à la carte
      if (mapRef.current) {
        windLayerGroup.addTo(mapRef.current);
        windLayerGroupRef.current = windLayerGroup;
        console.log(`✅ [WIND] Layer de vent ajouté à la carte`);
      }
    } catch (error) {
      console.error(
        "❌ [WIND] Erreur lors du chargement des données de vent:",
        error
      );
      // Afficher un message d'erreur dans la console (vous pouvez adapter pour un système de notification)
      alert(`Impossible de charger les données de vent à cette heure.`);
    }
  }, [mapRef]);

  // Effet pour mettre à jour le fond de carte et le maxZoom
  useEffect(() => {
    if (mapRef.current) {
      // Supprimer l'ancien fond de carte s'il existe
      if (currentTileLayer) {
        mapRef.current.removeLayer(currentTileLayer);
      }

      // Ajouter le nouveau fond de carte seulement si ce n'est pas la carte standard
      if (currentBaseLayer !== "Carte standard") {
        const newTileLayer = baseLayers[currentBaseLayer];
        newTileLayer.addTo(mapRef.current);
        setCurrentTileLayer(newTileLayer);
      } else {
        setCurrentTileLayer(null);
      }

      // Ajuster le maxZoom en fonction de la couche active
      const layerConfig = baseLayers[currentBaseLayer];
      const maxZoom = layerConfig.options.maxZoom || 18;
      mapRef.current.setMaxZoom(maxZoom);
    }
  }, [currentBaseLayer, currentTileLayer, mapRef]);

  // Effet pour gérer les layers de modélisation WMTS
  useEffect(() => {
    if (!mapRef.current) return;

    // Cleanup: retirer l'ancien layer de modélisation s'il existe
    if (modelingLayerRef.current && mapRef.current) {
      console.log("🗺️ [MODELING] Retrait de l'ancien layer WMTS");
      mapRef.current.removeLayer(modelingLayerRef.current);
      modelingLayerRef.current = null;
      setCurrentModelingWMTSLayer(null);
    }

    // Par défaut, aucune légende n'est affichée tant qu'un nouveau layer n'est pas chargé
    setCurrentModelingLegendUrl(null);
    setCurrentModelingLegendTitle(null);

    // Cleanup: retirer l'ancien layer de vent s'il existe
    if (windLayerGroupRef.current && mapRef.current) {
      console.log("🗺️ [MODELING] Retrait de l'ancien layer de vent");
      mapRef.current.removeLayer(windLayerGroupRef.current);
      windLayerGroupRef.current = null;
      windLayerRef.current = null;
    }

    // Pour le vent, pas besoin de vérifier isModelingAvailable car il utilise une API différente
    if (currentModelingLayer === "vent") {
      loadWindModeling();
      return;
    }

    // Vérifier si les modélisations sont disponibles pour ce pas de temps (pour icaireh et pollutant)
    if (!isModelingAvailable(selectedTimeStep)) {
      console.log(
        "🗺️ [MODELING] Modélisations non disponibles pour ce pas de temps"
      );
      return;
    }

    // Si un layer de modélisation WMTS est sélectionné (icaireh ou pollutant)
    if (
      currentModelingLayer === "icaireh" ||
      currentModelingLayer === "pollutant"
    ) {
      try {
        // Calculer l'heure à afficher
        const hour = getModelingLayerHour(selectedTimeStep);
        console.log("🗺️ [MODELING] Heure calculée:", hour);

        // Si l'heure est invalide (scan), ne pas charger
        if (hour < 0) {
          console.log("🗺️ [MODELING] Heure invalide, arrêt");
          return;
        }

        // Formater l'heure (h00, h01, ..., h47)
        const hourFormatted = formatHourLayerName(hour);
        let layerName: string;

        // Déterminer le nom du layer selon le type
        if (currentModelingLayer === "icaireh") {
          layerName = getIcairehLayerName(hourFormatted);
        } else if (currentModelingLayer === "pollutant") {
          if (!selectedPollutant) {
            console.log("🗺️ [MODELING] Aucun polluant sélectionné");
            return;
          }
          layerName = getPollutantLayerName(selectedPollutant, hourFormatted);
        } else {
          // Ce cas ne devrait jamais se produire, mais TypeScript le requiert
          return;
        }

        console.log("🗺️ [MODELING] Création du layer WMTS:", layerName);

        // Créer et ajouter le layer WMTS
        const wmtsLayer = createModelingWMTSLayer(layerName);
        if (mapRef.current) {
          wmtsLayer.addTo(mapRef.current);
          modelingLayerRef.current = wmtsLayer;
          setCurrentModelingWMTSLayer(wmtsLayer);
          setCurrentModelingLegendUrl(getModelingLegendUrl(layerName));
          setCurrentModelingLegendTitle(getModelingLegendTitle(layerName));
          console.log("✅ [MODELING] Layer WMTS ajouté à la carte:", layerName);
        }
      } catch (error) {
        console.error(
          "❌ [MODELING] Erreur lors du chargement du layer de modélisation:",
          error
        );
      }
    }

    // Cleanup function pour retirer les layers lors du démontage ou changement
    return () => {
      if (mapRef.current) {
        if (modelingLayerRef.current) {
          console.log("🗺️ [MODELING] Cleanup: retrait du layer WMTS");
          mapRef.current.removeLayer(modelingLayerRef.current);
          modelingLayerRef.current = null;
        }
        if (windLayerGroupRef.current) {
          console.log("🗺️ [MODELING] Cleanup: retrait du layer de vent");
          mapRef.current.removeLayer(windLayerGroupRef.current);
          windLayerGroupRef.current = null;
          windLayerRef.current = null;
        }
      }
      setCurrentModelingWMTSLayer(null);
      setCurrentModelingLegendUrl(null);
      setCurrentModelingLegendTitle(null);
    };
  }, [
    currentModelingLayer,
    selectedTimeStep,
    selectedPollutant,
    loadWindModeling,
    mapRef,
  ]);

  return {
    currentTileLayer,
    currentModelingWMTSLayer,
    currentModelingLegendUrl,
    currentModelingLegendTitle,
  };
};

