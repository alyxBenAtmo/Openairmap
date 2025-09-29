import { BaseDataService } from "./BaseDataService";
import {
  MeasurementDevice,
  AtmoMicroSite,
  AtmoMicroMeasure,
  TemporalDataPoint,
  // AtmoMicroSitesResponse,
  // AtmoMicroMeasuresResponse,
  ATMOMICRO_POLLUTANT_MAPPING,
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
    mobileAirPeriod?: { startDate: string; endDate: string };
    selectedSensors?: string[];
  }): Promise<MeasurementDevice[]> {
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

      // Transformer les données en MeasurementDevice
      const devices: MeasurementDevice[] = [];

      // 1. Traiter d'abord les sites avec des mesures récentes (coordonnées à jour)
      for (const measure of measuresResponse) {
        const site = sitesMap.get(measure.id_site);

        if (site) {
          // Site avec mesure disponible - utiliser les coordonnées de mesures/dernieres
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
            id: measure.id_site.toString(),
            name: site.nom_site,
            latitude: measure.lat, // Coordonnées à jour depuis mesures/dernieres
            longitude: measure.lon, // Coordonnées à jour depuis mesures/dernieres
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
        }
      }

      // 2. Ajouter les sites sans mesures récentes (coordonnées potentiellement obsolètes)
      for (const site of sitesResponse) {
        // Vérifier si ce site n'a pas déjà été traité (pas de mesure récente)
        if (!measuresMap.has(site.id_site)) {
          devices.push({
            id: site.id_site.toString(),
            name: site.nom_site,
            latitude: site.lat, // Coordonnées potentiellement obsolètes depuis sites
            longitude: site.lon, // Coordonnées potentiellement obsolètes depuis sites
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

  // Méthode pour récupérer les variables disponibles d'un site
  async fetchSiteVariables(
    siteId: string
  ): Promise<
    Record<string, { label: string; code_iso: string; en_service: boolean }>
  > {
    try {
      // Récupérer tous les sites pour trouver celui qui nous intéresse
      const url = `${this.BASE_URL}/sites?format=json&actifs=2880`;
      const sites = await this.makeRequest(url);

      const site = sites.find(
        (s: AtmoMicroSite) => s.id_site.toString() === siteId
      );
      if (!site) {
        console.warn(`Site ${siteId} non trouvé`);
        return {};
      }

      // Parser la chaîne de variables (ex: "PM10, PM2.5, Air Pres., Air Temp., Air Hum., PM1")
      const variablesString = site.variables;
      const availableVariables: Record<
        string,
        { label: string; code_iso: string; en_service: boolean }
      > = {};

      // Extraire les variables et les mapper vers nos codes de polluants
      const variableList = variablesString.split(",").map((v) => v.trim());

      for (const variable of variableList) {
        const pollutantCode = ATMOMICRO_POLLUTANT_MAPPING[variable];
        if (pollutantCode && pollutants[pollutantCode]) {
          availableVariables[pollutantCode] = {
            label: pollutants[pollutantCode].name,
            code_iso: variable,
            en_service: true, // On suppose que si la variable est listée, elle est en service
          };
        }
      }

      return availableVariables;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des variables du site:",
        error
      );
      throw error;
    }
  }

  // Méthode pour récupérer les données historiques d'un site
  async fetchHistoricalData(params: {
    siteId: string;
    pollutant: string;
    timeStep: string;
    startDate: string;
    endDate: string;
  }): Promise<Array<{ timestamp: string; value: number; unit: string }>> {
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

      // Formater les dates pour AtmoMicro (format YYYY-MM-DDTHH:mm:ss.sssZ)
      const formatDateForAtmoMicro = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toISOString();
      };

      const formattedStartDate = formatDateForAtmoMicro(params.startDate);
      const formattedEndDate = formatDateForAtmoMicro(params.endDate);

      // Construire l'URL pour les données historiques avec les bons paramètres
      const url = `${this.BASE_URL}/mesures?id_site=${params.siteId}&format=json&download=false&nb_dec=1&valeur_brute=true&variable=${atmoMicroVariable}&type_capteur=true&aggregation=${timeStepConfig.aggregation}&debut=${formattedStartDate}&fin=${formattedEndDate}`;

      const response = await this.makeRequest(url);

      if (!response || !Array.isArray(response)) {
        console.warn("Aucune donnée historique reçue d'AtmoMicro");
        return [];
      }

      // Transformer les données historiques
      const historicalData = response.map((measure: AtmoMicroMeasure) => {
        // Utiliser la valeur corrigée si disponible, sinon la valeur brute
        const hasCorrection = measure.valeur !== null;
        const correctedValue = hasCorrection ? measure.valeur : undefined;
        const rawValue = measure.valeur_brute;
        const value = hasCorrection ? measure.valeur! : measure.valeur_brute;

        return {
          timestamp: measure.time,
          value,
          unit: measure.unite,
          // Propriétés pour les données corrigées
          corrected_value: correctedValue,
          raw_value: rawValue,
          has_correction: hasCorrection,
        };
      });

      return historicalData;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données historiques AtmoMicro:",
        error
      );
      throw error;
    }
  }

  // Méthode pour récupérer les données temporelles pour la visualisation historique
  async fetchTemporalData(params: {
    pollutant: string;
    timeStep: string;
    startDate: string;
    endDate: string;
    sites?: string[]; // Sites spécifiques si nécessaire
  }): Promise<TemporalDataPoint[]> {
    try {
      console.log(
        "🕒 [AtmoMicro] Récupération des données temporelles:",
        params
      );

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

      // OPTIMISATION : Récupérer directement toutes les mesures historiques
      // sans passer par la récupération des sites
      const temporalDataPoints = await this.fetchTemporalDataOptimized({
        variable: atmoMicroVariable,
        aggregation: timeStepConfig.aggregation,
        startDate: params.startDate,
        endDate: params.endDate,
        pollutant: params.pollutant,
        sites: params.sites,
      });

      console.log(
        `✅ [AtmoMicro] ${temporalDataPoints.length} points temporels récupérés`
      );
      return temporalDataPoints;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données temporelles AtmoMicro:",
        error
      );
      throw error;
    }
  }

  // Méthode optimisée pour récupérer les données temporelles historiques
  private async fetchTemporalDataOptimized(params: {
    variable: string;
    aggregation: string;
    startDate: string;
    endDate: string;
    pollutant: string;
    sites?: string[];
  }): Promise<TemporalDataPoint[]> {
    const { variable, aggregation, startDate, endDate, pollutant, sites } =
      params;

    // Diviser la période en tranches pour éviter les timeouts
    const temporalDataPoints: TemporalDataPoint[] = [];
    const chunkSize = 30; // 30 jours par tranche (plus efficace que 7 jours)
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculer le nombre de tranches
    const totalDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    const chunks = Math.ceil(totalDays / chunkSize);

    console.log(
      `📊 [AtmoMicro] Division en ${chunks} tranches de ${chunkSize} jours`
    );

    // Traiter chaque tranche
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
        `📅 [AtmoMicro] Traitement tranche ${i + 1}/${chunks}: ${
          chunkStart.toISOString().split("T")[0]
        } à ${chunkEnd.toISOString().split("T")[0]}`
      );

      try {
        // Construire l'URL optimisée selon votre exemple
        const url = `${
          this.BASE_URL
        }/mesures?debut=${chunkStart.toISOString()}&fin=${chunkEnd.toISOString()}&format=json&download=false&nb_dec=0&variable=${variable}&valeur_brute=false&aggregation=${aggregation}&type_capteur=false`;

        console.log(`🔗 [AtmoMicro] Requête optimisée: ${url}`);

        const response = await this.makeRequest(url);

        if (!response || !Array.isArray(response)) {
          console.warn(`Aucune donnée pour la tranche ${i + 1}`);
          continue;
        }

        // Filtrer par sites si spécifiés
        const filteredResponse = sites
          ? response.filter((measure: any) =>
              sites.includes(measure.id_site.toString())
            )
          : response;

        // Grouper les mesures par timestamp
        const measuresByTimestamp = new Map<string, any[]>();

        filteredResponse.forEach((measure: any) => {
          const timestamp = measure.time;
          if (!measuresByTimestamp.has(timestamp)) {
            measuresByTimestamp.set(timestamp, []);
          }
          measuresByTimestamp.get(timestamp)!.push(measure);
        });

        // Créer les points temporels
        for (const [timestamp, measures] of measuresByTimestamp) {
          const devices: MeasurementDevice[] = [];
          let totalValue = 0;
          let validValues = 0;
          const qualityLevels: Record<string, number> = {};

          measures.forEach((measure: any) => {
            // Utiliser les données directement de la réponse (pas besoin de chercher dans les sites)
            const displayValue = measure.valeur;

            if (displayValue !== null && !isNaN(displayValue)) {
              totalValue += displayValue;
              validValues++;
            }

            const pollutantConfig = pollutants[pollutant];
            const qualityLevel = getAirQualityLevel(
              displayValue,
              pollutantConfig.thresholds
            );

            // Compter les niveaux de qualité
            qualityLevels[qualityLevel] =
              (qualityLevels[qualityLevel] || 0) + 1;

            devices.push({
              id: measure.id_site.toString(),
              name: measure.nom_site, // Nom du site directement dans la réponse
              latitude: measure.lat, // Coordonnées directement dans la réponse
              longitude: measure.lon, // Coordonnées directement dans la réponse
              source: this.sourceCode,
              pollutant: pollutant,
              value: displayValue,
              unit: measure.unite,
              timestamp: measure.time,
              status: "active",
              qualityLevel,
              address: `${measure.nom_site}`, // Adresse simplifiée
              departmentId: "", // Pas disponible dans cette API
              corrected_value: measure.valeur_ref, // Valeur de référence
              raw_value: displayValue, // Même valeur car pas de valeur brute
              has_correction: measure.valeur !== measure.valeur_ref,
            } as MeasurementDevice & {
              qualityLevel: string;
              address: string;
              departmentId: string;
              corrected_value?: number;
              raw_value?: number;
              has_correction?: boolean;
            });
          });

          const averageValue = validValues > 0 ? totalValue / validValues : 0;

          temporalDataPoints.push({
            timestamp,
            devices,
            deviceCount: devices.length,
            averageValue,
            qualityLevels,
          });
        }

        console.log(
          `✅ [AtmoMicro] Tranche ${i + 1} traitée: ${
            measuresByTimestamp.size
          } timestamps`
        );
      } catch (error) {
        console.error(`❌ [AtmoMicro] Erreur tranche ${i + 1}:`, error);
        // Continuer avec les autres tranches même en cas d'erreur
      }
    }

    // Trier les points temporels par timestamp
    temporalDataPoints.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return temporalDataPoints;
  }
}
