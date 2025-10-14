import React from "react";
import { pollutants } from "../../constants/pollutants";
import { QUALITY_COLORS } from "../../constants/qualityColors";

interface LegendProps {
  selectedPollutant: string;
  isSidePanelOpen?: boolean;
  panelSize?: "normal" | "fullscreen" | "hidden";
}

const Legend: React.FC<LegendProps> = ({
  selectedPollutant,
  isSidePanelOpen = false,
  panelSize = "normal",
}) => {
  // Utiliser les couleurs centralisées
  const colors = QUALITY_COLORS;

  // Obtenir les seuils du polluant sélectionné
  const pollutant = pollutants[selectedPollutant];
  const thresholds = pollutant?.thresholds;

  if (!thresholds) {
    return null;
  }

  const legendItems = [
    {
      label: "Pas de donnée",
      shortLabel: "N/A",
      color: colors.noData,
    },
    {
      label: "Bon",
      shortLabel: "Bon",
      color: colors.bon,
      range: `${thresholds.bon.min}-${thresholds.bon.max}`,
    },
    {
      label: "Moyen",
      shortLabel: "Moyen",
      color: colors.moyen,
      range: `${thresholds.moyen.min}-${thresholds.moyen.max}`,
    },
    {
      label: "Dégradé",
      shortLabel: "Dégradé",
      color: colors.degrade,
      range: `${thresholds.degrade.min}-${thresholds.degrade.max}`,
    },
    {
      label: "Mauvais",
      shortLabel: "Mauvais",
      color: colors.mauvais,
      range: `${thresholds.mauvais.min}-${thresholds.mauvais.max}`,
    },
    {
      label: "Très mauvais",
      shortLabel: "Très M.",
      color: colors.tresMauvais,
      range: `${thresholds.tresMauvais.min}-${thresholds.tresMauvais.max}`,
    },
    {
      label: "Extrêmement mauvais",
      shortLabel: "Extr. M.",
      color: colors.extrMauvais,
      range: `${thresholds.extrMauvais.min}+`,
    },
  ];

  // Calculer la position de la légende selon l'état du side panel
  const getLegendPosition = () => {
    if (!isSidePanelOpen || panelSize === "hidden") {
      // Side panel fermé ou masqué :
      // Mobile: verticale à droite, positionnée au-dessus de l'encart d'appareils
      // Desktop: horizontale centrée
      return "absolute bottom-20 right-2 md:bottom-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2";
    }

    if (panelSize === "fullscreen") {
      // Side panel en plein écran : position centrée (panel au-dessus)
      return "absolute bottom-4 left-1/2 transform -translate-x-1/2";
    }

    // Side panel normal :
    // Sur mobile, cacher la légende car le panel prend toute la largeur
    // Sur desktop, décaler vers la droite pour éviter le chevauchement
    return "absolute bottom-4 left-1/2 transform -translate-x-1/2 md:left-auto md:right-4 md:transform-none hidden md:block";
  };

  return (
    <div
      className={`${getLegendPosition()} z-[1000] transition-all duration-300 ease-in-out max-w-[95vw] md:max-w-none`}
    >
      <div className="bg-white/90 backdrop-blur-sm rounded-md shadow-sm border border-gray-200/50 px-2 py-1.5 md:px-3 md:py-2">
        {/* Grille des seuils - verticale sur mobile, horizontale sur desktop */}
        <div className="flex flex-col gap-1 md:flex-row md:flex-wrap md:gap-2 md:justify-center">
          {legendItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center space-x-1 md:space-x-1.5 group relative"
              title={
                item.range
                  ? `${item.label}: ${item.range} ${pollutant.unit}`
                  : item.label
              }
            >
              {/* Indicateur de couleur */}
              <div
                className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm border border-gray-300/50 flex-shrink-0"
                style={{ backgroundColor: item.color }}
              ></div>

              {/* Texte - version courte sur mobile, complète sur desktop */}
              <span className="text-[10px] md:text-xs text-gray-700 font-medium whitespace-nowrap">
                <span className="md:hidden">{item.shortLabel}</span>
                <span className="hidden md:inline">{item.label}</span>
              </span>

              {/* Tooltip au hover - desktop uniquement */}
              {item.range && (
                <div className="hidden md:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[1001]">
                  {item.range} {pollutant.unit}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Legend;
