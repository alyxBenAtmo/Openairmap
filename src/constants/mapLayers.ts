import L from "leaflet";

export const baseLayers = {
  "Carte standard": L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      pane: "tilePane",
      minZoom: 1,
      maxZoom: 18,
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
