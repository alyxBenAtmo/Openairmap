import { DataService, MeasurementDevice } from "../types";

export abstract class BaseDataService implements DataService {
  protected sourceCode: string;

  constructor(sourceCode: string) {
    this.sourceCode = sourceCode;
  }

  abstract fetchData(params: {
    pollutant: string;
    timeStep: string;
    sources: string[];
  }): Promise<MeasurementDevice[]>;

  protected createDevice(
    id: string,
    name: string,
    latitude: number,
    longitude: number,
    pollutant: string,
    value: number,
    unit: string,
    timestamp: string,
    status: "active" | "inactive" | "error" = "active"
  ): MeasurementDevice {
    return {
      id,
      name,
      latitude,
      longitude,
      source: this.sourceCode,
      pollutant,
      value,
      unit,
      timestamp,
      status,
    };
  }

  protected async makeRequest(
    url: string,
    options?: RequestInit
  ): Promise<any> {
    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(
        `Erreur lors de la requête pour ${this.sourceCode}:`,
        error
      );
      throw error;
    }
  }
}
