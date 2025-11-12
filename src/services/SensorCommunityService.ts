import { BaseDataService } from "./BaseDataService";
import {
  MeasurementDevice,
  SensorCommunityDataPoint,
  SensorCommunityResponse,
  SENSORCOMMUNITY_POLLUTANT_MAPPING,
  SENSORCOMMUNITY_POLLUTANT_REVERSE_MAPPING,
  SENSORCOMMUNITY_TIMESTEP_MAPPING,
} from "../types";
import { getAirQualityLevel } from "../utils";
import { pollutants } from "../constants/pollutants";

export class SensorCommunityService extends BaseDataService {
  constructor() {
    super("sensorCommunity");
  }

  async fetchData(params: {
    pollutant: string;
    timeStep: string;
    sources: string[];
    signalAirPeriod?: { startDate: string; endDate: string };
    mobileAirPeriod?: { startDate: string; endDate: string };
    selectedSensors?: string[];
    signalAirSelectedTypes?: string[];
  }): Promise<MeasurementDevice[]> {
    console.log(`🔍 [SensorCommunity] fetchData appelé avec:`, {
      pollutant: params.pollutant,
      timeStep: params.timeStep,
      sources: params.sources,
      sourceCode: this.sourceCode,
    });

    try {
      // Vérifier si cette source est activée
      if (!params.sources.includes(this.sourceCode)) {
        console.log(
          `⚠️ [SensorCommunity] Source ${this.sourceCode} non activée. Sources sélectionnées:`,
          params.sources
        );
        return [];
      }

      // Vérifier si le pas de temps est supporté
      const supportedTimeSteps = ["instantane", "deuxMin"];
      if (!supportedTimeSteps.includes(params.timeStep)) {
        console.log(
          `⚠️ [SensorCommunity] Pas de temps ${
            params.timeStep
          } non supporté. Pas de temps supportés: ${supportedTimeSteps.join(
            ", "
          )}`
        );
        return [];
      }

      // Mapper le polluant vers le code Sensor Community
      const sensorCommunityPollutant =
        SENSORCOMMUNITY_POLLUTANT_REVERSE_MAPPING[params.pollutant];
      if (!sensorCommunityPollutant) {
        console.warn(
          `Polluant ${params.pollutant} non supporté par Sensor Community`
        );
        return [];
      }

      // Construire l'URL de l'API Sensor Community
      // L'API retourne directement un tableau JSON
      const url = "https://data.sensor.community/airrohr/v1/filter/country=FR";

      console.log(`Requête Sensor Community: ${url}`);

      // Faire la requête
      const response = await this.makeRequest(url);

      if (!Array.isArray(response)) {
        console.error("Réponse Sensor Community invalide:", response);
        return [];
      }

      // Transformer les données
      console.log(
        `🔄 [SensorCommunity] Début de la transformation de ${response.length} enregistrements`
      );
      const transformedData = this.transformData(response, params.pollutant);
      console.log(
        `✅ [SensorCommunity] Transformation terminée: ${transformedData.length} capteurs transformés`
      );
      return transformedData;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des données Sensor Community:`,
        error
      );
      return [];
    }
  }

  private transformData(
    data: SensorCommunityDataPoint[],
    pollutant: string
  ): MeasurementDevice[] {
    const devices: MeasurementDevice[] = [];
    const processedSensors = new Set<string>();

    for (const dataPoint of data) {
      try {
        // Créer un identifiant unique pour ce capteur à cette position
        const sensorId = `${dataPoint.sensor.id}_${dataPoint.location.id}`;

        // Éviter les doublons
        if (processedSensors.has(sensorId)) {
          continue;
        }

        // Trouver la valeur du polluant recherché
        const pollutantValue = dataPoint.sensordatavalues.find(
          (value) =>
            SENSORCOMMUNITY_POLLUTANT_MAPPING[value.value_type] === pollutant
        );

        if (!pollutantValue) {
          continue;
        }

        // Convertir la valeur en nombre
        const numericValue = parseFloat(pollutantValue.value);
        if (isNaN(numericValue)) {
          continue;
        }

        // Créer le nom du capteur
        const sensorName = `Sensor Community - ${dataPoint.sensor.sensor_type.manufacturer} ${dataPoint.sensor.sensor_type.name}`;

        // Calculer le niveau de qualité de l'air
        const pollutantConfig = pollutants[pollutant];
        const qualityLevel = getAirQualityLevel(
          numericValue,
          pollutantConfig.thresholds
        );

        console.log(
          `🎨 [SensorCommunity] Capteur ${sensorId}: valeur=${numericValue}, niveau=${qualityLevel}`
        );

        // Créer l'appareil de mesure
        const device = this.createDevice(
          sensorId,
          sensorName,
          parseFloat(dataPoint.location.latitude),
          parseFloat(dataPoint.location.longitude),
          pollutant,
          numericValue,
          "µg/m³", // Sensor Community utilise toujours µg/m³ pour les particules
          dataPoint.timestamp,
          "active"
        );

        // Ajouter des métadonnées supplémentaires et le niveau de qualité
        device.address = `Altitude: ${dataPoint.location.altitude}m`;
        device.departmentId = dataPoint.location.country;
        device.qualityLevel = qualityLevel;

        // Ajouter des propriétés spécifiques à Sensor Community pour le popup
        (device as any).sensorId = dataPoint.sensor.id.toString();
        (device as any).manufacturer =
          dataPoint.sensor.sensor_type.manufacturer;
        (device as any).sensorType = dataPoint.sensor.sensor_type.name;
        (device as any).altitude = dataPoint.location.altitude;

        devices.push(device);
        processedSensors.add(sensorId);
      } catch (error) {
        console.error(
          "Erreur lors de la transformation des données Sensor Community:",
          error
        );
        continue;
      }
    }

    console.log(
      `Sensor Community: ${devices.length} capteurs transformés pour ${pollutant}`
    );
    return devices;
  }
}
