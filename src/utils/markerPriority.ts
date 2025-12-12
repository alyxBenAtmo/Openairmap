import { MeasurementDevice } from "../types";

/**
 * Ordre de priorité des sources de données
 * Plus le nombre est élevé, plus la priorité est haute
 */
const SOURCE_PRIORITY: Record<string, number> = {
  atmoRef: 1000,           // Station (priorité la plus haute)
  atmoMicro: 1000,          // Microcapteur qualifié
  nebuleair: 600,          // Nebuleair
  purpleair: 400,          // Autres
  sensorCommunity: 400,    // Autres
  mobileair: 300,         // Autres
  signalair: 200,          // Autres (signalements)
};

/**
 * Obtient la priorité de base d'une source
 */
function getSourcePriority(source: string): number {
  return SOURCE_PRIORITY[source] || 0;
}

/**
 * Calcule un score de priorité pour un device
 * 
 * Le score combine :
 * 1. La priorité de la source (poids majoritaire) - TOUJOURS respectée
 * 2. La valeur de mesure (poids minoritaire, seulement si le device a des données)
 * 
 * IMPORTANT : L'ordre des types est TOUJOURS respecté. Un microcapteur avec une valeur
 * très élevée ne pourra jamais dépasser une station, même si la station est grise.
 * 
 * @param device - Le device de mesure
 * @returns Un score numérique (plus élevé = plus prioritaire)
 */
export function calculateMarkerPriority(device: MeasurementDevice): number {
  // Priorité de base selon la source
  const sourcePriority = getSourcePriority(device.source);
  
  // Si le device n'a pas de données (gris), priorité réduite
  if (device.qualityLevel === "default" || device.qualityLevel === "noData" || !device.value) {
    // Réduire la priorité de 50% pour les devices sans données
    // Mais on garde toujours la priorité de base pour respecter l'ordre des types
    return sourcePriority * 0.5;
  }
  
  // Pour les devices avec données, ajouter un bonus basé sur la valeur
  // Le bonus est limité pour ne JAMAIS dépasser la priorité de base de la source suivante
  // Exemple : atmoMicro (800) peut avoir max 799.99 pour ne pas dépasser atmoRef (1000)
  
  // Valeur normalisée (supposons que les valeurs max sont autour de 100-200)
  // On utilise une fonction logarithmique pour éviter que les valeurs très élevées
  // ne dominent complètement
  const normalizedValue = device.value ? Math.min(device.value / 100, 1) : 0;
  
  // Calculer la priorité de la source suivante pour limiter le bonus
  const priorities = Object.values(SOURCE_PRIORITY).sort((a, b) => b - a);
  const currentIndex = priorities.indexOf(sourcePriority);
  const nextPriority = currentIndex > 0 ? priorities[currentIndex - 1] : sourcePriority + 200;
  
  // Bonus basé sur la valeur, limité pour ne pas dépasser la source suivante
  // Maximum = (priorité suivante - priorité actuelle - 1) pour garantir l'ordre
  const maxBonus = Math.max(0, nextPriority - sourcePriority - 1);
  const valueBonus = Math.log10(1 + normalizedValue * 9) * (maxBonus / 50) * 50;
  
  return sourcePriority + Math.min(valueBonus, maxBonus);
}

/**
 * Compare deux devices pour déterminer leur ordre d'affichage
 * Les devices avec la priorité la plus élevée doivent être rendus en dernier (au-dessus)
 * 
 * @param a - Premier device
 * @param b - Deuxième device
 * @returns Nombre négatif si a < b, positif si a > b, 0 si égal
 */
export function compareMarkerPriority(
  a: MeasurementDevice,
  b: MeasurementDevice
): number {
  const priorityA = calculateMarkerPriority(a);
  const priorityB = calculateMarkerPriority(b);
  
  // Si les priorités sont égales, utiliser la valeur comme critère secondaire
  if (Math.abs(priorityA - priorityB) < 0.1) {
    const valueA = a.value || 0;
    const valueB = b.value || 0;
    return valueA - valueB;
  }
  
  return priorityA - priorityB;
}

/**
 * Trie un tableau de devices par ordre de priorité
 * Les devices les plus prioritaires sont placés à la fin du tableau
 * (pour être rendus en dernier et apparaître au-dessus)
 * 
 * @param devices - Tableau de devices à trier
 * @returns Tableau trié (moins prioritaires en premier, plus prioritaires en dernier)
 */
export function sortDevicesByPriority(
  devices: MeasurementDevice[]
): MeasurementDevice[] {
  return [...devices].sort(compareMarkerPriority);
}

/**
 * Calcule le z-index offset pour un marqueur Leaflet basé sur sa priorité
 * Leaflet utilise zIndexOffset pour déterminer l'ordre d'affichage
 * Plus la valeur est élevée, plus le marqueur apparaît au-dessus
 * 
 * @param device - Le device de mesure
 * @returns Un z-index offset pour Leaflet (plage recommandée: -1000 à 1000)
 */
export function getMarkerZIndex(device: MeasurementDevice): number {
  const priority = calculateMarkerPriority(device);
  
  // Normaliser la priorité dans une plage de -1000 à 1000 pour Leaflet
  // Priorité min = 0, priorité max ≈ 1050 (1000 + 50)
  // On utilise une plage plus large pour que les différences soient visibles
  const normalizedPriority = Math.min(Math.max(priority, 0), 1050);
  const zIndexOffset = Math.round(-1000 + (normalizedPriority / 1050) * 2000);
  
  return zIndexOffset;
}

