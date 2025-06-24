import { BaseDataService } from "./BaseDataService";
import { MeasurementDevice } from "../types";

export class NebuleAirService extends BaseDataService {
  constructor() {
    super("nebuleair");
  }

  async fetchData(params: {
    pollutant: string;
    timeStep: string;
    sources: string[];
  }): Promise<MeasurementDevice[]> {
    // Simulation de données pour l'exemple
    const mockData: MeasurementDevice[] = [
      this.createDevice(
        "nebuleair-1",
        "NebuleAir Marseille",
        43.2965,
        5.3698,
        params.pollutant,
        28.7,
        "µg/m³",
        new Date().toISOString(),
        "active"
      ),
      this.createDevice(
        "nebuleair-2",
        "NebuleAir Nice",
        43.7102,
        7.262,
        params.pollutant,
        24.3,
        "µg/m³",
        new Date().toISOString(),
        "active"
      ),
    ];

    return mockData;
  }
}
