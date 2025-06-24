import { BaseDataService } from "./BaseDataService";
import { MeasurementDevice } from "../types";

export class AtmoMicroService extends BaseDataService {
  constructor() {
    super("atmoMicro");
  }

  async fetchData(params: {
    pollutant: string;
    timeStep: string;
    sources: string[];
  }): Promise<MeasurementDevice[]> {
    // Simulation de données pour l'exemple
    const mockData: MeasurementDevice[] = [
      this.createDevice(
        "atmo-micro-1",
        "Micro-capteur Marseille Centre",
        43.2965,
        5.3698,
        params.pollutant,
        22.1,
        "µg/m³",
        new Date().toISOString(),
        "active"
      ),
      this.createDevice(
        "atmo-micro-2",
        "Micro-capteur Aix Centre",
        43.5297,
        5.4474,
        params.pollutant,
        19.8,
        "µg/m³",
        new Date().toISOString(),
        "active"
      ),
      this.createDevice(
        "atmo-micro-3",
        "Micro-capteur Toulon Port",
        43.1242,
        5.928,
        params.pollutant,
        15.3,
        "µg/m³",
        new Date().toISOString(),
        "active"
      ),
    ];

    return mockData;
  }
}
