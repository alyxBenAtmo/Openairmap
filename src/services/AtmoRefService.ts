import { BaseDataService } from "./BaseDataService";
import { MeasurementDevice } from "../types";

export class AtmoRefService extends BaseDataService {
  constructor() {
    super("atmoRef");
  }

  async fetchData(params: {
    pollutant: string;
    timeStep: string;
    sources: string[];
  }): Promise<MeasurementDevice[]> {
    // Simulation de données pour l'exemple
    // Dans un vrai projet, vous feriez un appel API vers AtmoSud
    const mockData: MeasurementDevice[] = [
      this.createDevice(
        "atmo-ref-1",
        "Station Marseille Longchamp",
        43.2965,
        5.3698,
        params.pollutant,
        25.5,
        "µg/m³",
        new Date().toISOString(),
        "active"
      ),
      this.createDevice(
        "atmo-ref-2",
        "Station Aix-en-Provence",
        43.5297,
        5.4474,
        params.pollutant,
        18.2,
        "µg/m³",
        new Date().toISOString(),
        "active"
      ),
    ];

    return mockData;
  }
}
