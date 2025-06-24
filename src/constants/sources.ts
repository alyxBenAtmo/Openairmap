import { Sources } from "../types";

export const sources: Sources = {
  atmoRef: {
    name: "Station de référence atmosud",
    code: "atmoRef",
    activated: true,
  }, // Stations de référence AtmoSud
  atmoMicro: {
    name: "Microcapteurs qualifiés",
    code: "atmoMicro",
    activated: true,
  }, // Micro-stations AtmoSud
  communautaire: {
    name: "Autres capteurs communautaires",
    code: "communautaire",
    activated: false,
    isGroup: true,
    subSources: {
      nebuleair: {
        name: "NebuleAir",
        code: "nebuleair",
        activated: true,
      },
      sensorCommunity: {
        name: "Sensor.Community",
        code: "sensorCommunity",
        activated: false,
      },
      purpleair: {
        name: "PurpleAir",
        code: "purpleair",
        activated: false,
      },
    },
  },
  signalair: {
    name: "SignalAir",
    code: "signalair",
    activated: false,
  }, // Capteurs SignalAir
};
