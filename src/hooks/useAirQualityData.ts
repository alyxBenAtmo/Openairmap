import { useState, useEffect, useCallback } from "react";
import { MeasurementDevice } from "../types";
import { DataServiceFactory } from "../services/DataServiceFactory";

interface UseAirQualityDataProps {
  selectedPollutant: string;
  selectedSources: string[];
  selectedTimeStep: string;
  signalAirPeriod?: { startDate: string; endDate: string };
}

export const useAirQualityData = ({
  selectedPollutant,
  selectedSources,
  selectedTimeStep,
  signalAirPeriod,
}: UseAirQualityDataProps) => {
  const [devices, setDevices] = useState<MeasurementDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingSources, setLoadingSources] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    if (selectedSources.length === 0) {
      setDevices([]);
      return;
    }

    console.log(
      `🔄 Appel API - Polluant: ${selectedPollutant}, Sources: ${selectedSources.join(
        ", "
      )}, Pas de temps: ${selectedTimeStep}${
        signalAirPeriod
          ? `, Période SignalAir: ${signalAirPeriod.startDate} - ${signalAirPeriod.endDate}`
          : ""
      }`
    );

    // Nettoyer complètement les données avant le nouvel appel
    setDevices([]);
    setLoading(true);
    setError(null);
    setLoadingSources(selectedSources);

    try {
      const services = DataServiceFactory.getServices(selectedSources);
      const allDevices: MeasurementDevice[] = [];

      // Récupérer les données de toutes les sources sélectionnées
      const promises = services.map(async (service, index) => {
        try {
          const data = await service.fetchData({
            pollutant: selectedPollutant,
            timeStep: selectedTimeStep,
            sources: selectedSources,
            signalAirPeriod,
          });

          // Retirer cette source de la liste des sources en cours
          setLoadingSources((prev) =>
            prev.filter((source) => source !== selectedSources[index])
          );

          return data;
        } catch (err) {
          console.error(
            `Erreur lors de la récupération des données pour ${service}:`,
            err
          );

          // Retirer cette source de la liste des sources en cours même en cas d'erreur
          setLoadingSources((prev) =>
            prev.filter((source) => source !== selectedSources[index])
          );

          return [];
        }
      });

      const results = await Promise.all(promises);
      results.forEach((devices) => allDevices.push(...devices));

      console.log(`✅ Données récupérées: ${allDevices.length} appareils`);
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
      setLoadingSources([]);
    }
  }, [selectedPollutant, selectedSources, selectedTimeStep, signalAirPeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { devices, loading, error, loadingSources };
};
