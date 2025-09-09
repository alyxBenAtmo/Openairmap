import { DataService, MeasurementDevice, SignalAirReport } from "../types";

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
    mobileAirPeriod?: { startDate: string; endDate: string };
    selectedSensors?: string[];
  }): Promise<MeasurementDevice[] | SignalAirReport[]>;

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
      const method = options?.method || "GET";
      const defaultOptions: RequestInit = {
        method,
        headers: {
          Accept: "application/json,application/geo+json,*/*",
          // Ne pas envoyer Content-Type pour les requêtes GET
          ...(method !== "GET" && { "Content-Type": "application/json" }),
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
          // Retourner le texte brut si ce n'est pas du JSON
          console.warn(
            `Réponse non-JSON reçue (${contentType}), retour du texte brut`
          );
          return text;
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
