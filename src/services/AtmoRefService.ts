import { BaseDataService } from "./BaseDataService";
import {
  MeasurementDevice,
  AtmoRefStationsResponse,
  AtmoRefMeasuresResponse,
  AtmoRefStation,
  AtmoRefMeasure,
  ATMOREF_POLLUTANT_MAPPING,
  TemporalDataPoint,
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
    signalAirPeriod?: { startDate: string; endDate: string };
    mobileAirPeriod?: { startDate: string; endDate: string };
    selectedSensors?: string[];
  }): Promise<MeasurementDevice[]> {
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

  // Méthode pour récupérer les données historiques d'une station
  async fetchHistoricalData(params: {
    stationId: string;
    pollutant: string;
    timeStep: string;
    startDate: string;
    endDate: string;
  }): Promise<Array<{ timestamp: string; value: number; unit: string }>> {
    try {
      // Mapping du polluant vers le nom AtmoSud
      const atmoRefPollutantName = this.getAtmoRefPollutantName(
        params.pollutant
      );
      if (!atmoRefPollutantName) {
        console.warn(`Polluant ${params.pollutant} non supporté par AtmoRef`);
        return [];
      }

      // Configuration du pas de temps
      const timeStepConfig = this.getAtmoRefTimeStepConfig(params.timeStep);
      if (!timeStepConfig) {
        console.warn(
          `Pas de temps ${params.timeStep} non supporté par AtmoRef`
        );
        return [];
      }

      // Formater les dates pour le mode historique
      const formattedStartDate = this.formatDateForHistoricalMode(
        params.startDate,
        false
      );
      const formattedEndDate = this.formatDateForHistoricalMode(
        params.endDate,
        true
      );

      // Construire l'URL pour les données historiques avec le bon endpoint
      const url = `${this.BASE_URL}/stations/mesures?format=json&station_id=${params.stationId}&nom_polluant=${atmoRefPollutantName}&temporalite=${timeStepConfig.temporalite}&download=false&metadata=true&date_debut=${formattedStartDate}&date_fin=${formattedEndDate}`;

      const response = await this.makeRequest(url);

      if (!response.mesures) {
        console.warn("Aucune donnée historique reçue d'AtmoRef");
        return [];
      }

      // Transformer les données historiques
      const historicalData = response.mesures.map(
        (measure: AtmoRefMeasure) => ({
          timestamp: measure.date_debut,
          value: measure.valeur,
          unit: measure.unite,
        })
      );

      return historicalData;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données historiques AtmoRef:",
        error
      );
      throw error;
    }
  }

  // Méthode pour récupérer les variables disponibles d'une station
  async fetchStationVariables(
    stationId: string
  ): Promise<
    Record<string, { label: string; code_iso: string; en_service: boolean }>
  > {
    try {
      const url = `${this.BASE_URL}/stations?format=json&station_en_service=true&download=false&metadata=true`;
      const response = await this.makeRequest(url);

      const station = response.stations.find(
        (s: AtmoRefStation) => s.id_station === stationId
      );
      if (!station) {
        console.warn(`Station ${stationId} non trouvée`);
        return {};
      }

      return station.variables;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des variables de la station:",
        error
      );
      throw error;
    }
  }

  // Méthode pour récupérer les données temporelles AtmoRef
  async fetchTemporalData(params: {
    pollutant: string;
    timeStep: string;
    startDate: string;
    endDate: string;
  }): Promise<TemporalDataPoint[]> {
    try {
      console.log("🕒 [AtmoRef] Récupération des données temporelles:", params);

      // Mapping du polluant vers le nom AtmoSud
      const atmoRefPollutantName = this.getAtmoRefPollutantName(
        params.pollutant
      );
      if (!atmoRefPollutantName) {
        console.warn(`Polluant ${params.pollutant} non supporté par AtmoRef`);
        return [];
      }

      // Configuration du pas de temps
      const timeStepConfig = this.getAtmoRefTimeStepConfig(params.timeStep);
      if (!timeStepConfig) {
        console.warn(
          `Pas de temps ${params.timeStep} non supporté par AtmoRef`
        );
        return [];
      }

      // Récupérer les stations d'abord pour avoir les coordonnées
      const stationsResponse = await this.fetchStations(atmoRefPollutantName);
      if (!stationsResponse.stations) {
        console.warn("Aucune station trouvée pour AtmoRef");
        return [];
      }

      // Créer un map des stations par ID pour un accès rapide
      const stationsMap = new Map<string, AtmoRefStation>();
      stationsResponse.stations.forEach((station) => {
        stationsMap.set(station.id_station, station);
      });

      // Diviser la période en chunks de 30 jours pour éviter les timeouts
      const chunkSize = 30; // 30 jours
      const start = new Date(params.startDate);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(params.endDate);
      end.setUTCHours(23, 59, 59, 999);
      const temporalData: TemporalDataPoint[] = [];

      // Calculer le nombre de chunks
      const totalDays = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      const chunks = Math.ceil(totalDays / chunkSize);

      console.log(
        `📊 [AtmoRef] Division en ${chunks} tranches de ${chunkSize} jours`
      );

      // Traiter chaque chunk
      for (let i = 0; i < chunks; i++) {
        const chunkStart = new Date(start);
        chunkStart.setDate(chunkStart.getDate() + i * chunkSize);

        const chunkEnd = new Date(chunkStart);
        chunkEnd.setDate(chunkEnd.getDate() + chunkSize - 1);

        // S'assurer qu'on ne dépasse pas la date de fin
        if (chunkEnd > end) {
          chunkEnd.setTime(end.getTime());
        }

        console.log(
          `📅 [AtmoRef] Traitement tranche ${i + 1}/${chunks}: ${
            chunkStart.toISOString().split("T")[0]
          } à ${chunkEnd.toISOString().split("T")[0]}`
        );

        try {
          const chunkData = await this.fetchTemporalDataChunk(
            atmoRefPollutantName,
            timeStepConfig.temporalite,
            chunkStart.toISOString(),
            chunkEnd.toISOString(),
            stationsMap,
            params.pollutant
          );
          temporalData.push(...chunkData);
        } catch (error) {
          console.warn(
            `Erreur lors de la récupération des données pour la période ${chunkStart.toISOString()} - ${chunkEnd.toISOString()}:`,
            error
          );
          // Continuer avec les autres chunks même si un échoue
        }
      }

      // Trier les données par timestamp
      temporalData.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      console.log(
        `✅ [AtmoRef] ${temporalData.length} points temporels récupérés`
      );

      return temporalData;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données temporelles AtmoRef:",
        error
      );
      throw error;
    }
  }

  // Fonction pour formater les dates selon les besoins du mode historique
  private formatDateForHistoricalMode(
    dateString: string,
    isEndDate: boolean = false
  ): string {
    const date = new Date(dateString);

    if (isEndDate) {
      // Date de fin : toujours à 23:59:59 UTC
      date.setUTCHours(23, 59, 59, 999);
    } else {
      // Date de début : toujours à 00:00:00 UTC
      date.setUTCHours(0, 0, 0, 0);
    }

    return date.toISOString();
  }

  private async fetchTemporalDataChunk(
    pollutantName: string,
    temporalite: string,
    startDate: string,
    endDate: string,
    stationsMap: Map<string, AtmoRefStation>,
    pollutant: string
  ): Promise<TemporalDataPoint[]> {
    // Formater les dates pour le mode historique
    const formattedStartDate = this.formatDateForHistoricalMode(
      startDate,
      false
    );
    const formattedEndDate = this.formatDateForHistoricalMode(endDate, true);

    const url = `${
      this.BASE_URL
    }/stations/mesures?nom_polluant=${pollutantName}&date_debut=${encodeURIComponent(
      formattedStartDate
    )}&date_fin=${encodeURIComponent(
      formattedEndDate
    )}&temporalite=${temporalite}&metadata=false&only_validate_values=true&format=json&download=false`;

    try {
      const response = await this.makeRequest(url);

      // L'API AtmoRef retourne un objet avec une propriété 'mesures'
      if (!response || !response.mesures || !Array.isArray(response.mesures)) {
        return [];
      }

      const measures = response.mesures;

      // Grouper les mesures par timestamp
      const measuresByTimestamp = new Map<string, any[]>();

      measures.forEach((measure: any) => {
        const timestamp = measure.date_debut;
        if (!measuresByTimestamp.has(timestamp)) {
          measuresByTimestamp.set(timestamp, []);
        }
        measuresByTimestamp.get(timestamp)!.push(measure);
      });

      // Créer les TemporalDataPoint
      const temporalDataPoints: TemporalDataPoint[] = [];

      for (const [timestamp, measures] of measuresByTimestamp) {
        const devices: MeasurementDevice[] = [];
        let totalValue = 0;
        let validMeasureCount = 0;
        const qualityLevels: Record<string, number> = {};

        measures.forEach((measure: any) => {
          const station = stationsMap.get(measure.id_station);
          if (!station) {
            console.warn(
              `Station ${measure.id_station} non trouvée dans la map des stations`
            );
            return;
          }

          if (measure.valeur !== null && measure.valeur !== undefined) {
            const pollutantConfig = pollutants[pollutant];
            if (pollutantConfig) {
              const qualityLevel = getAirQualityLevel(
                measure.valeur,
                pollutantConfig.thresholds
              );
              qualityLevels[qualityLevel] =
                (qualityLevels[qualityLevel] || 0) + 1;
              totalValue += measure.valeur;
              validMeasureCount++;
            }

            devices.push({
              id: measure.id_station,
              name: measure.nom_station || station.nom_station,
              latitude: station.latitude,
              longitude: station.longitude,
              source: this.sourceCode,
              pollutant: pollutant,
              value: measure.valeur,
              unit: measure.unite,
              timestamp: measure.date_debut,
              status: measure.validation === "validée" ? "active" : "inactive",
              qualityLevel: pollutantConfig
                ? getAirQualityLevel(measure.valeur, pollutantConfig.thresholds)
                : "default",
              address: station.adresse,
              departmentId: station.departement_id,
            } as MeasurementDevice & { qualityLevel: string; address: string; departmentId: string });
          }
        });

        if (devices.length > 0) {
          temporalDataPoints.push({
            timestamp,
            devices,
            deviceCount: devices.length,
            averageValue:
              validMeasureCount > 0 ? totalValue / validMeasureCount : 0,
            qualityLevels,
          });
        }
      }

      console.log(
        `✅ [AtmoRef] Tranche traitée: ${measuresByTimestamp.size} timestamps`
      );

      return temporalDataPoints;
    } catch (error) {
      console.error(
        "❌ [AtmoRef] Erreur lors de la récupération des données temporelles:",
        error
      );
      throw error;
    }
  }

  private getPollutantFromAtmoRefName(labelPolluant: string): string {
    // Mapping inverse des labels AtmoSud vers nos codes
    const labelToCodeMapping: Record<string, string> = {
      "Particules en suspension <2.5 µm (masses) (PM2.5)": "pm25",
      "Particules en suspension <10 µm (masses) (PM10)": "pm10",
      "Particules en suspension <1 µm (masses) (PM1)": "pm1",
      "Dioxyde d'azote (NO2)": "no2",
      "Ozone (O3)": "o3",
      "Dioxyde de soufre (SO2)": "so2",
    };

    return labelToCodeMapping[labelPolluant] || "pm25"; // Par défaut PM2.5
  }
}
