/**
 * Utilitaires pour l'exportation des graphiques et données
 */

import html2canvas from "html2canvas";
import { saveAs } from "file-saver";

/**
 * Exporte un graphique Recharts en image PNG
 * @param chartRef - Référence vers le composant ResponsiveContainer
 * @param filename - Nom du fichier (sans extension)
 * @returns Promise<void>
 */
export const exportChartAsPNG = async (
  chartRef: React.RefObject<any>,
  filename: string = "graphique"
): Promise<void> => {
  if (!chartRef.current) {
    throw new Error("Référence du graphique non disponible");
  }

  try {
    // Attendre un peu pour s'assurer que le graphique est complètement rendu
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Utiliser html2canvas sur le conteneur parent avec des options optimisées
    const canvas = await html2canvas(chartRef.current, {
      backgroundColor: "#ffffff",
      scale: 2, // Haute résolution
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: chartRef.current.offsetWidth,
      height: chartRef.current.offsetHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: chartRef.current.offsetWidth,
      windowHeight: chartRef.current.offsetHeight,
    });

    // Convertir en blob et télécharger
    canvas.toBlob(
      (blob) => {
        if (blob) {
          saveAs(blob, `${filename}.png`);
        }
      },
      "image/png",
      0.95
    );
  } catch (error) {
    console.error("Erreur lors de l'export PNG:", error);
    throw error;
  }
};

// exportChartAsSVG supprimé à la demande (option SVG retirée)

/**
 * Exporte les données du graphique en CSV
 * @param data - Données du graphique
 * @param filename - Nom du fichier (sans extension)
 * @param source - Source des données (pour personnaliser les colonnes)
 * @param stations - Stations (pour le mode comparaison)
 * @param selectedPollutants - Polluants sélectionnés
 * @returns Promise<void>
 */
export const exportDataAsCSV = (
  data: any[],
  filename: string = "donnees",
  source: string = "",
  stations: any[] = [],
  selectedPollutants: string[] = []
): void => {
  if (!data || data.length === 0) {
    throw new Error("Aucune donnée à exporter");
  }

  try {
    // Préparer les en-têtes de colonnes
    const headers = ["Timestamp", "Date"];

    if (source === "comparison" && stations.length > 0) {
      // Mode comparaison : une colonne par station
      stations.forEach((station) => {
        headers.push(`${station.name} (${selectedPollutants[0] || "Valeur"})`);
      });
    } else {
      // Mode normal : une colonne par polluant
      selectedPollutants.forEach((pollutant) => {
        headers.push(`${pollutant} (corrigé)`);
        headers.push(`${pollutant} (brut)`);
      });
    }

    // Convertir les données en CSV
    const csvContent = [
      headers.join(","),
      ...data.map((row) => {
        const values = [row.rawTimestamp || row.timestamp, row.timestamp];

        if (source === "comparison" && stations.length > 0) {
          // Mode comparaison
          stations.forEach((station) => {
            values.push(row[station.id] || "");
          });
        } else {
          // Mode normal
          selectedPollutants.forEach((pollutant) => {
            values.push(row[`${pollutant}_corrected`] || "");
            values.push(row[`${pollutant}_raw`] || "");
          });
        }

        return values
          .map((value) =>
            typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value
          )
          .join(",");
      }),
    ].join("\n");

    // Télécharger le fichier CSV avec file-saver
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${filename}.csv`);
  } catch (error) {
    console.error("Erreur lors de l'export CSV:", error);
    throw error;
  }
};

/**
 * Génère un nom de fichier basé sur la date et les paramètres
 * @param source - Source des données
 * @param selectedPollutants - Polluants sélectionnés
 * @param stations - Stations (pour le mode comparaison)
 * @returns string
 */
export const generateExportFilename = (
  source: string,
  selectedPollutants: string[],
  stations: any[] = []
): string => {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

  let filename = `export_${dateStr}`;

  if (source === "comparison" && stations.length > 0) {
    filename += `_comparaison_${selectedPollutants[0] || "donnees"}`;
  } else {
    filename += `_${selectedPollutants.join("_")}`;
  }

  return filename;
};
