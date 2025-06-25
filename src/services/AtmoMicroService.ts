import { BaseDataService } from "./BaseDataService";
import { MeasurementDevice } from "../types";
import { getAirQualityLevel } from "../utils";
import { pollutants } from "../constants/pollutants";

// Types spécifiques pour AtmoMicro (exemple)
interface AtmoMicroStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  department: string;
  lastUpdate: string;
  measurements: AtmoMicroMeasurement[];
}

interface AtmoMicroMeasurement {
  pollutant: string;
  value: number;
  unit: string;
  timestamp: string;
  quality: string;
}

interface AtmoMicroResponse {
  stations: AtmoMicroStation[];
}

export class AtmoMicroService extends BaseDataService {
  private readonly BASE_URL = "https://api.atmosud.org/micro-stations";

  constructor() {
    super("atmoMicro");
  }

  async fetchData(params: {
    pollutant: string;
    timeStep: string;
    sources: string[];
    signalAirPeriod?: { startDate: string; endDate: string };
  }): Promise<MeasurementDevice[]> {
    console.log(`🔍 AtmoMicroService.fetchData appelé avec:`, params);

    try {
      // Mapping du polluant vers le format AtmoMicro
      const atmoMicroPollutant = this.getAtmoMicroPollutant(params.pollutant);
      if (!atmoMicroPollutant) {
        console.warn(`Polluant ${params.pollutant} non supporté par AtmoMicro`);
        return [];
      }

      // Vérifier si le pas de temps est supporté
      const timeStepConfig = this.getAtmoMicroTimeStepConfig(params.timeStep);
      if (!timeStepConfig) {
        console.warn(
          `Pas de temps ${params.timeStep} non supporté par AtmoMicro`
        );
        return [];
      }

      // Appel API pour récupérer les données AtmoMicro
      const response = await this.fetchAtmoMicroData(
        atmoMicroPollutant,
        timeStepConfig
      );

      if (!response.stations) {
        console.warn("Aucune donnée reçue d'AtmoMicro");
        return [];
      }

      console.log(
        `📊 AtmoMicro - Données reçues: ${response.stations.length} stations`
      );

      // Transformer les stations en MeasurementDevice
      const devices: MeasurementDevice[] = [];

      for (const station of response.stations) {
        // Trouver la mesure correspondant au polluant demandé
        const measurement = station.measurements.find(
          (m) => m.pollutant === atmoMicroPollutant
        );

        if (measurement) {
          // Station avec mesure disponible
          const pollutant = pollutants[params.pollutant];
          const qualityLevel = getAirQualityLevel(
            measurement.value,
            pollutant.thresholds
          );

          devices.push({
            id: station.id,
            name: station.name,
            latitude: station.latitude,
            longitude: station.longitude,
            source: this.sourceCode,
            pollutant: params.pollutant,
            value: measurement.value, // ← Valeur utilisée pour l'affichage sur le marqueur
            unit: measurement.unit,
            timestamp: measurement.timestamp,
            status: "active",
            // Propriétés supplémentaires pour le marqueur
            qualityLevel,
            address: station.address,
            departmentId: station.department,
          } as MeasurementDevice & { qualityLevel: string; address: string; departmentId: string });
        } else {
          // Station sans mesure pour ce polluant
          devices.push({
            id: station.id,
            name: station.name,
            latitude: station.latitude,
            longitude: station.longitude,
            source: this.sourceCode,
            pollutant: params.pollutant,
            value: 0, // ← Valeur 0 = pas d'affichage sur le marqueur
            unit: "µg/m³",
            timestamp: station.lastUpdate,
            status: "inactive",
            // Propriétés supplémentaires pour le marqueur
            qualityLevel: "default",
            address: station.address,
            departmentId: station.department,
          } as MeasurementDevice & { qualityLevel: string; address: string; departmentId: string });
        }
      }

      console.log(`✅ AtmoMicro - ${devices.length} appareils créés`);
      return devices;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données AtmoMicro:",
        error
      );
      throw error;
    }
  }

  private async fetchAtmoMicroData(
    pollutant: string,
    timeStepConfig: { interval: string; delay: number }
  ): Promise<AtmoMicroResponse> {
    const url = `${this.BASE_URL}?pollutant=${pollutant}&interval=${timeStepConfig.interval}&delay=${timeStepConfig.delay}`;
    return await this.makeRequest(url);
  }

  private getAtmoMicroPollutant(pollutant: string): string | null {
    // Mapping de nos codes vers les codes AtmoMicro
    const pollutantMapping: Record<string, string> = {
      pm25: "PM2.5",
      pm10: "PM10",
      pm1: "PM1",
      no2: "NO2",
      o3: "O3",
      so2: "SO2",
    };

    return pollutantMapping[pollutant] || null;
  }

  private getAtmoMicroTimeStepConfig(
    timeStep: string
  ): { interval: string; delay: number } | null {
    // Configuration des pas de temps supportés par AtmoMicro
    const timeStepConfigs: Record<string, { interval: string; delay: number }> =
      {
        instantane: { interval: "realtime", delay: 5 }, // Scan -> temps réel avec délai 5min
        quartHeure: { interval: "15min", delay: 20 }, // 15 minutes -> 15min avec délai 20min
        heure: { interval: "1hour", delay: 65 }, // Heure -> 1h avec délai 65min
        jour: { interval: "24hour", delay: 1445 }, // Jour -> 24h avec délai 1445min
      };

    return timeStepConfigs[timeStep] || null;
  }
}
