/**
 * Utilitaires pour la gestion des dates UTC/Locale
 * 
 * Règle principale :
 * - Les APIs consomment et retournent des dates en UTC
 * - L'utilisateur voit toujours les dates/heures en locale
 */

/**
 * Crée une date UTC à partir d'une chaîne de date locale (format YYYY-MM-DD)
 * Cette fonction garantit que la date est créée en UTC, pas en locale
 * 
 * @param dateString - Chaîne de date au format YYYY-MM-DD (sans heure)
 * @param isEndDate - Si true, définit l'heure à 23:59:59.999, sinon 00:00:00.000
 * @returns Date en UTC au format ISO string
 * 
 * @example
 * createUTCDateFromLocalDateString("2025-01-15", false) 
 * // => "2025-01-15T00:00:00.000Z"
 * 
 * createUTCDateFromLocalDateString("2025-01-15", true) 
 * // => "2025-01-15T23:59:59.999Z"
 */
export const createUTCDateFromLocalDateString = (
  dateString: string,
  isEndDate: boolean = false
): string => {
  // Parser la date locale (YYYY-MM-DD)
  const [year, month, day] = dateString.split('-').map(Number);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error(`Format de date invalide: ${dateString}. Format attendu: YYYY-MM-DD`);
  }

  // Créer la date en UTC explicitement
  const date = new Date(Date.UTC(
    year,
    month - 1, // Les mois sont 0-indexés en JavaScript
    day,
    isEndDate ? 23 : 0,
    isEndDate ? 59 : 0,
    isEndDate ? 59 : 0,
    isEndDate ? 999 : 0
  ));

  const result = date.toISOString();
  
  console.log(`🕐 [dateUtils] createUTCDateFromLocalDateString:`, {
    input: dateString,
    isEndDate,
    outputUTC: result,
    outputLocal: date.toLocaleString("fr-FR"),
    timezoneOffset: date.getTimezoneOffset(),
  });

  return result;
};

/**
 * Formate une date pour le mode historique (requêtes API)
 * Gère les dates avec ou sans composante horaire
 * 
 * @param dateString - Date au format ISO ou YYYY-MM-DD
 * @param isEndDate - Si true, définit l'heure à 23:59:59.999 UTC, sinon 00:00:00.000 UTC
 * @returns Date en UTC au format ISO string
 */
export const formatDateForHistoricalMode = (
  dateString: string,
  isEndDate: boolean = false
): string => {
  // Vérifier si la chaîne contient une composante horaire
  const hasTimeComponent = /T\d{2}:\d{2}/.test(dateString);

  if (hasTimeComponent) {
    // Si la date contient déjà une heure, la parser et convertir en UTC
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Date invalide: ${dateString}`);
    }
    
    // CORRECTION : Forcer l'heure de fin à 23:59:59.999 même si la date contient déjà une heure
    // et forcer l'heure de début à 00:00:00.000
    if (isEndDate) {
      date.setUTCHours(23, 59, 59, 999);
    } else {
      // Pour la date de début, s'assurer qu'elle est à 00:00:00
      date.setUTCHours(0, 0, 0, 0);
    }
    
    const result = date.toISOString();
    console.log(`🕐 [dateUtils] formatDateForHistoricalMode (avec heure):`, {
      input: dateString,
      isEndDate,
      outputUTC: result,
      outputLocal: date.toLocaleString("fr-FR"),
    });
    return result;
  }

  // Si pas d'heure, traiter comme une date locale (YYYY-MM-DD)
  // et créer une date UTC à partir de celle-ci
  return createUTCDateFromLocalDateString(dateString, isEndDate);
};

/**
 * Formate un timestamp pour l'affichage à l'utilisateur (en locale)
 * 
 * @param timestamp - Timestamp en format ISO string ou nombre (millisecondes)
 * @param isMobile - Si true, utilise un format plus court pour mobile
 * @returns Date formatée en locale française
 */
export const formatTimestampForDisplay = (
  timestamp: string | number,
  isMobile: boolean = false
): string => {
  let dateMs: number;
  
  if (typeof timestamp === "number") {
    dateMs = timestamp;
  } else {
    // Parser le timestamp (supposé être en UTC)
    dateMs = new Date(timestamp).getTime();
  }
  
  if (isNaN(dateMs)) {
    return "--";
  }
  
  const date = new Date(dateMs);
  
  // Format plus court sur mobile
  if (isMobile) {
    return `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}h`;
  }
  
  // Format complet en locale française
  return date.toLocaleString("fr-FR", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Normalise un timestamp en millisecondes UTC
 * Gère différents formats de timestamps (ISO avec/sans Z, avec/sans offset, etc.)
 * 
 * @param ts - Timestamp en format string ou number
 * @returns Nombre de millisecondes depuis epoch Unix (UTC)
 */
export const normalizeTimestamp = (ts: string | number): number => {
  if (typeof ts === "number") {
    return ts;
  }
  
  if (typeof ts === "string" && ts.includes("T")) {
    // Format ISO : peut contenir Z, +00:00, -05:00, etc.
    if (ts.match(/[+-]\d{2}:\d{2}$/)) {
      // Format avec offset de fuseau horaire
      return new Date(ts).getTime();
    } else if (ts.includes("Z")) {
      // Format ISO UTC avec Z
      return new Date(ts).getTime();
    } else {
      // Format ISO sans Z ni offset : traiter comme UTC
      return new Date(ts + "Z").getTime();
    }
  }
  
  return new Date(ts).getTime();
};

