import { Sources } from "../types";

export const sources: Sources = {
  atmoRef: {
    name: "Station de référence AtmoSud",
    code: "atmoRef",
    activated: true,
    supportedTimeSteps: ["instantane", "quartHeure", "heure", "jour"],
  }, // Stations de référence AtmoSud
  microcapteursQualifies: {
    name: "NebuleAir",
    code: "microcapteursQualifies",
    activated: true,
    isGroup: true,
    supportedTimeSteps: [
      "instantane",
      "deuxMin",
      "quartHeure",
      "heure",
      "jour",
    ],
    subSources: {
      atmoMicro: {
        name: "Microcapteurs qualifiés AtmoSud",
        code: "atmoMicro",
        activated: true,
        supportedTimeSteps: ["instantane", "deuxMin", "quartHeure", "heure"],
        hasVisualIndicator: true, // Indicateur visuel pour différencier d'NebuleAir
      },
      nebuleair: {
        name: "NebuleAir",
        code: "nebuleair",
        activated: true,
        supportedTimeSteps: [
          "instantane",
          "deuxMin",
          "quartHeure",
          "heure",
          "jour",
        ],
      },
    },
  },
  autreCapteurCommunautaire: {
    name: "Autre capteur communautaire",
    code: "autreCapteurCommunautaire",
    activated: true,
    isGroup: true,
    supportedTimeSteps: [
      "instantane",
      "deuxMin",
      "quartHeure",
      "heure",
      "jour",
    ],
    subSources: {
      purpleair: {
        name: "PurpleAir",
        code: "purpleair",
        activated: false,
        supportedTimeSteps: ["instantane", "deuxMin"],
      },
      sensorCommunity: {
        name: "Sensor.Community",
        code: "sensorCommunity",
        activated: false,
        supportedTimeSteps: ["instantane", "deuxMin"],
      },
    },
  },
  capteurEnMobilite: {
    name: "Capteur en mobilité",
    code: "capteurEnMobilite",
    activated: true,
    isGroup: true,
    supportedTimeSteps: [
      "instantane",
      "deuxMin",
      "quartHeure",
      "heure",
      "jour",
    ],
    subSources: {
      mobileair: {
        name: "MobileAir",
        code: "mobileair",
        activated: false,
        supportedTimeSteps: [
          "instantane",
          "deuxMin",
          "quartHeure",
          "heure",
          "jour",
        ],
      },
    },
  },
  signalementCommunautaire: {
    name: "Signalement communautaire",
    code: "signalementCommunautaire",
    activated: true,
    isGroup: true,
    supportedTimeSteps: [
      "instantane",
      "deuxMin",
      "quartHeure",
      "heure",
      "jour",
    ],
    subSources: {
      signalair: {
        name: "SignalAir",
        code: "signalair",
        activated: false,
        supportedTimeSteps: [
          "instantane",
          "deuxMin",
          "quartHeure",
          "heure",
          "jour",
        ],
      },
    },
  },
};

// Fonction pour obtenir les sources activées par défaut
export const getDefaultSources = (): string[] => {
  const defaultSources: string[] = [];
  
  Object.entries(sources).forEach(([key, source]) => {
    if (source.activated && !source.isGroup) {
      // Source simple activée
      defaultSources.push(key);
    } else if (source.activated && source.isGroup && source.subSources) {
      // Groupe activé, ajouter les sous-sources activées
      Object.entries(source.subSources).forEach(([subKey, subSource]) => {
        if (subSource.activated) {
          defaultSources.push(`${key}.${subKey}`);
        }
      });
    }
  });
  
  return defaultSources;
};
