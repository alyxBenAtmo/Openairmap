import { useState, useEffect } from "react";
import { MeasurementDevice } from "../types";
import { DataServiceFactory } from "../services/DataServiceFactory";

interface UseAirQualityDataProps {
  selectedPollutant: string;
  selectedSources: string[];
  selectedTimeStep: string;
}

export const useAirQualityData = ({
  selectedPollutant,
  selectedSources,
  selectedTimeStep,
}: UseAirQualityDataProps) => {
  const [devices, setDevices] = useState<MeasurementDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedSources.length === 0) {
        setDevices([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const services = DataServiceFactory.getServices(selectedSources);
        const allDevices: MeasurementDevice[] = [];

        // Récupérer les données de toutes les sources sélectionnées
        const promises = services.map(async (service) => {
          try {
            const data = await service.fetchData({
              pollutant: selectedPollutant,
              timeStep: selectedTimeStep,
              sources: selectedSources,
            });
            return data;
          } catch (err) {
            console.error(
              `Erreur lors de la récupération des données pour ${service}:`,
              err
            );
            return [];
          }
        });

        const results = await Promise.all(promises);
        results.forEach((devices) => allDevices.push(...devices));

        setDevices(allDevices);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors de la récupération des données"
        );
        setDevices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPollutant, selectedSources, selectedTimeStep]);

  return { devices, loading, error };
};
