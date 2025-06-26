import React from "react";
import { pollutants } from "../../constants/pollutants";

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
  // Couleurs pour chaque seuil
  const colors = {
    noData: "#999999",
    bon: "#4ff0e6",
    moyen: "#51ccaa",
    degrade: "#ede663",
    mauvais: "#ed5e58",
    tresMauvais: "#881b33",
    extrMauvais: "#74287d",
  };

  // Obtenir les seuils du polluant sélectionné
  const pollutant = pollutants[selectedPollutant];
  const thresholds = pollutant?.thresholds;

  if (!thresholds) {
    return null;
  }

  const legendItems = [
    { label: "Pas de donnée", color: colors.noData },
    {
      label: "Bon",
      color: colors.bon,
      range: `${thresholds.bon.min}-${thresholds.bon.max}`,
    },
    {
      label: "Moyen",
      color: colors.moyen,
      range: `${thresholds.moyen.min}-${thresholds.moyen.max}`,
    },
    {
      label: "Dégradé",
      color: colors.degrade,
      range: `${thresholds.degrade.min}-${thresholds.degrade.max}`,
    },
    {
      label: "Mauvais",
      color: colors.mauvais,
      range: `${thresholds.mauvais.min}-${thresholds.mauvais.max}`,
    },
    {
      label: "Très mauvais",
      color: colors.tresMauvais,
      range: `${thresholds.tresMauvais.min}-${thresholds.tresMauvais.max}`,
    },
    {
      label: "Extrêmement mauvais",
      color: colors.extrMauvais,
      range: `${thresholds.extrMauvais.min}+`,
    },
  ];

  // Calculer la position de la légende selon l'état du side panel
  const getLegendPosition = () => {
    if (!isSidePanelOpen || panelSize === "hidden") {
      // Side panel fermé ou masqué : position centrée
      return "absolute bottom-4 left-1/2 transform -translate-x-1/2";
    }

    if (panelSize === "fullscreen") {
      // Side panel en plein écran : position centrée (panel au-dessus)
      return "absolute bottom-4 left-1/2 transform -translate-x-1/2";
    }

    // Side panel normal : décaler vers la droite pour éviter le chevauchement
    // Sur mobile, rester centré car le panel prend toute la largeur
    // Sur desktop, décaler vers la droite
    return "absolute bottom-4 left-1/2 transform -translate-x-1/2 md:left-auto md:right-4 md:transform-none";
  };

  return (
    <div
      className={`${getLegendPosition()} z-[1000] transition-all duration-300 ease-in-out`}
    >
      <div className="bg-white/90 backdrop-blur-sm rounded-md shadow-sm border border-gray-200/50 px-3 py-2">
        {/* Grille des seuils */}
        <div className="flex flex-wrap gap-2 justify-center">
          {legendItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center space-x-1.5 group relative"
              title={
                item.range
                  ? `${item.label}: ${item.range} ${pollutant.unit}`
                  : item.label
              }
            >
              {/* Indicateur de couleur */}
              <div
                className="w-3 h-3 rounded-sm border border-gray-300/50 flex-shrink-0"
                style={{ backgroundColor: item.color }}
              ></div>

              {/* Texte */}
              <span className="text-xs text-gray-700 font-medium">
                {item.label}
              </span>

              {/* Tooltip au hover */}
              {item.range && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[1001]">
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
