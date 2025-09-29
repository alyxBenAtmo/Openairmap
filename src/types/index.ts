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
    mobileAirPeriod?: { startDate: string; endDate: string };
    selectedSensors?: string[];
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

// Mapping des variables AtmoMicro vers nos codes de polluants
export const ATMOMICRO_POLLUTANT_MAPPING: Record<string, string> = {
  "PM2.5": "pm25",
  PM10: "pm10",
  PM1: "pm1",
  NO2: "no2",
  O3: "o3",
  SO2: "so2",
};

// Types pour le side panel et les données historiques
export interface HistoricalDataPoint {
  timestamp: string;
  value: number;
  unit: string;
  // Propriétés pour les données corrigées (AtmoMicro)
  corrected_value?: number; // Valeur corrigée si disponible
  raw_value?: number; // Valeur brute originale
  has_correction?: boolean; // Indique si une correction a été appliquée
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

// Types pour la visualisation temporelle
export interface TemporalVisualizationState {
  isActive: boolean;
  startDate: string;
  endDate: string;
  currentDate: string;
  isPlaying: boolean;
  playbackSpeed: number; // 1x, 2x, 4x, 8x
  timeStep: string; // Pas de temps pour la navigation
  data: TemporalDataPoint[];
  loading: boolean;
  error: string | null;
}

export interface TemporalDataPoint {
  timestamp: string;
  devices: MeasurementDevice[];
  // Métadonnées pour l'optimisation
  deviceCount: number;
  averageValue: number;
  qualityLevels: Record<string, number>;
}

export interface TemporalControls {
  startDate: string;
  endDate: string;
  currentDate: string;
  isPlaying: boolean;
  playbackSpeed: number;
  timeStep: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onCurrentDateChange: (date: string) => void;
  onPlayPause: () => void;
  onSpeedChange: (speed: number) => void;
  onTimeStepChange: (timeStep: string) => void;
  onReset: () => void;
}

// Types pour les contrôles de mode historique
export interface HistoricalModeButtonProps {
  isActive: boolean;
  onToggle: () => void;
}

export interface HistoricalControlPanelProps {
  isVisible: boolean;
  onClose: () => void;
  onToggleHistoricalMode?: () => void;
  state: TemporalVisualizationState;
  controls: TemporalControls;
}

export interface DateRangeSelectorProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  maxDateRange: number; // Limite en jours (ex: 365)
  disabled?: boolean;
}

// Types spécifiques pour NebuleAir
export interface NebuleAirSensor {
  sensorId: string;
  time: string;
  timeUTC: string;
  COV: string;
  PM1: string;
  PM25: string;
  PM10: string;
  PM1_qh: string;
  PM25_qh: string;
  PM10_qh: string;
  PM1_h: string;
  PM25_h: string;
  PM10_h: string;
  PM1_d: string | null;
  PM25_d: string | null;
  PM10_d: string | null;
  TEMP: string;
  HUM: string;
  latitude: string;
  longitude: string;
  wifi_signal: string;
  AtmoSud: boolean;
  last_seen_sec: number;
  connected: boolean;
  displayMap: boolean;
  check_token: boolean;
  room: string | null;
  etage: string | null;
}

export interface NebuleAirMetadataResponse {
  sensors: NebuleAirSensor[];
}

export interface NebuleAirDataResponse {
  data: NebuleAirSensor[];
}

// Mapping des polluants NebuleAir vers nos codes
export const NEBULEAIR_POLLUTANT_MAPPING: Record<string, string> = {
  PM1: "pm1",
  PM25: "pm25",
  PM10: "pm10",
  // Note: NebuleAir ne mesure que les particules fines (PM1, PM2.5, PM10)
  // Les autres polluants (NO2, O3, SO2) ne sont pas disponibles
};

