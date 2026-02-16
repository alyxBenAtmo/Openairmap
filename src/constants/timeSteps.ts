export const pasDeTemps = {
  instantane: { name: "Scan", code: "instantane", activated: false }, // Valeurs instantanées
  deuxMin: { name: "≤ 2 min", code: "2min", activated: false }, // Moyenne sur 2 minutes
  quartHeure: { name: "15 min", code: "qh", activated: false }, // Moyenne sur 15 minutes
  heure: { name: "Heure", code: "h", activated: true }, // Moyenne horaire
  jour: { name: "Jour", code: "d", activated: false }, // Moyenne journalière
};

/** Pas de temps pour lesquels le mode historique est disponible (15 min, heure, jour uniquement) */
export const HISTORICAL_MODE_ALLOWED_TIME_STEPS = [
  "quartHeure",
  "heure",
  "jour",
] as const;

export const isHistoricalModeAllowedForTimeStep = (timeStep: string): boolean =>
  (HISTORICAL_MODE_ALLOWED_TIME_STEPS as readonly string[]).includes(timeStep);
