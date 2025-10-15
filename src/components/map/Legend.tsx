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

  // Position fixe de la légende pour éviter les décalages
  const getLegendPosition = () => {
    // Position fixe : mobile à droite au-dessus de la carte d'appareils, desktop légèrement à gauche
    // La légende ne bouge plus selon l'état du side panel
    return "absolute bottom-12 right-2 lg:bottom-4 lg:left-1/2 lg:right-auto lg:transform lg:-translate-x-1/2 lg:ml-[-20px]";
  };

  return (
    <div
      className={`${getLegendPosition()} z-[1000] transition-all duration-300 ease-in-out max-w-[95vw] md:max-w-none ${
        // Cacher sur mobile quand le side panel est ouvert (sauf si masqué)
        isSidePanelOpen && panelSize !== "hidden" ? "hidden md:block" : "block"
      }`}
    >
      <div className="bg-white/90 backdrop-blur-sm rounded-md shadow-sm border border-gray-200/50 px-2 py-1.5 lg:px-3 lg:py-2">
        {/* Grille des seuils - verticale sur mobile et petits écrans, horizontale sur grands écrans */}
        <div className="flex flex-col gap-1 lg:flex-row lg:flex-wrap lg:gap-2 lg:justify-center">
          {legendItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center space-x-1 lg:space-x-1.5 group relative"
              title={
                item.range
                  ? `${item.label}: ${item.range} ${pollutant.unit}`
                  : item.label
              }
            >
              {/* Indicateur de couleur */}
              <div
                className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-sm border border-gray-300/50 flex-shrink-0"
                style={{ backgroundColor: item.color }}
              ></div>

              {/* Texte - version courte sur mobile et petits écrans, complète sur grands écrans */}
              <span className="text-[10px] lg:text-xs text-gray-700 font-medium whitespace-nowrap">
                <span className="lg:hidden">{item.shortLabel}</span>
                <span className="hidden lg:inline">{item.label}</span>
              </span>

              {/* Tooltip au hover - grands écrans uniquement */}
              {item.range && (
                <div className="hidden lg:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[1001]">
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
