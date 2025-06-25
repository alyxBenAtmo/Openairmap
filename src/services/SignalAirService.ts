/// <reference types="vite/client" />

import { BaseDataService } from "./BaseDataService";
import { MeasurementDevice } from "../types";

// Types spécifiques pour SignalAir
interface SignalAirFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    id: string;
    type: "odeur" | "bruit" | "brulage" | "pollen" | "visuel";
    timestamp: string;
    description?: string;
    intensity?: "faible" | "moyenne" | "forte";
    address?: string;
    department?: string;
  };
}

interface SignalAirGeoJSON {
  type: "FeatureCollection";
  features: SignalAirFeature[];
}

export class SignalAirService extends BaseDataService {
  // URLs pour chaque type de signalement
  private readonly SIGNAL_URLS = {
    odeur: "https://www.signalair.eu/fr/flux/geojson/gq1jrnp9",
    bruit: "https://www.signalair.eu/fr/flux/geojson/yq7b5jal",
    visuel: "https://www.signalair.eu/fr/flux/geojson/28qg73y9",
    brulage: "https://www.signalair.eu/fr/flux/geojson/yib5aa1n",
    // pollen: "https://www.signalair.eu/fr/flux/geojson/pollen", // URL à confirmer
  };

  // Mapping des codes URL vers les types de signalement
  private readonly URL_TO_TYPE_MAPPING: Record<string, string> = {
    gq1jrnp9: "odeur",
    yq7b5jal: "bruit",
    "28qg73y9": "visuel",
    yib5aa1n: "brulage",
  };

  // Proxys CORS publics disponibles
  private readonly CORS_PROXIES = {
    allorigins: "https://api.allorigins.win/raw?url=",
    corsanywhere: "https://cors-anywhere.herokuapp.com/",
  };

  // Proxy local Vite pour le développement
  private readonly LOCAL_PROXY = "/signalair";

  // Option pour utiliser le proxy local (développement)
  private useLocalProxy = import.meta.env.DEV;

  constructor() {
    super("signalair");
    console.log(
      `🔧 SignalAirService - Environnement de développement: ${this.useLocalProxy}`
    );
    console.log(
      `🔧 SignalAirService - Proxy local activé: ${this.useLocalProxy}`
    );
  }