// Mapping des pas de temps NebuleAir vers nos codes
export const NEBULEAIR_TIMESTEP_MAPPING: Record<string, string> = {
  instantane: "", // Pas de suffixe pour les valeurs instantanées (2min)
  deuxMin: "", // Pas de suffixe pour les valeurs 2min
  quartHeure: "_qh", // Quart-horaire
  heure: "_h", // Horaire
  jour: "_d", // Journalier
};

// Types spécifiques pour MobileAir
export interface MobileAirSensor {
  sensorId: string;
  sensorToken: string;
  time: string;
  timeUTC: string;
  COV: string | null;
  PM1: string | null;
  PM25: string | null;
  PM10: string | null;
  TEMP: string | null;
  HUM: string | null;
  latitude: string;
  longitude: string;
  wifi_signal: string | null;
  last_seen_sec: number;
  connected: boolean;
  displayMap: boolean;
}

export interface MobileAirMetadataResponse {
  sensors: MobileAirSensor[];
}

export interface MobileAirDataPoint {
  time: string;
  sensorId: string;
  sessionId: number;
  sat: number;
  PM1: number;
  PM25: number;
  PM10: number;
  lat: number;
  lon: number;
}

export interface MobileAirDataResponse {
  data: MobileAirDataPoint[];
}

// Type pour représenter un parcours MobileAir (session)
export interface MobileAirRoute {
  sessionId: number;
  sensorId: string;
  points: MobileAirDataPoint[];
  pollutant: string;
  averageValue: number;
  maxValue: number;
  minValue: number;
  startTime: string;
  endTime: string;
  duration: number; // en minutes
}

// Mapping des polluants MobileAir vers nos codes
export const MOBILEAIR_POLLUTANT_MAPPING: Record<string, string> = {
  PM1: "pm1",
  PM25: "pm25",
  PM10: "pm10",
  // Note: MobileAir ne mesure que les particules fines (PM1, PM2.5, PM10)
  // Les autres polluants (NO2, O3, SO2) ne sont pas disponibles
};

// Mapping des pas de temps MobileAir vers les paramètres d'API
export const MOBILEAIR_TIMESTEP_MAPPING: Record<string, string> = {
  instantane: "-18d", // 18 jours pour avoir assez de données
  deuxMin: "-18d", // 18 jours pour avoir assez de données
  quartHeure: "-18d", // 18 jours pour avoir assez de données
  heure: "-18d", // 18 jours pour avoir assez de données
  jour: "-18d", // 18 jours pour avoir assez de données
};

// Types spécifiques pour Sensor Community
export interface SensorCommunityDataPoint {
  sampling_rate: number | null;
  sensordatavalues: Array<{
    value: string;
    id: number;
    value_type: string;
  }>;
  location: {
    latitude: string;
    exact_location: number;
    longitude: string;
    id: number;
    indoor: number;
    country: string;
    altitude: string;
  };
  timestamp: string;
  id: number;
  sensor: {
    pin: string;
    sensor_type: {
      manufacturer: string;
      id: number;
      name: string;
    };
    id: number;
  };
}

export interface SensorCommunityResponse {
  data: SensorCommunityDataPoint[];
}

// Mapping des polluants Sensor Community vers nos codes
export const SENSORCOMMUNITY_POLLUTANT_MAPPING: Record<string, string> = {
  P0: "pm1", // PM1 (particules fines < 1µm)
  P1: "pm10", // PM10 (particules fines < 10µm)
  P2: "pm25", // PM2.5 (particules fines < 2.5µm)
};

// Mapping inverse pour construire les requêtes
export const SENSORCOMMUNITY_POLLUTANT_REVERSE_MAPPING: Record<string, string> =
  {
    pm1: "P0",
    pm10: "P1",
    pm25: "P2",
  };

// Mapping des pas de temps Sensor Community vers les paramètres d'API
export const SENSORCOMMUNITY_TIMESTEP_MAPPING: Record<string, string> = {
  instantane: "1min",
  deuxMin: "2min",
  quartHeure: "15min",
  heure: "1h",
  jour: "1d",
};
