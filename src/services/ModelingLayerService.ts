import L from "leaflet";

// Configuration WMTS
const WMTS_CONFIG = {
  url: "https://azurh-geoservices.atmosud.org/geoserver/gwc/service/wmts",
  folder: "azur_heure",
  version: "1.1.1",
  opacity: 0.7,
  tilematrixset: "EPSG:900913",
  tilesize: 256,
  format: "image/png8",
  attribution: "AtmoSud",
  min_zoom: 0,
  max_zoom: 16,
};

// Mapping des polluants vers les layers (à compléter selon les données disponibles)
const POLLUTANT_LAYER_MAPPING: Record<string, { variable: string; libelle: string }> = {
  pm25: { variable: "pm2_5", libelle: "PM₂.₅" },
  pm10: { variable: "pm10", libelle: "PM₁₀" },
  pm1: { variable: "pm1", libelle: "PM₁" },
  no2: { variable: "no2", libelle: "NO₂" },
  o3: { variable: "o3", libelle: "O₃" },
  so2: { variable: "so2", libelle: "SO₂" },
};

/**
 * Calcule l'index horaire (0-47) à afficher selon le pas de temps
 * Les layers vont de h00 à h47, où :
 * - h24 = heure en cours
 * - h23 = heure précédente
 * - h22 = il y a 2 heures
 * - etc.
 * @param timeStep - Le pas de temps sélectionné
 * @returns L'index horaire (0-47) correspondant au suffixe du layer (ex: 24 pour h24) ou -1 si indisponible
 */
export function getModelingLayerHour(timeStep: string): number {
  const now = new Date();
  const currentMinutes = now.getMinutes();
  
  // Calculer l'index du layer (h24 = maintenant, h23 = il y a 1h, etc.)
  let layerIndex: number;

  switch (timeStep) {
    case "heure":
      // Dernière heure pleine = heure précédente = h23
      layerIndex = 23;
      break;

    case "quartHeure":
      // Pendant les 15 premières minutes : heure précédente = h23
      // Pendant les 15 dernières minutes : heure actuelle = h24
      if (currentMinutes < 15) {
        layerIndex = 23;
      } else {
        layerIndex = 24;
      }
      break;

    case "deuxMin":
      // Toujours l'heure actuelle = h24
      layerIndex = 24;
      break;

    case "instantane":
    case "scan":
      // Désactivé pour scan
      return -1;

    default:
      // Par défaut, dernière heure pleine = h23
      layerIndex = 23;
  }

  return layerIndex;
}

/**
 * Génère le nom du layer horaire
 * @param hour - L'heure (0-47, représentant h00 à h47)
 * @returns Le nom du layer (ex: "paca_icairh_h24")
 */
export function formatHourLayerName(hour: number): string {
  return `h${hour.toString().padStart(2, "0")}`;
}

/**
 * Génère le nom complet du layer pour ICAIR'H
 * @param hour - L'heure formatée (ex: "h24")
 * @returns Le nom complet du layer (ex: "azur_heure:paca_icairh_h24")
 */
export function getIcairehLayerName(hour: string): string {
  return `${WMTS_CONFIG.folder}:paca_icairh_${hour}`;
}

/**
 * Génère le nom complet du layer pour un polluant
 * @param pollutant - Le code du polluant (ex: "pm25")
 * @param hour - L'heure formatée (ex: "h24")
 * @returns Le nom complet du layer (ex: "azur_heure:paca_pm2_5_h24")
 */
export function getPollutantLayerName(pollutant: string, hour: string): string {
  const pollutantInfo = POLLUTANT_LAYER_MAPPING[pollutant];
  if (!pollutantInfo) {
    throw new Error(`Polluant non supporté: ${pollutant}`);
  }
  return `${WMTS_CONFIG.folder}:paca_${pollutantInfo.variable}_${hour}`;
}

/**
 * Crée un layer WMTS Leaflet pour la modélisation
 * @param layerName - Le nom complet du layer (ex: "azur_heure:paca_icairh_h24")
 * @returns Un layer Leaflet WMTS
 */
export function createModelingWMSLayer(layerName: string): L.TileLayer {
  // Construction de l'URL template pour WMTS selon le format GeoServer qui fonctionne
  // Format: {url}?SERVICE=WMTS&REQUEST=GetTile&VERSION={version}&LAYER={layer}&TILEMATRIXSET={tilematrixset}&FORMAT={format}&TILEMATRIX={tilematrixset}:{z}&TILEROW={y}&TILECOL={x}
  // Note: 
  // - Pas de paramètre STYLE
  // - TILEMATRIX doit inclure le préfixe du TILEMATRIXSET (ex: EPSG:900913:11)
  // - Ordre des paramètres important pour GeoServer
  const urlTemplate = `${WMTS_CONFIG.url}?SERVICE=WMTS&REQUEST=GetTile&VERSION=${WMTS_CONFIG.version}&LAYER=${layerName}&TILEMATRIXSET=${WMTS_CONFIG.tilematrixset}&FORMAT=${WMTS_CONFIG.format}&TILEMATRIX=${WMTS_CONFIG.tilematrixset}:{z}&TILEROW={y}&TILECOL={x}`;
  
  return L.tileLayer(urlTemplate, {
    attribution: WMTS_CONFIG.attribution,
    opacity: WMTS_CONFIG.opacity,
    minZoom: WMTS_CONFIG.min_zoom,
    maxZoom: WMTS_CONFIG.max_zoom,
    pane: "overlayPane", // Au-dessus du fond de carte mais sous les marqueurs
    tileSize: WMTS_CONFIG.tilesize,
  });
}

/**
 * Détermine si les modélisations sont disponibles pour un pas de temps donné
 * @param timeStep - Le pas de temps
 * @returns true si les modélisations sont disponibles
 */
export function isModelingAvailable(timeStep: string): boolean {
  return timeStep !== "instantane" && timeStep !== "scan";
}