  async fetchData(params: {
    pollutant: string;
    timeStep: string;
    sources: string[];
    signalAirPeriod?: { startDate: string; endDate: string };
  }): Promise<MeasurementDevice[]> {
    console.log(`🔍 SignalAirService.fetchData appelé avec:`, params);

    try {
      // Utiliser la période par défaut si non fournie (2 derniers jours)
      const period = params.signalAirPeriod || this.getDefaultPeriod();

      // Récupérer tous les types de signalements
      const allDevices: MeasurementDevice[] = [];

      for (const [signalType, baseUrl] of Object.entries(this.SIGNAL_URLS)) {
        try {
          // Utiliser la nouvelle méthode fetchSignalAirData qui gère les proxys
          const response = await this.fetchSignalAirData(signalType, period);

          if (
            response &&
            response.features &&
            Array.isArray(response.features) &&
            response.features.length > 0
          ) {
            console.log(
              `📊 SignalAir - ${signalType}: ${response.features.length} signalements reçus`
            );

            // Extraire le type de signalement depuis l'URL
            const urlCode = baseUrl.split("/").pop() || "";
            const extractedSignalType =
              this.URL_TO_TYPE_MAPPING[urlCode] || signalType;

            const devices = this.transformSignalAirData(
              response,
              extractedSignalType,
              params.pollutant
            );
            allDevices.push(...devices);
          } else if (response === null) {
            console.log(
              `📊 SignalAir - ${signalType}: Aucun signalement pour cette période`
            );
          } else {
            console.log(`📊 SignalAir - ${signalType}: Réponse invalide reçue`);
          }
        } catch (error) {
          console.warn(
            `⚠️ SignalAir - Erreur pour le type ${signalType}:`,
            error
          );
          // Continuer avec les autres types même si un échoue
        }
      }

      console.log(`✅ SignalAir - Total: ${allDevices.length} appareils créés`);
      return allDevices;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données SignalAir:",
        error
      );
      throw error;
    }
  }

  private getDefaultPeriod(): { startDate: string; endDate: string } {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 2); // 2 derniers jours par défaut

    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  }

  private transformSignalAirData(
    geoJson: SignalAirGeoJSON,
    signalType: string,
    pollutant: string
  ): MeasurementDevice[] {
    const devices: MeasurementDevice[] = [];

    for (const feature of geoJson.features) {
      const { geometry, properties } = feature;

      // Extraire les coordonnées (GeoJSON utilise [longitude, latitude])
      const [longitude, latitude] = geometry.coordinates;

      // Déterminer l'intensité (par défaut "moyenne" si non spécifiée)
      const intensity = properties.intensity || "moyenne";
      const intensityValue = this.getIntensityValue(intensity);

      devices.push({
        id:
          properties.id ||
          `signalair-${signalType}-${Date.now()}-${Math.random()}`,
        name: `Signalement ${signalType}`,
        latitude,
        longitude,
        source: this.sourceCode,
        pollutant, // Utiliser le polluant sélectionné pour la cohérence
        value: intensityValue,
        unit: "intensité",
        timestamp: properties.timestamp || new Date().toISOString(),
        status: "active",
        // Propriétés supplémentaires pour le marqueur
        qualityLevel: signalType, // Utiliser le type de signalement pour le marqueur
        address: properties.address || "",
        departmentId: properties.department || "",
        // Propriétés spécifiques à SignalAir
        signalType,
        signalIntensity: intensity,
        signalDescription: properties.description || "",
      } as MeasurementDevice & {
        qualityLevel: string;
        address: string;
        departmentId: string;
        signalType: string;
        signalIntensity: string;
        signalDescription: string;
      });
    }

    return devices;
  }

  private getIntensityValue(intensity: string): number {
    // Convertir l'intensité en valeur numérique pour l'affichage
    const intensityValues: Record<string, number> = {
      faible: 1,
      moyenne: 2,
      forte: 3,
    };

    return intensityValues[intensity] || 2; // Par défaut "moyenne"
  }

  private async fetchSignalAirData(
    signalType: string,
    period: { startDate: string; endDate: string }
  ): Promise<SignalAirGeoJSON | null> {
    const directUrl = `${this.SIGNAL_URLS[signalType]}/${period.startDate}/${period.endDate}`;

    // En développement, utiliser TOUJOURS le proxy local en premier
    if (this.useLocalProxy) {
      try {
        const localProxyUrl = `${this.LOCAL_PROXY}${this.SIGNAL_URLS[
          signalType
        ].replace("https://www.signalair.eu", "")}/${period.startDate}/${
          period.endDate
        }`;
        console.log(
          `📡 SignalAir - Utilisation proxy local pour ${signalType}: ${localProxyUrl}`
        );

        const response = await this.makeRequest(localProxyUrl, {
          method: "GET",
          headers: {
            Accept: "application/geo+json,application/json",
            "Content-Type": "application/json",
          },
        });

        // Vérifier que la réponse est bien du JSON
        if (
          response &&
          typeof response === "object" &&
          response.type === "FeatureCollection"
        ) {
          console.log(
            `✅ SignalAir - Succès avec proxy local pour ${signalType}`
          );
          return response;
        } else {
          console.log(
            `📊 SignalAir - Aucun signalement pour ${signalType} sur cette période`
          );
          return null;
        }
      } catch (error) {
        console.warn(
          `⚠️ SignalAir - Échec proxy local pour ${signalType}, tentative proxy public`
        );
      }
    }

    // Si pas en développement ou si le proxy local a échoué, utiliser les proxys publics
    for (const [proxyName, proxyUrl] of Object.entries(this.CORS_PROXIES)) {
      try {
        const fullProxyUrl = `${proxyUrl}${encodeURIComponent(directUrl)}`;
        console.log(
          `📡 SignalAir - Tentative avec ${proxyName} pour ${signalType}: ${fullProxyUrl}`
        );

        const response = await this.makeRequest(fullProxyUrl, {
          method: "GET",
          headers: {
            Accept: "application/geo+json,application/json",
            "Content-Type": "application/json",
          },
          mode: "cors",
          credentials: "omit",
        });

        // Vérifier que la réponse est bien du JSON
        if (
          response &&
          typeof response === "object" &&
          response.type === "FeatureCollection"
        ) {
          console.log(
            `✅ SignalAir - Succès avec ${proxyName} pour ${signalType}`
          );
          return response;
        } else {
          console.log(
            `📊 SignalAir - Aucun signalement pour ${signalType} sur cette période`
          );
          return null;
        }
      } catch (proxyError) {
        console.warn(
          `⚠️ SignalAir - Échec avec ${proxyName} pour ${signalType}:`,
          proxyError
        );
        continue; // Essayer le prochain proxy
      }
    }

    // En dernier recours, essayer la requête directe (peut échouer à cause de CORS)
    try {
      console.log(
        `📡 SignalAir - Dernière tentative directe pour ${signalType}: ${directUrl}`
      );

      const response = await this.makeRequest(directUrl, {
        method: "GET",
        headers: {
          Accept: "application/geo+json,application/json",
          "Content-Type": "application/json",
        },
        mode: "cors",
        credentials: "omit",
      });

      // Vérifier que la réponse est bien du JSON
      if (
        response &&
        typeof response === "object" &&
        response.type === "FeatureCollection"
      ) {
        return response;
      } else {
        console.log(
          `📊 SignalAir - Aucun signalement pour ${signalType} sur cette période`
        );
        return null;
      }
    } catch (directError) {
      console.error(
        `❌ SignalAir - Échec complet pour ${signalType}:`,
        directError
      );
      throw new Error(
        `Impossible de récupérer les données SignalAir pour ${signalType}. Tous les proxys ont échoué.`
      );
    }
  }
}
