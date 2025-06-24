// Types pour les sources de données
export interface SubSource {
  name: string;
  code: string;
  activated: boolean;
}

export interface Source {
  name: string;
  code: string;
  activated: boolean;
  isGroup?: boolean;
  subSources?: Record<string, SubSource>;
}

export interface Sources {
  [key: string]: Source;
}

// Types pour les seuils de qualité de l'air
export interface Seuil {
  code: string;
  min: number;
  max: number;
}

export interface Seuils {
  bon: Seuil;
  moyen: Seuil;
  degrade: Seuil;
  mauvais: Seuil;
  tresMauvais: Seuil;
  extrMauvais: Seuil;
}

// Types pour les polluants
export interface Pollutant {
  name: string;
  code: string;
  unit: string;
  thresholds: Seuils;
}

// Types pour les pas de temps
export interface TimeStep {
  name: string;
  code: string;
  value: number; // en minutes
}

// Types pour les appareils de mesure
export interface MeasurementDevice {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  source: string;
  pollutant: string;
  value: number;
  unit: string;
  timestamp: string;
  status: "active" | "inactive" | "error";
  // Propriétés optionnelles pour les marqueurs
  qualityLevel?: string; // bon, moyen, degrade, mauvais, tresMauvais, extrMauvais, default
  address?: string;
  departmentId?: string;
}

// Types pour les services de données
export interface DataService {
  fetchData(params: {
    pollutant: string;
    timeStep: string;
    sources: string[];
  }): Promise<MeasurementDevice[]>;
}

// Types pour les marqueurs
export interface MarkerConfig {
  source: string;
  pollutant: string;
  value: number;
  thresholds: Pollutant["thresholds"];
}

// Types spécifiques pour AtmoRef
export interface AtmoRefStation {
  id_station: string;
  nom_station: string;
  departement_id: string;
  adresse: string;
  latitude: number;
  longitude: number;
  en_service: boolean;
  date_debut_mesure: string;
  date_fin_mesure: string | null;
  variables: Record<
    string,
    {
      label: string;
      code_iso: string;
      date_fin: string | null;
      date_debut: string;
      en_service: boolean;
    }
  >;
}

export interface AtmoRefStationsResponse {
  stations: AtmoRefStation[];
}

export interface AtmoRefMeasure {
  date_debut: string;
  valeur: number;
  unite: string;
  nom_station: string;
  id_station: string;
  label_polluant: string;
  polluant_id: string;
  lon: number;
  lat: number;
  validation: string;
  temporalite: string;
}

export interface AtmoRefMeasuresResponse {
  mesures: AtmoRefMeasure[];
}

// Mapping des codes de polluants AtmoRef vers nos codes
export const ATMOREF_POLLUTANT_MAPPING: Record<string, string> = {
  "01": "so2", // SO2
  "02": "no", // NO (pas dans nos polluants)
  "03": "no2", // NO2
  "08": "o3", // O3
  "12": "nox", // NOx (pas dans nos polluants)
  "24": "pm10", // PM10
  "39": "pm25", // PM2.5
  "68": "pm1", // PM1
};
