// Types pour les sources de données
export interface SubSource {
  name: string;
  code: string;
  activated: boolean;
  supportedTimeSteps?: string[];
}

export interface Source {
  name: string;
  code: string;
  activated: boolean;
  isGroup?: boolean;
  subSources?: Record<string, SubSource>;
  supportedTimeSteps?: string[];
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
  // Propriétés pour les valeurs corrigées (AtmoMicro)
  corrected_value?: number; // Valeur corrigée si disponible
  raw_value?: number; // Valeur brute originale
  has_correction?: boolean; // Indique si une correction a été appliquée
}

// Types spécifiques pour SignalAir
export interface SignalAirProperties {
  signalType: string;
  signalCreatedAt: string;
  signalDuration: string;
  signalHasSymptoms: string;
  signalSymptoms: string;
  signalDescription: string;
}

// Nouveau type pour les signalements SignalAir
export interface SignalAirReport {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  source: string;
  signalType: string;
  timestamp: string;
  status: "active" | "inactive" | "error";
  // Propriétés optionnelles pour les marqueurs
  qualityLevel?: string; // bon, moyen, degrade, mauvais, tresMauvais, extrMauvais, default
  address?: string;
  departmentId?: string;
  // Propriétés spécifiques à SignalAir
  signalCreatedAt: string;
  signalDuration: string;
  signalHasSymptoms: string;
  signalSymptoms: string;
  signalDescription: string;
}

// Types pour les services de données
export interface DataService {
  fetchData(params: {
    pollutant: string;
    timeStep: string;
    sources: string[];
    signalAirPeriod?: { startDate: string; endDate: string };
  }): Promise<MeasurementDevice[] | SignalAirReport[]>;
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

// Types pour le side panel et les données historiques
export interface HistoricalDataPoint {
  timestamp: string;
  value: number;
  unit: string;
}

export interface StationVariable {
  label: string;
  code_iso: string;
  en_service: boolean;
}

export interface StationInfo {
  id: string;
  name: string;
  address: string;
  departmentId: string;
  source: string;
  variables: Record<string, StationVariable>;
}

export interface ChartControls {
  selectedPollutants: string[];
  timeRange: {
    type: "preset" | "custom";
    preset?: "3h" | "24h" | "7d" | "1y";
    custom?: {
      startDate: string;
      endDate: string;
    };
  };
  timeStep: string;
}

export interface SidePanelState {
  isOpen: boolean;
  selectedStation: StationInfo | null;
  chartControls: ChartControls;
  historicalData: Record<string, HistoricalDataPoint[]>;
  loading: boolean;
  error: string | null;
}

// Types spécifiques pour AtmoMicro
export interface AtmoMicroSite {
  id_site: number;
  nom_site: string;
  type_site: string;
  influence: string;
  lon: number;
  lat: number;
  code_station_commun: string | null;
  date_debut_site: string;
  date_fin_site: string;
  alti_mer: number | null;
  alti_sol: number | null;
  id_campagne: number;
  nom_campagne: string;
  id_capteur: number;
  marque_capteur: string;
  modele_capteur: string;
  variables: string;
}

export interface AtmoMicroMeasure {
  id_site: number;
  nom_site: string;
  variable: string;
  time: string;
  lat: number;
  lon: number;
  id_pas_de_temps: number;
  pas_de_temps: number;
  valeur: number | null; // Valeur corrigée (peut être null)
  valeur_ref: number | null; // Valeur de référence corrigée
  valeur_brute: number; // Valeur brute
  marque_capteur: string;
  modele_capteur: string;
  coef_corr: number | null; // Coefficient de correction
  biais_corr: number | null; // Biais de correction
  unite: string;
  code_etat: string;
}

export interface AtmoMicroSitesResponse {
  sites: AtmoMicroSite[];
}

export interface AtmoMicroMeasuresResponse {
  mesures: AtmoMicroMeasure[];
}

// Types pour le clustering
export interface ClusterConfig {
  enabled: boolean;
  maxClusterRadius: number;
  spiderfyOnMaxZoom: boolean;
  showCoverageOnHover: boolean;
  zoomToBoundsOnClick: boolean;
  animate: boolean;
  animateAddingMarkers: boolean;
}

// Types pour les statistiques
export interface MapStatistics {
  totalDevices: number;
  totalReports: number;
  devicesBySource: Record<string, number>;
  reportsByType: Record<string, number>;
  qualityLevels: Record<string, number>;
  averageValue: number;
  minValue: number;
  maxValue: number;
  activeDevices: number;
  inactiveDevices: number;
}

// Types pour les contrôles de clustering
export interface ClusterControlProps {
  config: ClusterConfig;
  onConfigChange: (config: ClusterConfig) => void;
}

// Types pour les contrôles de statistiques
export interface StatisticsControlProps {
  statistics: MapStatistics;
  isVisible: boolean;
  onToggleVisibility: () => void;
}
