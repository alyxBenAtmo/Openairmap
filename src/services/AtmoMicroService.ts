import { BaseDataService } from "./BaseDataService";
import {
  MeasurementDevice,
  AtmoMicroSite,
  AtmoMicroMeasure,
  AtmoMicroSitesResponse,
  AtmoMicroMeasuresResponse,
} from "../types";
import { getAirQualityLevel } from "../utils";
import { pollutants } from "../constants/pollutants";

export class AtmoMicroService extends BaseDataService {
  private readonly BASE_URL = "https://api.atmosud.org/observations/capteurs";

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
      const atmoMicroVariable = this.getAtmoMicroVariable(params.pollutant);
      if (!atmoMicroVariable) {
        console.warn(`Polluant ${params.pollutant} non supporté par AtmoMicro`);
        return [];
      }

      // Configuration du pas de temps
      const timeStepConfig = this.getAtmoMicroTimeStepConfig(params.timeStep);
      if (!timeStepConfig) {
        console.warn(
          `Pas de temps ${params.timeStep} non supporté par AtmoMicro`
        );
        return [];
      }

      console.log(`📡 AtmoMicro - URLs générées:`, {
        sites: `${this.BASE_URL}/sites?format=json&variable=${atmoMicroVariable}&actifs=2880`,
        measures: `${this.BASE_URL}/mesures/dernieres?format=json&download=false&valeur_brute=true&type_capteur=true&variable=${atmoMicroVariable}&aggregation=${timeStepConfig.aggregation}&delais=${timeStepConfig.delais}`,
      });

      // Faire les deux appels API en parallèle
      const [sitesResponse, measuresResponse] = await Promise.all([
        this.fetchSites(atmoMicroVariable),
        this.fetchMeasures(
          atmoMicroVariable,
          timeStepConfig.aggregation,
          timeStepConfig.delais
        ),
      ]);

      // Vérifier si les réponses sont valides
      if (!sitesResponse || !measuresResponse) {
        console.warn("Aucune donnée reçue d'AtmoMicro");
        return [];
      }

      console.log(
        `📊 AtmoMicro - Données reçues: ${sitesResponse.length} sites, ${measuresResponse.length} mesures`
      );

      // Créer un map des mesures par ID de site pour un accès rapide
      const measuresMap = new Map<number, AtmoMicroMeasure>();
      measuresResponse.forEach((measure) => {
        measuresMap.set(measure.id_site, measure);
      });

      // Créer un map des sites par ID pour un accès rapide
      const sitesMap = new Map<number, AtmoMicroSite>();
      sitesResponse.forEach((site) => {
        sitesMap.set(site.id_site, site);
      });

      // Transformer les sites en MeasurementDevice
      const devices: MeasurementDevice[] = [];

      for (const site of sitesResponse) {
        const measure = measuresMap.get(site.id_site);

        if (measure) {
          // Site avec mesure disponible
          const pollutant = pollutants[params.pollutant];

          // Déterminer quelle valeur utiliser
          const hasCorrection = measure.valeur !== null;
          const displayValue = hasCorrection
            ? measure.valeur!
            : measure.valeur_brute;
          const correctedValue = hasCorrection ? measure.valeur : undefined;
          const rawValue = measure.valeur_brute;

          const qualityLevel = getAirQualityLevel(
            displayValue,
            pollutant.thresholds
          );

          devices.push({
            id: site.id_site.toString(),
            name: site.nom_site,
            latitude: site.lat,
            longitude: site.lon,
            source: this.sourceCode,
            pollutant: params.pollutant,
            value: displayValue, // Valeur affichée sur le marqueur
            unit: measure.unite,
            timestamp: measure.time,
            status: "active",
            // Propriétés supplémentaires pour le marqueur
            qualityLevel,
            address: `${site.nom_site}, ${site.influence}`,
            departmentId: site.code_station_commun || "",
            // Propriétés pour les valeurs corrigées
            corrected_value: correctedValue,
            raw_value: rawValue,
            has_correction: hasCorrection,
          } as MeasurementDevice & {
            qualityLevel: string;
            address: string;
            departmentId: string;
            corrected_value?: number;
            raw_value?: number;
            has_correction?: boolean;
          });
        } else {
          // Site sans mesure récente - utiliser le marqueur par défaut
          devices.push({
            id: site.id_site.toString(),
            name: site.nom_site,
            latitude: site.lat,
            longitude: site.lon,
            source: this.sourceCode,
            pollutant: params.pollutant,
            value: 0,
            unit: "µg/m³",
            timestamp: new Date().toISOString(),
            status: "inactive",
            // Propriétés supplémentaires pour le marqueur
            qualityLevel: "default",
            address: `${site.nom_site}, ${site.influence}`,
            departmentId: site.code_station_commun || "",
          } as MeasurementDevice & {
            qualityLevel: string;
            address: string;
            departmentId: string;
          });
        }
      }

      console.log(
        `✅ AtmoMicro - ${devices.length} appareils créés (données fraîches)`
      );
      return devices;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données AtmoMicro:",
        error
      );
      throw error;
    }
  }

  private async fetchSites(variable: string): Promise<AtmoMicroSite[]> {
    const url = `${this.BASE_URL}/sites?format=json&variable=${variable}&actifs=2880`;
    const response = await this.makeRequest(url);
    return response || [];
  }

  private async fetchMeasures(
    variable: string,
    aggregation: string,
    delais: number
  ): Promise<AtmoMicroMeasure[]> {
    const url = `${this.BASE_URL}/mesures/dernieres?format=json&download=false&valeur_brute=true&type_capteur=true&variable=${variable}&aggregation=${aggregation}&delais=${delais}`;
    const response = await this.makeRequest(url);
    return response || [];
  }

  private getAtmoMicroVariable(pollutant: string): string | null {
    // Mapping de nos codes vers les variables AtmoMicro
    const variableMapping: Record<string, string> = {
      pm25: "pm2.5",
      pm10: "pm10",
      pm1: "pm1",
      no2: "no2",
      o3: "o3",
      so2: "so2",
    };

    return variableMapping[pollutant] || null;
  }

  private getAtmoMicroTimeStepConfig(
    timeStep: string
  ): { aggregation: string; delais: number } | null {
    // Configuration des pas de temps supportés par AtmoMicro
    const timeStepConfigs: Record<
      string,
      { aggregation: string; delais: number }
    > = {
      instantane: { aggregation: "brute", delais: 181 }, // Scan -> brute avec délai 181 minutes
      deuxMin: { aggregation: "brute", delais: 181 }, // ≤ 2 minutes -> brute avec délai 181 minutes
      quartHeure: { aggregation: "quart-horaire", delais: 19 }, // 15 minutes -> quart-horaire avec délai 19 minutes
      heure: { aggregation: "horaire", delais: 64 }, // Heure -> horaire avec délai 64 minutes
      // jour: Pas supporté par AtmoMicro
    };

    return timeStepConfigs[timeStep] || null;
  }
}
