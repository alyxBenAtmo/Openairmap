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
