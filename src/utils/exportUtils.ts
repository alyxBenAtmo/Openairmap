/**
 * Utilitaires pour l'exportation des graphiques et données
 */

import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import { pollutants } from "../constants/pollutants";
import { StationInfo } from "../types";

/**
 * Formate le pas de temps pour l'affichage
 * @param timeStep - Code du pas de temps (instantane, quartHeure, heure, jour)
 * @param sensorTimeStep - Pas de temps du capteur en secondes (optionnel, pour le mode instantane)
 * @returns string - Format lisible du pas de temps
 */
const formatTimeStepForExport = (timeStep?: string, sensorTimeStep?: number | null): string => {
  if (!timeStep) return "";
  
  switch (timeStep) {
    case "instantane":
      if (sensorTimeStep !== null && sensorTimeStep !== undefined) {
        if (sensorTimeStep < 60) {
          return `Scan: ${sensorTimeStep}s`;
        } else if (sensorTimeStep < 3600) {
          const minutes = Math.round(sensorTimeStep / 60);
          return `Scan: ${minutes}min`;
        } else if (sensorTimeStep < 86400) {
          const hours = Math.round(sensorTimeStep / 3600);
          return `Scan: ${hours}h`;
        } else {
          const days = Math.round(sensorTimeStep / 86400);
          return `Scan: ${days}j`;
        }
      }
      return "Scan";
    case "quartHeure":
      return "15min";
    case "heure":
      return "1h";
    case "jour":
      return "1j";
    default:
      return timeStep;
  }
};

/**
 * Exporte un graphique Recharts en image PNG
 * @param chartRef - Référence vers le composant ResponsiveContainer
 * @param filename - Nom du fichier (sans extension)
 * @param stationInfo - Informations de la station (optionnel)
 * @param selectedPollutants - Polluants sélectionnés (optionnel)
 * @param source - Source des données (optionnel)
 * @param stations - Stations pour le mode comparaison (optionnel)
 * @param timeStep - Pas de temps sélectionné (optionnel)
 * @param sensorTimeStep - Pas de temps du capteur en secondes (optionnel, pour le mode instantane)
 * @returns Promise<void>
 */
