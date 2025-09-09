// Couleurs standardisées pour les niveaux de qualité de l'air
// Utilisées dans la légende et tous les composants de visualisation

export const QUALITY_COLORS = {
  noData: "#999999",
  bon: "#4ff0e6",
  moyen: "#51ccaa",
  degrade: "#ede663",
  mauvais: "#ed5e58",
  tresMauvais: "#881b33",
  extrMauvais: "#74287d",
  default: "#999999", // Alias pour noData
};

// Fonction utilitaire pour obtenir la couleur selon la valeur et les seuils
export const getQualityColor = (
  value: number,
  pollutant: string,
  pollutants: any
): string => {
  const pollutantConfig = pollutants[pollutant];
  if (!pollutantConfig) return QUALITY_COLORS.noData;

  const thresholds = pollutantConfig.thresholds;

  if (value <= thresholds.bon.max) return QUALITY_COLORS.bon;
  if (value <= thresholds.moyen.max) return QUALITY_COLORS.moyen;
  if (value <= thresholds.degrade.max) return QUALITY_COLORS.degrade;
  if (value <= thresholds.mauvais.max) return QUALITY_COLORS.mauvais;
  if (value <= thresholds.tresMauvais.max) return QUALITY_COLORS.tresMauvais;
  return QUALITY_COLORS.extrMauvais;
};

// Fonction utilitaire pour obtenir le niveau de qualité
export const getQualityLevel = (
  value: number,
  pollutant: string,
  pollutants: any
): string => {
  const pollutantConfig = pollutants[pollutant];
  if (!pollutantConfig) return "noData";

  const thresholds = pollutantConfig.thresholds;

  if (value <= thresholds.bon.max) return "bon";
  if (value <= thresholds.moyen.max) return "moyen";
  if (value <= thresholds.degrade.max) return "degrade";
  if (value <= thresholds.mauvais.max) return "mauvais";
  if (value <= thresholds.tresMauvais.max) return "tresMauvais";
  return "extrMauvais";
};
