import L from "leaflet";

const GEOSERVER_BASE_URL = "https://geoservices.atmosud.org/geoserver/cigale/ows";

/**
 * Charge les données communales via WFS et crée un layer GeoJSON
 * Cette approche permet un contrôle total sur le style (contours uniquement)
 * @param map - La carte Leaflet
 * @returns Une promesse qui résout avec un LayerGroup contenant les polygones communaux
 */
export async function createCommunalGeoJSONLayer(
  map: L.Map
): Promise<L.LayerGroup> {
  if (!map) {
    throw new Error("La carte n'est pas initialisée");
  }

  const wfsUrl = new URL(GEOSERVER_BASE_URL);
  wfsUrl.searchParams.set("service", "WFS");
  wfsUrl.searchParams.set("version", "1.0.0");
  wfsUrl.searchParams.set("request", "GetFeature");
  wfsUrl.searchParams.set("typeName", "cigale:entites_simplified");
  wfsUrl.searchParams.set("outputFormat", "application/json");
  wfsUrl.searchParams.set("srsName", "EPSG:4326");
  // Note: bbox et cql_filter sont mutuellement exclusifs dans WFS
  // On utilise uniquement cql_filter pour filtrer les communes de la région
  wfsUrl.searchParams.set(
    "cql_filter",
    "rang_entite=4 and (id_entite/1000 = 4 or id_entite/1000 = 5 or id_entite/1000 = 6 or id_entite/1000 = 13 or id_entite/1000 = 83 or id_entite/1000 = 84)"
  );

  try {
    const response = await fetch(wfsUrl.toString());
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const geoJsonData = await response.json();

    // Créer un style pour n'afficher que les contours
    const style: L.PathOptions = {
      color: "#666666",
      weight: 1,
      opacity: 0.8,
      fill: true,
      fillColor: "#000000",
      fillOpacity: 0, // Pas de remplissage, seulement les contours
    };

    // Style au survol
    const hoverStyle: L.PathOptions = {
      color: "#333333",
      weight: 2,
      opacity: 1.0,
      fill: true,
      fillColor: "#000000",
      fillOpacity: 0,
    };

    // Créer le layer GeoJSON avec le style personnalisé et les événements de survol
    const geoJsonLayer = L.geoJSON(geoJsonData as any, {
      style: style,
      pane: "overlayPane", // Au-dessus du fond de carte mais sous les marqueurs
      onEachFeature: (feature, layer) => {
        // Récupérer le nom de la commune depuis les propriétés
        const communeName = feature.properties?.nom_entite || "Commune";

        // Créer un tooltip pour afficher le nom de la commune
        layer.bindTooltip(communeName, {
          permanent: false,
          direction: "center",
          className: "communal-layer-tooltip",
          offset: [0, 0],
        });

        // Ajouter les événements de survol pour changer le style
        layer.on({
          mouseover: (e) => {
            const layer = e.target as L.Path;
            layer.setStyle(hoverStyle);
            layer.openTooltip();
          },
          mouseout: (e) => {
            const layer = e.target as L.Path;
            layer.setStyle(style);
            layer.closeTooltip();
          },
        });
      },
    });

    return L.layerGroup([geoJsonLayer]);
  } catch (error) {
    console.error("Erreur lors du chargement des données communales:", error);
    throw error;
  }
}

/**
 * Crée un layer WMS Leaflet pour le découpage communal
 * Version simplifiée sans SLD - utilise une opacité très faible
 * @returns Un layer Leaflet WMS
 */
export function createCommunalWMSLayer(): L.TileLayer.WMS {
  return L.tileLayer.wms(GEOSERVER_BASE_URL.replace("/ows", "/wms"), {
    layers: "cigale:entites_simplified",
    format: "image/png",
    transparent: true,
    version: "1.1.0",
    attribution: "AtmoSud",
    opacity: 0.3, // Opacité très faible pour voir le fond de carte
    minZoom: 1,
    maxZoom: 18,
    pane: "overlayPane",
    cql_filter: "rang_entite=4 and (id_entite/1000 = 4 or id_entite/1000 = 5 or id_entite/1000 = 6 or id_entite/1000 = 13 or id_entite/1000 = 83 or id_entite/1000 = 84)",
  });
}
