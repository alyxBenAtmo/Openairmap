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
    signalAirPeriod?: { startDate: string; endDate: string };
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
      const defaultOptions: RequestInit = {
        method: "GET",
        headers: {
          Accept: "application/json,application/geo+json,*/*",
          "Content-Type": "application/json",
        },
        mode: "cors",
        credentials: "omit",
        ...options,
      };

      // Fusionner les en-têtes
      if (options?.headers) {
        defaultOptions.headers = {
          ...defaultOptions.headers,
          ...options.headers,
        };
      }

      console.log(`🌐 ${this.sourceCode} - Requête vers: ${url}`);

      const response = await fetch(url, defaultOptions);

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status} - ${response.statusText}`
        );
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      } else if (contentType && contentType.includes("application/geo+json")) {
        return await response.json();
      } else {
        // Essayer de parser comme JSON même si le content-type n'est pas exact
        const text = await response.text();
        try {
          return JSON.parse(text);
        } catch {
          throw new Error(`Format de réponse non supporté: ${contentType}`);
        }
      }
    } catch (error) {
      console.error(
        `Erreur lors de la requête pour ${this.sourceCode}:`,
        error
      );
      throw error;
    }
  }
}
