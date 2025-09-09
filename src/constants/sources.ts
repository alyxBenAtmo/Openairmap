import { Sources } from "../types";

export const sources: Sources = {
  atmoRef: {
    name: "Station de référence atmosud",
    code: "atmoRef",
    activated: true,
    supportedTimeSteps: ["instantane", "quartHeure", "heure", "jour"],
  }, // Stations de référence AtmoSud
  atmoMicro: {
    name: "Microcapteurs qualifiés",
    code: "atmoMicro",
    activated: true,
    supportedTimeSteps: ["instantane", "deuxMin", "quartHeure", "heure"],
  }, // Micro-stations AtmoSud
  communautaire: {
    name: "Autres capteurs communautaires",
    code: "communautaire",
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
      sensorCommunity: {
        name: "Sensor.Community",
        code: "sensorCommunity",
        activated: false,
        supportedTimeSteps: [
          "instantane",
          "deuxMin",
          "quartHeure",
          "heure",
          "jour",
        ],
      },
      purpleair: {
        name: "PurpleAir",
        code: "purpleair",
        activated: false,
        supportedTimeSteps: [
          "instantane",
          "deuxMin",
          "quartHeure",
          "heure",
          "jour",
        ],
      },
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
  }, // Capteurs SignalAir
};
