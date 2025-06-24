import { BaseDataService } from "./BaseDataService";
import { MeasurementDevice } from "../types";

export class SignalAirService extends BaseDataService {
  constructor() {
    super("signalair");
  }

  async fetchData(params: {
    pollutant: string;
    timeStep: string;
    sources: string[];
  }): Promise<MeasurementDevice[]> {
    // Simulation de données pour l'exemple
    const mockData: MeasurementDevice[] = [
      this.createDevice(
        "signalair-1",
        "SignalAir Marseille",
        43.2965,
        5.3698,
        params.pollutant,
        31.2,
        "µg/m³",
        new Date().toISOString(),
        "active"
      ),
      this.createDevice(
        "signalair-2",
        "SignalAir Lyon",
        45.7578,
        4.832,
        params.pollutant,
        26.8,
        "µg/m³",
        new Date().toISOString(),
        "active"
      ),
    ];

    return mockData;
  }
}
