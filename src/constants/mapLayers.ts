import L from "leaflet";

export const baseLayers = {
  "Carte standard": L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      pane: "tilePane",
      minZoom: 1,
      maxZoom: 18,
    }
  ),
  "Carte OSM": L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      pane: "tilePane",
      minZoom: 1,
      maxZoom: 19,
    }
  ),
  "Satellite IGN": L.tileLayer(
    "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
    {
      attribution: '&copy; <a href="https://www.ign.fr/">IGN</a>',
      pane: "tilePane",
      minZoom: 1,
      maxZoom: 19,
    }
  ), 
};

export type BaseLayerKey = keyof typeof baseLayers;

// Types de layers de modélisation
export type ModelingLayerType = 
  | "icaireh"           // ICAIR'H (Modélisation multipolluant)
  | "pollutant"         // Modélisation polluant sélectionné
  | "vent";             // Vent

export const modelingLayers: Record<ModelingLayerType, string> = {
  icaireh: "ICAIR'H",
  pollutant: "Modélisation polluant sélectionné",
  vent: "Vent",
};
