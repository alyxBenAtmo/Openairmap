import { BaseDataService } from "./BaseDataService";
import {
  MeasurementDevice,
  NebuleAirSensor,
  NebuleAirMetadataResponse,
  NEBULEAIR_POLLUTANT_MAPPING,
  NEBULEAIR_TIMESTEP_MAPPING,
} from "../types";
import { getAirQualityLevel } from "../utils";
import { pollutants } from "../constants/pollutants";

export class NebuleAirService extends BaseDataService {
  private readonly BASE_URL = "/aircarto";

  constructor() {
    super("nebuleair");
  }

  async fetchData(params: {
    pollutant: string;
    timeStep: string;
    sources: string[];
    signalAirPeriod?: { startDate: string; endDate: string };
    mobileAirPeriod?: { startDate: string; endDate: string };
    selectedSensors?: string[];
  }): Promise<MeasurementDevice[]> {
    try {
      // Vérifier si le polluant est supporté par NebuleAir
      const nebuleAirPollutant = this.getNebuleAirPollutantName(
        params.pollutant
      );
      if (!nebuleAirPollutant) {
        console.warn(`Polluant ${params.pollutant} non supporté par NebuleAir`);
        return [];
      }

      // Vérifier si le pas de temps est supporté par NebuleAir
      const timeStepSuffix = this.getNebuleAirTimeStepSuffix(params.timeStep);
      if (timeStepSuffix === null) {
        console.warn(
          `Pas de temps ${params.timeStep} non supporté par NebuleAir`
        );
        return [];
      }

      // Récupérer les données des capteurs
      const sensorsData = await this.fetchSensorsData();

      // Transformer les données en MeasurementDevice
      const devices: MeasurementDevice[] = [];

      for (const sensor of sensorsData) {
        // Vérifier si le capteur doit être affiché sur la carte
        if (!sensor.displayMap) {
          continue;
        }

        // Vérifier si le capteur a des coordonnées valides
        const lat = parseFloat(sensor.latitude);
        const lon = parseFloat(sensor.longitude);
        if (isNaN(lat) || isNaN(lon) || lat === 0 || lon === 0) {
          continue;
        }

        // Récupérer la valeur selon le polluant et le pas de temps
        const value = this.extractSensorValue(
          sensor,
          nebuleAirPollutant,
          timeStepSuffix
        );

        // Vérifier si la donnée est récente selon le pas de temps
        const isDataRecent = this.isDataRecent(sensor.time, params.timeStep);

        if (value === null || value === -1 || !isDataRecent) {
          // Capteur sans donnée valide ou donnée trop ancienne - utiliser le marqueur par défaut
          devices.push({
            id: sensor.sensorId,
            name: `NebuleAir ${sensor.sensorId}`,
            latitude: lat,
            longitude: lon,
            source: this.sourceCode,
            pollutant: params.pollutant,
            value: 0,
            unit: "µg/m³",
            timestamp: sensor.time,
            status: "inactive",
            qualityLevel: "default",
          } as MeasurementDevice & { qualityLevel: string });
        } else {
          // Capteur avec donnée valide et récente - considérer comme actif
          const pollutant = pollutants[params.pollutant];
          // Utiliser la valeur arrondie pour la cohérence avec l'affichage
          const roundedValue = Math.round(value);
          const qualityLevel = getAirQualityLevel(
            roundedValue,
            pollutant.thresholds
          );

          devices.push({
            id: sensor.sensorId,
            name: `NebuleAir ${sensor.sensorId}`,
            latitude: lat,
            longitude: lon,
            source: this.sourceCode,
            pollutant: params.pollutant,
            value: value, // Garder la valeur exacte pour les calculs
            unit: "µg/m³",
            timestamp: sensor.time,
            status: "active", // Toujours actif si on a une valeur valide et récente
            qualityLevel,
          } as MeasurementDevice & { qualityLevel: string });
        }
      }

      return devices;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données NebuleAir:",
        error
      );
      throw error;
    }
  }

  private async fetchSensorsData(): Promise<NebuleAirSensor[]> {
    try {
      const url = `${this.BASE_URL}/capteurs/metadata?capteurType=NebuleAir&format=JSON`;
      console.log("🌐 [NebuleAir] Appel API metadata:", url);

      const response = await this.makeRequest(url);
      console.log("📥 [NebuleAir] Réponse metadata:", response);

      // Vérifier si la réponse est valide (pas de HTML)
      if (typeof response === "string" && response.includes("<html")) {
        console.warn(
          "❌ [NebuleAir] L'API NebuleAir retourne du HTML, utilisation de données simulées"
        );
        return this.getMockSensorsData();
      }

      // L'API retourne directement un tableau de capteurs
      if (Array.isArray(response)) {
        console.log("✅ [NebuleAir] Capteurs récupérés:", response.length);
        // Filtrer les capteurs qui ont displayMap = true
        const displayableSensors = response.filter(
          (sensor) => sensor.displayMap === true
        );
        console.log(
          "✅ [NebuleAir] Capteurs affichables:",
          displayableSensors.length
        );
        return displayableSensors;
      }

      // Si la réponse est encapsulée dans un objet
      if (response.sensors && Array.isArray(response.sensors)) {
        console.log(
          "✅ [NebuleAir] Capteurs récupérés (sensors):",
          response.sensors.length
        );
        const displayableSensors = response.sensors.filter(
          (sensor) => sensor.displayMap === true
        );
        console.log(
          "✅ [NebuleAir] Capteurs affichables (sensors):",
          displayableSensors.length
        );
        return displayableSensors;
      }

      if (response.data && Array.isArray(response.data)) {
        console.log(
          "✅ [NebuleAir] Capteurs récupérés (data):",
          response.data.length
        );
        const displayableSensors = response.data.filter(
          (sensor) => sensor.displayMap === true
        );
        console.log(
          "✅ [NebuleAir] Capteurs affichables (data):",
          displayableSensors.length
        );
        return displayableSensors;
      }

      console.warn(
        "❌ [NebuleAir] Format de réponse NebuleAir non reconnu:",
        response
      );
      return this.getMockSensorsData();
    } catch (error) {
      console.warn(
        "❌ [NebuleAir] Erreur lors de l'appel à l'API NebuleAir, utilisation de données simulées:",
        error
      );

      // Données simulées pour le développement - utiliser un capteur qui a des données historiques
      console.log(
        "⚠️ [NebuleAir] Utilisation de données simulées avec capteur qui a des données historiques"
      );
      return this.getMockSensorsData();
    }
  }

  private getMockSensorsData(): NebuleAirSensor[] {
    return [
      {
        sensorId: "nebuleair-180", // Capteur qui a des données historiques réelles
        time: "2025-09-02T15:15:00Z",
        timeUTC: "2025-09-02T15:15:00Z",
        COV: "-1",
        PM1: "1.58",
        PM25: "2.33",
        PM10: "4.27",
        PM1_qh: "1.58",
        PM25_qh: "2.33",
        PM10_qh: "4.27",
        PM1_h: "1.58",
        PM25_h: "2.33",
        PM10_h: "4.27",
        PM1_d: null,
        PM25_d: null,
        PM10_d: null,
        TEMP: "27.37",
        HUM: "35.84",
        latitude: "43.2965",
        longitude: "5.3698",
        wifi_signal: "-80",
        AtmoSud: false,
        last_seen_sec: 1800,
        connected: true,
        displayMap: true,
        check_token: false,
        room: null,
        etage: null,
      },
      {
        sensorId: "nebuleair-pro6",
        time: "2024-11-14 14:18:04",
        timeUTC: "2024-11-14 13:18:04",
        COV: "-1",
        PM1: "2.5",
        PM25: "4.2",
        PM10: "10.8",
        PM1_qh: "2.38",
        PM25_qh: "4.18",
        PM10_qh: "11.73",
        PM1_h: "2.15",
        PM25_h: "3.68",
        PM10_h: "7.45",
        PM1_d: null,
        PM25_d: null,
        PM10_d: null,
        TEMP: "-1",
        HUM: "-1",
        latitude: "43.2965",
        longitude: "5.3698",
        wifi_signal: "-80",
        AtmoSud: false,
        last_seen_sec: 25299029,
        connected: true,
        displayMap: true,
        check_token: false,
        room: null,
        etage: null,
      },
      {
        sensorId: "nebuleair-182",
        time: "2025-02-07 18:29:43",
        timeUTC: "2025-02-07 17:29:43",
        COV: "-1",
        PM1: "7.50",
        PM25: "9.45",
        PM10: "9.70",
        PM1_qh: "7.33",
        PM25_qh: "8.86",
        PM10_qh: "12.01",
        PM1_h: "7.43",
        PM25_h: "9.28",
        PM10_h: "12.46",
        PM1_d: null,
        PM25_d: null,
        PM10_d: null,
        TEMP: "27.16",
        HUM: "26.21",
        latitude: "48.79460480",
        longitude: "2.12150390",
        wifi_signal: "-1",
        AtmoSud: false,
        last_seen_sec: 17939930,
        connected: true,
        displayMap: true,
        check_token: false,
        room: null,
        etage: null,
      },
      {
        sensorId: "nebuleair-test1",
        time: "2025-02-07 18:30:00",
        timeUTC: "2025-02-07 17:30:00",
        COV: "-1",
        PM1: "15.2",
        PM25: "18.7",
        PM10: "22.1",
        PM1_qh: "14.8",
        PM25_qh: "18.2",
        PM10_qh: "21.5",
        PM1_h: "15.0",
        PM25_h: "18.5",
        PM10_h: "21.8",
        PM1_d: null,
        PM25_d: null,
        PM10_d: null,
        TEMP: "20.5",
        HUM: "45.2",
        latitude: "43.7102",
        longitude: "7.262",
        wifi_signal: "-65",
        AtmoSud: false,
        last_seen_sec: 1800,
        connected: true,
        displayMap: true,
        check_token: false,
        room: null,
        etage: null,
      },
    ];
  }

  private getNebuleAirPollutantName(pollutant: string): string | null {
    // Mapping inverse : nos codes vers les codes NebuleAir
    const reverseMapping: Record<string, string> = {};
    Object.entries(NEBULEAIR_POLLUTANT_MAPPING).forEach(
      ([nebuleAir, ourCode]) => {
        reverseMapping[ourCode] = nebuleAir;
      }
    );

    return reverseMapping[pollutant] || null;
  }

  private getNebuleAirTimeStepSuffix(timeStep: string): string | null {
    return NEBULEAIR_TIMESTEP_MAPPING[timeStep] !== undefined
      ? NEBULEAIR_TIMESTEP_MAPPING[timeStep]
      : null;
  }

  private extractSensorValue(
    sensor: NebuleAirSensor,
    pollutant: string,
    timeStepSuffix: string
  ): number | null {
    // Construire le nom de la propriété selon le polluant et le pas de temps
    const propertyName = `${pollutant}${timeStepSuffix}`;

    // Récupérer la valeur depuis l'objet sensor
    const value = (sensor as any)[propertyName];

    if (value === null || value === undefined || value === "-1") {
      return null;
    }

    const numericValue = parseFloat(value);
    return isNaN(numericValue) ? null : numericValue;
  }

  private isDataRecent(timestamp: string, timeStep: string): boolean {
    try {
      const dataTime = new Date(timestamp);
      const now = new Date();
      const timeDiffMs = now.getTime() - dataTime.getTime();
      const timeDiffMinutes = timeDiffMs / (1000 * 60);

      // Définir les seuils de fraîcheur selon le pas de temps
      const freshnessThresholds: Record<string, number> = {
        instantane: 3, // 3 minutes pour les données instantanées
        deuxMin: 3, // 3 minutes pour les données 2min
        quartHeure: 16, // 16 minutes pour les données 15min
        heure: 61, // 61 minutes pour les données horaires
        jour: 24 * 60, // 24 heures pour les données journalières
      };

      const threshold = freshnessThresholds[timeStep];
      if (threshold === undefined) {
        console.warn(
          `Pas de temps non reconnu pour la vérification de fraîcheur: ${timeStep}`
        );
        return true; // Par défaut, considérer comme récent
      }

      return timeDiffMinutes <= threshold;
    } catch (error) {
      console.warn(
        `Erreur lors de la vérification de fraîcheur pour ${timestamp}:`,
        error
      );
      return false; // En cas d'erreur, considérer comme non récent
    }
  }

  // Méthode pour récupérer les variables disponibles d'un capteur
  async fetchSiteVariables(
    sensorId: string
  ): Promise<
    Record<string, { label: string; code_iso: string; en_service: boolean }>
  > {
    try {
      console.log("🔍 [NebuleAir] fetchSiteVariables appelé pour:", sensorId);

      // Pour NebuleAir, tous les capteurs supportent les mêmes polluants
      // Pas besoin de faire un appel API pour récupérer les métadonnées
      const variables: Record<
        string,
        { label: string; code_iso: string; en_service: boolean }
      > = {};

      // Polluants supportés par NebuleAir - tous actifs par défaut
      const supportedPollutants = ["PM1", "PM25", "PM10"];

      supportedPollutants.forEach((nebuleAirPollutant) => {
        // Convertir le code NebuleAir vers notre code interne
        const ourPollutantCode =
          NEBULEAIR_POLLUTANT_MAPPING[nebuleAirPollutant];
        if (ourPollutantCode) {
          variables[ourPollutantCode] = {
            label: this.getPollutantLabel(nebuleAirPollutant),
            code_iso: this.getPollutantCodeISO(nebuleAirPollutant),
            en_service: true, // Tous les polluants NebuleAir sont actifs
          };
        }
      });

      console.log("✅ [NebuleAir] Variables retournées:", variables);
      return variables;
    } catch (error) {
      console.error(
        `❌ [NebuleAir] Erreur lors de la récupération des variables pour ${sensorId}:`,
        error
      );
      return {};
    }
  }

  private getPollutantLabel(pollutant: string): string {
    const labels: Record<string, string> = {
      PM1: "Particules PM₁",
      PM25: "Particules PM₂.₅",
      PM10: "Particules PM₁₀",
    };
    return labels[pollutant] || pollutant;
  }

  private getPollutantCodeISO(pollutant: string): string {
    const codes: Record<string, string> = {
      PM1: "PM1",
      PM25: "PM2.5",
      PM10: "PM10",
    };
    return codes[pollutant] || pollutant;
  }

  // Méthode pour récupérer les données historiques d'un capteur
  async fetchHistoricalData(params: {
    sensorId: string;
    pollutant: string;
    timeStep: string;
    startDate: string;
    endDate: string;
  }): Promise<Array<{ timestamp: string; value: number; unit: string }>> {
    try {
      console.log(
        "🔍 [NebuleAir] Début fetchHistoricalData avec params:",
        params
      );

      // Vérifier si le polluant est supporté
      const nebuleAirPollutant = this.getNebuleAirPollutantName(
        params.pollutant
      );
      if (!nebuleAirPollutant) {
        console.warn(
          `❌ [NebuleAir] Polluant ${params.pollutant} non supporté par NebuleAir`
        );
        return [];
      }
      console.log("✅ [NebuleAir] Polluant supporté:", nebuleAirPollutant);

      // Convertir les dates au format attendu par l'API
      const startDate = new Date(params.startDate);
      const endDate = new Date(params.endDate);
      const now = new Date();

      // Calculer la période relative
      const timeDiffMs = now.getTime() - startDate.getTime();
      const timeDiffDays = Math.ceil(timeDiffMs / (1000 * 60 * 60 * 24));

      // Formater les paramètres start et stop
      const start = `-${timeDiffDays}d`;
      const stop =
        endDate.getTime() >= now.getTime()
          ? "now"
          : endDate.toISOString().split("T")[0];

      // Convertir le pas de temps au format de l'API
      const freq = this.convertTimeStepToFreq(params.timeStep);

      // Construire l'URL pour les données historiques selon l'exemple fourni
      const url = `${this.BASE_URL}/capteurs/dataNebuleAir?capteurID=${params.sensorId}&start=${start}&stop=${stop}&freq=${freq}`;

      console.log("🌐 [NebuleAir] URL construite:", url);
      console.log("📊 [NebuleAir] Paramètres:", {
        start,
        stop,
        freq,
        nebuleAirPollutant,
      });

      const response = await this.makeRequest(url);
      console.log("📥 [NebuleAir] Réponse reçue:", response);

      // L'API retourne directement un tableau de données
      if (!Array.isArray(response)) {
        console.warn(
          "❌ [NebuleAir] Format de réponse historique NebuleAir non reconnu:",
          response
        );
        return [];
      }

      console.log(
        "📊 [NebuleAir] Nombre de points de données reçus:",
        response.length
      );

      // Transformer les données historiques
      const historicalData = response
        .map((dataPoint: any, index: number) => {
          // Extraire la valeur selon le polluant
          const value = this.extractHistoricalValue(
            dataPoint,
            nebuleAirPollutant
          );

          if (index < 3) {
            // Log des 3 premiers points pour debug
            console.log(`🔍 [NebuleAir] Point ${index}:`, {
              dataPoint,
              value,
              nebuleAirPollutant,
            });
          }

          if (value === null) return null;

          return {
            timestamp: dataPoint.timestamp || dataPoint.time || dataPoint.date,
            value: value,
            unit: "µg/m³",
          };
        })
        .filter(
          (item): item is { timestamp: string; value: number; unit: string } =>
            item !== null
        );

      console.log(
        "✅ [NebuleAir] Données historiques transformées:",
        historicalData.length,
        "points"
      );
      return historicalData;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données historiques NebuleAir:",
        error
      );
      throw error;
    }
  }

  // Méthode pour convertir le pas de temps au format de l'API
  private convertTimeStepToFreq(timeStep: string): string {
    const timeStepMapping: Record<string, string> = {
      instantane: "", // 2 min par défaut si vide
      deuxMin: "", // 2 min par défaut si vide
      quartHeure: "15m", // 15 minutes
      heure: "1h", // 1 heure
      jour: "1d", // 1 jour
    };

    return timeStepMapping[timeStep] || "";
  }

  // Méthode pour extraire la valeur d'un point de données historique
  private extractHistoricalValue(
    dataPoint: any,
    pollutant: string
  ): number | null {
    // L'API retourne les valeurs directement par nom de polluant (PM1, PM25, PM10)
    const value = dataPoint[pollutant];

    console.log(`🔍 [NebuleAir] Extraction valeur pour ${pollutant}:`, {
      dataPoint,
      value,
    });

    if (value === null || value === undefined || value === "-1") {
      return null;
    }

    const numericValue = parseFloat(value);
    return isNaN(numericValue) ? null : numericValue;
  }
}
