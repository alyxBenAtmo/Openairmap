import { Pollutant } from "../types";

// Configuration des seuils pour les particules fines PM1 et PM2.5
export const seuilsPm1Pm25 = {
  bon: { code: "bon", min: 0, max: 5 },
  moyen: { code: "moyen", min: 6, max: 15 },
  degrade: { code: "degrade", min: 16, max: 50 },
  mauvais: { code: "mauvais", min: 51, max: 90 },
  tresMauvais: { code: "tresMauvais", min: 91, max: 140 },
  extrMauvais: { code: "extrMauvais", min: 141, max: 9999 },
};

// Configuration des seuils pour les particules fines PM10
export const seuilsPm10 = {
  bon: { code: "bon", min: 0, max: 15 },
  moyen: { code: "moyen", min: 16, max: 45 },
  degrade: { code: "degrade", min: 46, max: 120 },
  mauvais: { code: "mauvais", min: 121, max: 195 },
  tresMauvais: { code: "tresMauvais", min: 196, max: 270 },
  extrMauvais: { code: "extrMauvais", min: 271, max: 10000 },
};

// Configuration des seuils pour le dioxyde d'azote (NO2)
export const seuilsNo2 = {
  bon: { code: "bon", min: 0, max: 10 },
  moyen: { code: "moyen", min: 11, max: 25 },
  degrade: { code: "degrade", min: 26, max: 60 },
  mauvais: { code: "mauvais", min: 61, max: 100 },
  tresMauvais: { code: "tresMauvais", min: 101, max: 150 },
  extrMauvais: { code: "extrMauvais", min: 151, max: 9999 },
};

// Configuration des seuils pour l'ozone (O3)
export const seuilsO3 = {
  bon: { code: "bon", min: 0, max: 60 },
  moyen: { code: "moyen", min: 61, max: 100 },
  degrade: { code: "degrade", min: 101, max: 120 },
  mauvais: { code: "mauvais", min: 121, max: 160 },
  tresMauvais: { code: "tresMauvais", min: 161, max: 180 },
  extrMauvais: { code: "extrMauvais", min: 181, max: 9999 },
};

// Configuration des seuils pour le dioxyde de soufre (SO2)
export const seuilsSo2 = {
  bon: { code: "bon", min: 0, max: 20 },
  moyen: { code: "moyen", min: 21, max: 40 },
  degrade: { code: "degrade", min: 41, max: 125 },
  mauvais: { code: "mauvais", min: 126, max: 190 },
  tresMauvais: { code: "tresMauvais", min: 191, max: 275 },
  extrMauvais: { code: "extrMauvais", min: 276, max: 9999 },
};

export const pollutants: Record<string, Pollutant> = {
  pm1: {
    name: "PM₁",
    code: "pm1",
    unit: "µg/m³",
    thresholds: seuilsPm1Pm25,
  },
  pm25: {
    name: "PM₂.₅",
    code: "pm25",
    unit: "µg/m³",
    thresholds: seuilsPm1Pm25,
  },
  pm10: {
    name: "PM₁₀",
    code: "pm10",
    unit: "µg/m³",
    thresholds: seuilsPm10,
  },
  no2: {
    name: "NO₂",
    code: "no2",
    unit: "µg/m³",
    thresholds: seuilsNo2,
  },
  so2: {
    name: "SO₂",
    code: "so2",
    unit: "µg/m³",
    thresholds: seuilsSo2,
  },
  o3: {
    name: "O₃",
    code: "o3",
    unit: "µg/m³",
    thresholds: seuilsO3,
  },
};

// Configuration des polluants avec leur état d'activation
export const mesures = {
  pm1: { name: "PM₁", code: "pm1", activated: false }, // Particules fines de diamètre inférieur à 1 µm
  pm25: { name: "PM₂.₅", code: "pm25", activated: true }, // Particules fines de diamètre inférieur à 2.5 µm
  pm10: { name: "PM₁₀", code: "pm10", activated: false }, // Particules fines de diamètre inférieur à 10 µm
  no2: { name: "NO₂", code: "no2", activated: false }, // Dioxyde d'azote
  so2: { name: "SO₂", code: "so2", activated: false }, // Dioxyde de soufre
  o3: { name: "O₃", code: "o3", activated: false }, // Ozone
};

// Fonction pour obtenir le polluant par défaut
export const getDefaultPollutant = (): string => {
  const defaultPollutant = Object.entries(mesures).find(
    ([_, config]) => config.activated
  );
  return defaultPollutant ? defaultPollutant[0] : "pm25";
};

// Définition des couleurs pour les polluants dans les graphiques
export const POLLUTANT_COLORS = {
  pm1: "#b7cee5",
  pm25: "#66b2ff",
  pm10: "#0066cc",
  no2: "#A133FF",
  o3: "#FFEEAD",
  so2: "#D4A5A5",
  h2s: "#9B59B6",
  nh3: "#3498DB",
};
