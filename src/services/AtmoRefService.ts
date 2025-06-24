import { BaseDataService } from "./BaseDataService";
import {
  MeasurementDevice,
  AtmoRefStationsResponse,
  AtmoRefMeasuresResponse,
  AtmoRefStation,
  AtmoRefMeasure,
  ATMOREF_POLLUTANT_MAPPING,
} from "../types";
import { getAirQualityLevel } from "../utils";
import { pollutants } from "../constants/pollutants";

export class AtmoRefService extends BaseDataService {
  private readonly BASE_URL = "https://api.atmosud.org/observations";

  constructor() {
    super("atmoRef");
  }

  async fetchData(params: {
    pollutant: string;
    timeStep: string;
    sources: string[];
  }): Promise<MeasurementDevice[]> {
    console.log(`🔍 AtmoRefService.fetchData appelé avec:`, params);
    console.log(`🧹 Nettoyage des données précédentes...`);

    try {
      // Mapping du polluant vers le nom AtmoSud
      const atmoRefPollutantName = this.getAtmoRefPollutantName(
        params.pollutant
      );
      if (!atmoRefPollutantName) {
        console.warn(`Polluant ${params.pollutant} non supporté par AtmoRef`);
        return [];
      }

      // Vérifier si le pas de temps est supporté par AtmoRef
      const timeStepConfig = this.getAtmoRefTimeStepConfig(params.timeStep);
      if (!timeStepConfig) {
        console.warn(
          `Pas de temps ${params.timeStep} non supporté par AtmoRef`
        );
        return [];
      }

      console.log(`📡 AtmoRef - URLs générées:`, {
        stations: `${this.BASE_URL}/stations?format=json&nom_polluant=${atmoRefPollutantName}&station_en_service=true&download=false&metadata=true`,
        measures: `${this.BASE_URL}/stations/mesures/derniere?format=json&nom_polluant=${atmoRefPollutantName}&temporalite=${timeStepConfig.temporalite}&delais=${timeStepConfig.delais}&download=false`,
      });

      // Faire les deux appels API en parallèle
      const [stationsResponse, measuresResponse] = await Promise.all([
        this.fetchStations(atmoRefPollutantName),
        this.fetchMeasures(
          atmoRefPollutantName,
          timeStepConfig.temporalite,
          timeStepConfig.delais
        ),
      ]);

      // Vérifier si les réponses sont valides
      if (!stationsResponse.stations || !measuresResponse.mesures) {
        console.warn("Aucune donnée reçue d'AtmoRef");
        return [];
      }

      console.log(
        `📊 AtmoRef - Données reçues: ${stationsResponse.stations.length} stations, ${measuresResponse.mesures.length} mesures`
      );

      // Créer un map des mesures par ID de station pour un accès rapide
      const measuresMap = new Map<string, AtmoRefMeasure>();
      measuresResponse.mesures.forEach((measure) => {
        measuresMap.set(measure.id_station, measure);
      });

      // Transformer les stations en MeasurementDevice
      const devices: MeasurementDevice[] = [];

      for (const station of stationsResponse.stations) {
        const measure = measuresMap.get(station.id_station);

        if (measure) {
          // Station avec mesure disponible
          const pollutant = pollutants[params.pollutant];
          const qualityLevel = getAirQualityLevel(
            measure.valeur,
            pollutant.thresholds
          );

          devices.push({
            id: station.id_station,
            name: station.nom_station,
            latitude: station.latitude,
            longitude: station.longitude,
            source: this.sourceCode,
            pollutant: params.pollutant,
            value: measure.valeur,
            unit: measure.unite,
            timestamp: measure.date_debut,
            status: "active",
            // Propriétés supplémentaires pour le marqueur
            qualityLevel,
            address: station.adresse,
            departmentId: station.departement_id,
          } as MeasurementDevice & { qualityLevel: string; address: string; departmentId: string });
        } else {
          // Station sans mesure récente - utiliser le marqueur par défaut
          devices.push({
            id: station.id_station,
            name: station.nom_station,
            latitude: station.latitude,
            longitude: station.longitude,
            source: this.sourceCode,
            pollutant: params.pollutant,
            value: 0,
            unit: "µg/m³",
            timestamp: new Date().toISOString(),
            status: "inactive",
            // Propriétés supplémentaires pour le marqueur
            qualityLevel: "default",
            address: station.adresse,
            departmentId: station.departement_id,
          } as MeasurementDevice & { qualityLevel: string; address: string; departmentId: string });
        }
      }

      console.log(
        `✅ AtmoRef - ${devices.length} appareils créés (données fraîches)`
      );
      return devices;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données AtmoRef:",
        error
      );
      throw error;
    }
  }

  private async fetchStations(
    pollutantName: string
  ): Promise<AtmoRefStationsResponse> {
    const url = `${this.BASE_URL}/stations?format=json&nom_polluant=${pollutantName}&station_en_service=true&download=false&metadata=true`;
    return await this.makeRequest(url);
  }

  private async fetchMeasures(
    pollutantName: string,
    temporalite: string,
    delais: number
  ): Promise<AtmoRefMeasuresResponse> {
    const url = `${this.BASE_URL}/stations/mesures/derniere?format=json&nom_polluant=${pollutantName}&temporalite=${temporalite}&delais=${delais}&download=false`;
    return await this.makeRequest(url);
  }

  private getAtmoRefPollutantName(pollutant: string): string | null {
    // Mapping de nos codes vers les noms AtmoSud
    const pollutantNameMapping: Record<string, string> = {
      pm25: "pm2.5",
      pm10: "pm10",
      pm1: "pm1",
      no2: "no2",
      o3: "o3",
      so2: "so2",
    };

    return pollutantNameMapping[pollutant] || null;
  }

  private getAtmoRefTimeStepConfig(
    timeStep: string
  ): { temporalite: string; delais: number } | null {
    // Configuration des pas de temps supportés par AtmoRef
    // Utiliser les clés de l'objet pasDeTemps (ex: "heure", "jour") au lieu des codes
    const timeStepConfigs: Record<
      string,
      { temporalite: string; delais: number }
    > = {
      instantane: { temporalite: "quart-horaire", delais: 181 }, // Scan -> quart-horaire avec délai 181
      quartHeure: { temporalite: "quart-horaire", delais: 19 }, // 15 minutes -> quart-horaire avec délai 19
      heure: { temporalite: "horaire", delais: 64 }, // Heure -> horaire avec délai 64
      jour: { temporalite: "journalière", delais: 1444 }, // Jour -> journalière avec délai 1444
    };

    return timeStepConfigs[timeStep] || null;
  }
}