export const exportChartAsPNG = async (
  chartRef: React.RefObject<any>,
  filename: string = "graphique",
  stationInfo: StationInfo | null = null,
  selectedPollutants: string[] = [],
  source: string = "",
  stations: any[] = [],
  timeStep?: string,
  sensorTimeStep?: number | null
): Promise<void> => {
  if (!chartRef.current) {
    throw new Error("Référence du graphique non disponible");
  }

  try {
    // Attendre un peu pour s'assurer que le graphique est complètement rendu
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Masquer tous les tooltips de Recharts avant la capture
    // Recharts utilise plusieurs classes possibles pour le tooltip
    const tooltipSelectors = [
      '.recharts-tooltip-wrapper',
      '.recharts-tooltip',
      '[class*="recharts-tooltip"]',
    ];
    
    const originalStyles: Array<{ element: HTMLElement; display: string; visibility: string }> = [];
    const foundElements = new Set<HTMLElement>();
    
    tooltipSelectors.forEach((selector) => {
      const elements = chartRef.current?.querySelectorAll(selector);
      if (elements) {
        elements.forEach((element) => {
          const htmlElement = element as HTMLElement;
          // Éviter de traiter le même élément plusieurs fois
          if (!foundElements.has(htmlElement)) {
            foundElements.add(htmlElement);
            originalStyles.push({
              element: htmlElement,
              display: htmlElement.style.display,
              visibility: htmlElement.style.visibility,
            });
            htmlElement.style.display = 'none';
            htmlElement.style.visibility = 'hidden';
          }
        });
      }
    });

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

    // Restaurer les styles des tooltips après la capture
    originalStyles.forEach(({ element, display, visibility }) => {
      element.style.display = display;
      element.style.visibility = visibility;
    });

    // Calculer la hauteur nécessaire pour le titre et les métadonnées
    const paddingBottom = 20;
    const paddingLeft = 20;
    const paddingRight = 20;
    
    const isComparisonMode = source === "comparison" && stations.length > 0;
    
    let paddingTop = 20;
    if (stationInfo) {
      // Estimer la hauteur nécessaire (approximatif)
      // Nom appareil: 1 ligne (30px) + espace
      let estimatedLines = 1; // Nom de l'appareil
      if (stationInfo.sensorModel) estimatedLines += 1; // Modèle
      if (timeStep) estimatedLines += 1; // Pas de temps
      paddingTop = estimatedLines * 30 + 40; // Marge de sécurité
    } else if (isComparisonMode) {
      // Mode comparaison : titre + polluant + liste des stations + date
      let estimatedLines = 2; // Titre + espace
      if (selectedPollutants.length > 0) estimatedLines += 1;
      estimatedLines += stations.length; // Une ligne par station
      estimatedLines += 1; // Date d'export
      paddingTop = estimatedLines * 25 + 30; // Marge de sécurité
    }
    
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = canvas.width + paddingLeft + paddingRight;
    finalCanvas.height = canvas.height + paddingTop + paddingBottom;
    const ctx = finalCanvas.getContext("2d");
    
    if (!ctx) {
      throw new Error("Impossible de créer le contexte du canvas");
    }

    // Fond blanc
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    // Fonction pour dessiner du texte centré
    const drawCenteredText = (text: string, y: number, fontSize: string = "16px", isBold: boolean = false): number => {
      ctx.font = isBold ? `bold ${fontSize} Arial, sans-serif` : `${fontSize} Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(text, finalCanvas.width / 2, y);
      return y + (isBold ? 30 : 25);
    };

    // Ajouter les métadonnées centrées au-dessus du graphique
    if (stationInfo) {
      ctx.fillStyle = "#000000";
      
      let yOffset = 30;
      
      // Nom de l'appareil (en gras)
      yOffset = drawCenteredText(stationInfo.name, yOffset, "18px", true);
      
      // Modèle du capteur (si disponible)
      if (stationInfo.sensorModel) {
        yOffset = drawCenteredText(`Modèle: ${stationInfo.sensorModel}`, yOffset, "14px", false);
      }
      
      // Pas de temps (si disponible)
      if (timeStep) {
        const formattedTimeStep = formatTimeStepForExport(timeStep, sensorTimeStep);
        if (formattedTimeStep) {
          yOffset = drawCenteredText(`Pas de temps: ${formattedTimeStep}`, yOffset, "14px", false);
        }
      }
      
      // Réinitialiser l'alignement pour le reste du code
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    } else if (isComparisonMode) {
      // Mode comparaison : afficher les informations de comparaison
      ctx.fillStyle = "#000000";
      ctx.font = "bold 20px Arial, sans-serif";
      
      const maxTextWidth = finalCanvas.width - paddingLeft - paddingRight;
      
      // Titre : "Comparaison de stations"
      let yOffset = drawText("Comparaison de stations", paddingLeft, 30, maxTextWidth);
      
      // Polluant comparé
      ctx.font = "14px Arial, sans-serif";
      if (selectedPollutants.length > 0) {
        const pollutantName = pollutants[selectedPollutants[0]]?.name || selectedPollutants[0];
        yOffset = drawText(`Polluant: ${pollutantName}`, paddingLeft, yOffset, maxTextWidth);
      }
      
      // Liste des appareils/stations comparées
      yOffset = drawText(`Appareils (${stations.length}):`, paddingLeft, yOffset, maxTextWidth);
      stations.forEach((station) => {
        yOffset = drawText(`  • ${station.name}`, paddingLeft, yOffset, maxTextWidth);
      });
      
      // Date et heure d'export
      const now = new Date();
      drawText(
        `Exporté le: ${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString("fr-FR")}`,
        paddingLeft,
        yOffset,
        maxTextWidth
      );
    }

    // Dessiner le graphique original
    ctx.drawImage(canvas, paddingLeft, paddingTop);

    // Convertir en blob et télécharger
    finalCanvas.toBlob(
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
 * @param stationInfo - Informations de la station (optionnel)
 * @param timeStep - Pas de temps sélectionné (optionnel)
 * @param sensorTimeStep - Pas de temps du capteur en secondes (optionnel, pour le mode instantane)
 * @returns Promise<void>
 */
export const exportDataAsCSV = (
  data: any[],
  filename: string = "donnees",
  source: string = "",
  stations: any[] = [],
  selectedPollutants: string[] = [],
  stationInfo: StationInfo | null = null,
  timeStep?: string,
  sensorTimeStep?: number | null
): void => {
  if (!data || data.length === 0) {
    throw new Error("Aucune donnée à exporter");
  }

  try {
    // Préparer les métadonnées en en-tête
    const metadataLines: string[] = [];
    const isComparisonMode = source === "comparison" && stations.length > 0;
    
    if (stationInfo) {
      // Nom de l'appareil
      metadataLines.push(`Appareil: ${stationInfo.name}`);
      
      // Modèle du capteur (si disponible)
      if (stationInfo.sensorModel) {
        metadataLines.push(`Modèle: ${stationInfo.sensorModel}`);
      }
      
      // Pas de temps (si disponible)
      if (timeStep) {
        const formattedTimeStep = formatTimeStepForExport(timeStep, sensorTimeStep);
        if (formattedTimeStep) {
          metadataLines.push(`Pas de temps: ${formattedTimeStep}`);
        }
      }
      
      metadataLines.push(""); // Ligne vide avant les données
    } else if (isComparisonMode) {
      // Mode comparaison : ajouter les métadonnées de comparaison
      metadataLines.push("Comparaison de stations");
      if (selectedPollutants.length > 0) {
        const pollutantName = pollutants[selectedPollutants[0]]?.name || selectedPollutants[0];
        metadataLines.push(`Polluant: ${pollutantName}`);
      }
      metadataLines.push(`Appareils (${stations.length}):`);
      stations.forEach((station) => {
        metadataLines.push(`  • ${station.name}`);
      });
      const now = new Date();
      metadataLines.push(
        `Exporté le: ${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString("fr-FR")}`
      );
      metadataLines.push(""); // Ligne vide avant les données
    }

    // Préparer les en-têtes de colonnes
    const headers = ["Timestamp", "Date"];

    if (source === "comparison" && stations.length > 0) {
      // Mode comparaison : une colonne par station
      stations.forEach((station) => {
        headers.push(`${station.name} (${selectedPollutants[0] || "Valeur"})`);
      });
    } else if (source === "atmoRef") {
      // AtmoRef : une seule colonne par polluant (pas de distinction brut/corrigé)
      selectedPollutants.forEach((pollutant) => {
        const pollutantName = pollutants[pollutant]?.name || pollutant;
        headers.push(pollutantName);
      });
    } else {
      // Mode normal : une colonne par polluant (corrigé et brut)
      selectedPollutants.forEach((pollutant) => {
        headers.push(`${pollutant} (corrigé)`);
        headers.push(`${pollutant} (brut)`);
      });
    }

    // Convertir les données en CSV
    const csvContent = [
      ...metadataLines,
      headers.join(","),
      ...data.map((row) => {
        const values = [row.rawTimestamp || row.timestamp, row.timestamp];

        if (source === "comparison" && stations.length > 0) {
          // Mode comparaison
          stations.forEach((station) => {
            values.push(row[station.id] || "");
          });
        } else if (source === "atmoRef") {
          // AtmoRef : lire directement depuis la clé du polluant (pas de _corrected ou _raw)
          selectedPollutants.forEach((pollutant) => {
            values.push(row[pollutant] || "");
          });
        } else {
          // Mode normal : données corrigées et brutes
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

    // Ajouter le BOM UTF-8 pour que les caractères Unicode s'affichent correctement dans Excel
    const BOM = "\uFEFF";
    const csvWithBOM = BOM + csvContent;

    // Télécharger le fichier CSV avec file-saver
    const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
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
 * @param stationInfo - Informations de la station (optionnel)
 * @returns string
 */
export const generateExportFilename = (
  source: string,
  selectedPollutants: string[],
  stations: any[] = [],
  stationInfo: StationInfo | null = null
): string => {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

  let filename = `export_${dateStr}`;

  // Ajouter le nom de la station si disponible
  if (stationInfo) {
    // Nettoyer le nom de la station pour le nom de fichier (enlever caractères spéciaux)
    const cleanStationName = stationInfo.name
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .replace(/_+/g, "_")
      .substring(0, 30); // Limiter la longueur
    filename += `_${cleanStationName}`;
  }

  if (source === "comparison" && stations.length > 0) {
    filename += `_comparaison_${selectedPollutants[0] || "donnees"}`;
  } else {
    filename += `_${selectedPollutants.join("_")}`;
  }

  return filename;
};
