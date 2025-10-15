// Mapping des modèles de capteurs AtmoMicro vers leurs images
export const SENSOR_MODEL_IMAGES: Record<string, string> = {
  PMo: "/capteurs/nexelec-pmo.jpg",
  NebuleAir: "/capteurs/NebuleAir_photo.png",
  "Kunak PRO": "/capteurs/kunak-air-pro.jpg",
};

// Fonction utilitaire pour obtenir l'image d'un modèle de capteur
export const getSensorModelImage = (
  model: string | undefined
): string | null => {
  if (!model) return null;

  // Recherche exacte d'abord
  if (SENSOR_MODEL_IMAGES[model]) {
    return SENSOR_MODEL_IMAGES[model];
  }

  // Recherche flexible (case-insensitive et partielle)
  const modelLower = model.toLowerCase();

  for (const [key, value] of Object.entries(SENSOR_MODEL_IMAGES)) {
    if (
      key.toLowerCase().includes(modelLower) ||
      modelLower.includes(key.toLowerCase())
    ) {
      return value;
    }
  }

  return null;
};

