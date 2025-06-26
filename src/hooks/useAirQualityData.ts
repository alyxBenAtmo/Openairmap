import { useState, useEffect, useCallback } from "react";
import { MeasurementDevice, SignalAirReport } from "../types";
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
  const [reports, setReports] = useState<SignalAirReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingSources, setLoadingSources] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    if (selectedSources.length === 0) {
      setDevices([]);
      setReports([]);
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
    setReports([]);
    setLoading(true);
    setError(null);
    setLoadingSources(selectedSources);

    try {
      const services = DataServiceFactory.getServices(selectedSources);

      // Traiter chaque service individuellement pour un affichage progressif
      for (let i = 0; i < services.length; i++) {
        const service = services[i];
        const sourceCode = selectedSources[i];

        try {
          console.log(`📡 Chargement de ${sourceCode}...`);

          const data = await service.fetchData({
            pollutant: selectedPollutant,
            timeStep: selectedTimeStep,
            sources: selectedSources,
            signalAirPeriod,
          });

          // Séparer les appareils de mesure des signalements
          if (Array.isArray(data)) {
            const measurementDevices: MeasurementDevice[] = [];
            const signalReports: SignalAirReport[] = [];

            data.forEach((item) => {
              if ("pollutant" in item && "value" in item && "unit" in item) {
                // C'est un MeasurementDevice
                measurementDevices.push(item as MeasurementDevice);
              } else if ("signalType" in item) {
                // C'est un SignalAirReport
                signalReports.push(item as SignalAirReport);
              }
            });

            // Mettre à jour les appareils de mesure
            if (measurementDevices.length > 0) {
              setDevices((prevDevices) => {
                // Filtrer les anciennes données de cette source
                const filteredDevices = prevDevices.filter(
                  (device) => device.source !== sourceCode
                );
                // Ajouter les nouvelles données
                return [...filteredDevices, ...measurementDevices];
              });
            }

            // Mettre à jour les signalements (uniquement pour SignalAir)
            if (signalReports.length > 0 && sourceCode === "signalair") {
              setReports((prevReports) => {
                // Filtrer les anciens signalements de cette source
                const filteredReports = prevReports.filter(
                  (report) => report.source !== sourceCode
                );
                // Ajouter les nouveaux signalements
                return [...filteredReports, ...signalReports];
              });
            }

            console.log(
              `✅ ${sourceCode}: ${measurementDevices.length} appareils, ${signalReports.length} signalements chargés`
            );
          }
        } catch (err) {
          console.error(
            `❌ Erreur lors de la récupération des données pour ${sourceCode}:`,
            err
          );

          // En cas d'erreur, on garde les données existantes mais on retire la source du loading
        } finally {
          // Retirer cette source de la liste des sources en cours
          setLoadingSources((prev) =>
            prev.filter((source) => source !== sourceCode)
          );
        }
      }

      console.log(`✅ Toutes les sources traitées`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la récupération des données"
      );
    } finally {
      setLoading(false);
    }
  }, [selectedPollutant, selectedSources, selectedTimeStep, signalAirPeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { devices, reports, loading, error, loadingSources };
};
