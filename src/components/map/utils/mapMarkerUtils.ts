/**
 * Fonction utilitaire pour déterminer le niveau de zoom optimal selon le type de résultat
 */
export const getOptimalZoomLevel = (result: any): number => {
  const address = result.address || "";
  const name = result.name || "";
  const type = result.type || "";

  // Utiliser le type de résultat si disponible
  switch (type.toLowerCase()) {
    case "house":
    case "building":
    case "address":
      return 18; // Zoom maximum pour une adresse précise
    case "street":
    case "road":
      return 16; // Zoom fort pour une rue
    case "neighbourhood":
    case "suburb":
    case "district":
      return 14; // Zoom moyen pour un quartier
    case "city":
    case "town":
    case "village":
      return 12; // Zoom moyen-faible pour une ville
    case "county":
    case "state":
    case "department":
      return 10; // Zoom faible pour un département
    case "country":
    case "region":
      return 6; // Zoom très faible pour une région
    default:
      // Fallback sur l'analyse du texte
      if (address.match(/\d+/) || name.match(/\d+/)) {
        return 18; // Adresse avec numéro
      } else if (
        address.includes("rue") ||
        address.includes("avenue") ||
        address.includes("boulevard") ||
        address.includes("place") ||
        name.includes("rue") ||
        name.includes("avenue") ||
        name.includes("boulevard") ||
        name.includes("place")
      ) {
        return 16; // Rue sans numéro
      } else if (
        address.includes("arrondissement") ||
        address.includes("quartier") ||
        name.includes("arrondissement") ||
        name.includes("quartier")
      ) {
        return 14; // Quartier/arrondissement
      } else if (address.includes("commune") || name.includes("commune")) {
        return 12; // Commune
      } else {
        return 15; // Zoom par défaut
      }
  }
};

