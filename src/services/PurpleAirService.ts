import { BaseDataService } from "./BaseDataService";
import { MeasurementDevice } from "../types";
import { getAirQualityLevel } from "../utils";
import { pollutants } from "../constants/pollutants";

interface PurpleAirSensor {
  sensor_index: number;
  name: string;
  latitude: number;
  longitude: number;
  location_type: number; // 0 = extérieur, 1 = intérieur
  "pm1.0_atm": number;
  "pm2.5_atm": number;
  "pm10.0_atm": number;
  last_seen: number;
  rssi: number;
  uptime: number;
  humidity: number;
  temperature: number;
  confidence: number;
}

interface PurpleAirResponse {
  api_version: string;
  time_stamp: number;
  data_time_stamp: number;
  location_type: number;
  max_age: number;
  firmware_default_version: string;
  fields: string[];
  data: PurpleAirSensor[];
}

export class PurpleAirService extends BaseDataService {
  private readonly BASE_URL = "https://api.purpleair.com/v1";
  private readonly API_KEY = "0C03EEE0-770A-11ED-B6F4-42010A800007";

  constructor() {
    super("purpleair");
  }

  async fetchData(params: {
    pollutant: string;
    timeStep: string;
    sources: string[];
    signalAirPeriod?: { startDate: string; endDate: string };
    mobileAirPeriod?: { startDate: string; endDate: string };
    selectedSensors?: string[];
    signalAirSelectedTypes?: string[];
  }): Promise<MeasurementDevice[]> {
    try {
      // Vérifier si le pas de temps est supporté
      const supportedTimeSteps = ["instantane", "deuxMin"];
      if (!supportedTimeSteps.includes(params.timeStep)) {
        console.warn(
          `Pas de temps ${params.timeStep} non supporté par PurpleAir`
        );
        return [];
      }

      // Vérifier si le polluant est supporté par PurpleAir
      if (!this.isPollutantSupported(params.pollutant)) {
        console.warn(`Polluant ${params.pollutant} non supporté par PurpleAir`);
        return [];
      }

      // Récupérer les données des capteurs extérieurs
      const sensors = await this.fetchOutdoorSensors();

      // Transformer les capteurs en MeasurementDevice
      const devices: MeasurementDevice[] = [];

      for (const sensor of sensors) {
        const value = this.getPollutantValue(sensor, params.pollutant);

        if (value !== null && value !== undefined) {
          const pollutant = pollutants[params.pollutant];
          const qualityLevel = getAirQualityLevel(value, pollutant.thresholds);

          // Récupérer les valeurs des 3 polluants pour la popup
          const pm1Value = sensor["pm1.0_atm"];
          const pm25Value = sensor["pm2.5_atm"];
          const pm10Value = sensor["pm10.0_atm"];

          devices.push({
            id: sensor.sensor_index.toString(),
            name: sensor.name,
            latitude: sensor.latitude,
            longitude: sensor.longitude,
            source: this.sourceCode,
            pollutant: params.pollutant,
            value: value,
            unit: "µg/m³",
            timestamp: new Date(sensor.last_seen * 1000).toISOString(),
            status: this.getSensorStatus(sensor),
            // Propriétés supplémentaires pour le marqueur
            qualityLevel,
            rssi: sensor.rssi,
            uptime: sensor.uptime,
            confidence: sensor.confidence,
            temperature: sensor.temperature,
            humidity: sensor.humidity,
            // Valeurs des 3 polluants pour la popup
            pm1Value,
            pm25Value,
            pm10Value,
          } as MeasurementDevice & {
            qualityLevel: string;
            rssi: number;
            uptime: number;
            confidence: number;
            temperature: number;
            humidity: number;
            pm1Value: number;
            pm25Value: number;
            pm10Value: number;
          });
        }
      }

      return devices;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données PurpleAir:",
        error
      );
      throw error;
    }
  }

  private async fetchOutdoorSensors(): Promise<PurpleAirSensor[]> {
    // Champs de base requis par l'API PurpleAir
    const fields = [
      "sensor_index",
      "name",
      "latitude",
      "longitude",
      "location_type",
      "pm1.0_atm",
      "pm2.5_atm",
      "pm10.0_atm",
      "last_seen",
      "rssi",
      "uptime",
      "humidity",
      "temperature",
      "confidence",
    ].join(",");

    // Coordonnées approximatives de la France (avec une marge)
    // Latitude: 41.0 à 51.5 (Nord-Sud)
    // Longitude: -5.5 à 9.5 (Ouest-Est)
    const url = `${this.BASE_URL}/sensors?fields=${fields}&location_type=0&max_age=3600&nwlng=-5.5&nwlat=51.5&selng=9.5&selat=41.0`;

    const response = await this.makeRequest(url, {
      headers: {
        "X-API-Key": this.API_KEY,
      },
    });

    if (!response.data || !Array.isArray(response.data)) {
      console.warn("Aucune donnée reçue de PurpleAir");
      return [];
    }

    // Les données PurpleAir sont retournées sous forme de tableaux
    // Convertir les tableaux en objets selon l'ordre des champs
    const sensors: PurpleAirSensor[] = response.data.map(
      (sensorArray: any[]) => {
        return {
          sensor_index: sensorArray[0],
          last_seen: sensorArray[1],
          name: sensorArray[2],
          location_type: sensorArray[3],
          rssi: sensorArray[4],
          uptime: sensorArray[5],
          latitude: sensorArray[6],
          longitude: sensorArray[7],
          confidence: sensorArray[8],
          humidity: sensorArray[9],
          temperature: sensorArray[10],
          "pm1.0_atm": sensorArray[11],
          "pm2.5_atm": sensorArray[12],
          "pm10.0_atm": sensorArray[13],
        };
      }
    );

    // Filtrer davantage pour s'assurer que les capteurs sont bien en France
    const frenchSensors = sensors.filter((sensor) => {
      const lat = sensor.latitude;
      const lng = sensor.longitude;

      // Vérification plus précise des coordonnées françaises
      return (
        lat >= 41.0 &&
        lat <= 51.5 && // Latitude France
        lng >= -5.5 &&
        lng <= 9.5 && // Longitude France
        // Exclure les territoires d'outre-mer pour l'instant
        !(lat < 45.0 && lng < -4.0) && // Exclure l'ouest de la Bretagne
        !(lat > 50.0 && lng > 8.0) // Exclure l'est de l'Alsace
      );
    });

    console.log(
      `🇫🇷 PurpleAir: ${sensors.length} capteurs trouvés, ${frenchSensors.length} en France`
    );

    return frenchSensors;
  }

  private isPollutantSupported(pollutant: string): boolean {
    const supportedPollutants = ["pm1", "pm25", "pm10"];
    return supportedPollutants.includes(pollutant);
  }

  private getPollutantValue(
    sensor: PurpleAirSensor,
    pollutant: string
  ): number | null {
    switch (pollutant) {
      case "pm1":
        return sensor["pm1.0_atm"];
      case "pm25":
        return sensor["pm2.5_atm"];
      case "pm10":
        return sensor["pm10.0_atm"];
      default:
        return null;
    }
  }

  private getSensorStatus(
    sensor: PurpleAirSensor
  ): "active" | "inactive" | "error" {
    // Vérifier si le capteur est récent (moins de 2 heures)
    const now = Date.now() / 1000;
    const lastSeen = sensor.last_seen;
    const age = now - lastSeen;

    if (age > 7200) {
      // 2 heures en secondes
      return "inactive";
    }

    // Vérifier la qualité du signal
    if (sensor.rssi < -100) {
      return "error";
    }

    return "active";
  }

  // Méthode pour récupérer les données historiques d'un capteur
  async fetchHistoricalData(params: {
    stationId: string;
    pollutant: string;
    timeStep: string;
    startDate: string;
    endDate: string;
  }): Promise<Array<{ timestamp: string; value: number; unit: string }>> {
    try {
      if (!this.isPollutantSupported(params.pollutant)) {
        console.warn(`Polluant ${params.pollutant} non supporté par PurpleAir`);
        return [];
      }

      // PurpleAir ne fournit pas d'API historique directe pour les capteurs individuels
      // On retourne un tableau vide pour l'instant
      console.warn(
        "PurpleAir ne supporte pas les données historiques pour les capteurs individuels"
      );
      return [];
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données historiques PurpleAir:",
        error
      );
      throw error;
    }
  }
}
