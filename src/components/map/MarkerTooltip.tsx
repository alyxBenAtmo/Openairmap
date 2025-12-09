import React from 'react';
import { MeasurementDevice } from '../../types';
import { pollutants } from '../../constants/pollutants';
import { formatTooltipDate } from '../../utils/dateUtils';

interface MarkerTooltipProps {
  device: MeasurementDevice;
  position: { x: number; y: number };
  sensorMetadata?: {
    sensorModel?: string;
    sensorBrand?: string;
    measuredPollutants?: string[];
  };
}

/**
 * Normalise un label de polluant pour utiliser la notation avec indices
 * Cherche dans l'objet pollutants le code correspondant et retourne le nom avec indices
 * Gère les formats comme "Particules PM₁", "PM2.5", "NO₂", etc.
 */
const normalizePollutantLabel = (label: string): string => {
  const normalizedLabel = label.trim();
  
  // Chercher dans l'objet pollutants par nom exact (déjà au bon format)
  for (const [code, pollutant] of Object.entries(pollutants)) {
    if (pollutant.name === normalizedLabel) {
      return pollutant.name;
    }
  }

  // Chercher par correspondance partielle (pour les labels comme "Particules PM₁")
  const lowerLabel = normalizedLabel.toLowerCase();
  
  // Mapping des patterns courants vers les codes de polluants
  // Ordre important : chercher d'abord les patterns les plus spécifiques
  const patternMapping: Array<{ pattern: string | RegExp; code: string }> = [
    { pattern: /pm\s*2\s*\.\s*5|pm₂\.₅|pm25/gi, code: 'pm25' },
    { pattern: /pm\s*10|pm₁₀/gi, code: 'pm10' },
    { pattern: /pm\s*1(?:\s|$)/gi, code: 'pm1' },
    { pattern: /no\s*2|no₂/gi, code: 'no2' },
    { pattern: /o\s*3|o₃/gi, code: 'o3' },
    { pattern: /so\s*2|so₂/gi, code: 'so2' },
    { pattern: /bruit|noise/gi, code: 'bruit' },
  ];

  // Chercher un pattern correspondant
  for (const { pattern, code } of patternMapping) {
    if (typeof pattern === 'string') {
      if (lowerLabel.includes(pattern.toLowerCase())) {
        return pollutants[code]?.name || normalizedLabel;
      }
    } else {
      // C'est une regex
      if (pattern.test(normalizedLabel) || pattern.test(lowerLabel)) {
        return pollutants[code]?.name || normalizedLabel;
      }
    }
  }

  // Si aucun pattern trouvé, chercher dans les noms de polluants
  for (const [code, pollutant] of Object.entries(pollutants)) {
    const pollutantNameLower = pollutant.name.toLowerCase();
    // Chercher si le nom du polluant est contenu dans le label ou vice versa
    if (
      lowerLabel.includes(pollutantNameLower) ||
      pollutantNameLower.includes(lowerLabel.replace(/particules\s*/gi, '').trim())
    ) {
      return pollutant.name;
    }
  }

  // Retourner le label original si aucune correspondance trouvée
  return normalizedLabel;
};

/**
 * Vérifie si un polluant normalisé est disponible sur OpenAirMap
 * (présent dans l'objet pollutants)
 */
const isPollutantAvailableOnOpenAirMap = (normalizedLabel: string): boolean => {
  // Vérifier si le label correspond exactement à un nom de polluant dans l'objet
  for (const [code, pollutant] of Object.entries(pollutants)) {
    if (pollutant.name === normalizedLabel) {
      return true;
    }
  }
  return false;
};

const MarkerTooltip: React.FC<MarkerTooltipProps> = ({
  device,
  position,
  sensorMetadata,
}) => {
  // Formater la dernière mise à jour
  const formattedDate = formatTooltipDate(device.timestamp);

  // Déterminer les polluants mesurés et les séparer en deux catégories
  const getMeasuredPollutants = (): {
    availableOnOpenAirMap: string[];
    others: string[];
  } => {
    let normalizedPollutants: string[] = [];

    if (sensorMetadata?.measuredPollutants) {
      // Normaliser tous les labels pour utiliser la notation avec indices
      normalizedPollutants = sensorMetadata.measuredPollutants.map(normalizePollutantLabel);
      
      // Pour NebuleAir : toujours s'assurer que PM₁, PM₂.₅ et PM₁₀ sont présents
      if (device.source === 'nebuleair') {
        const requiredPollutants = ['PM₁', 'PM₂.₅', 'PM₁₀'];
        requiredPollutants.forEach((required) => {
          if (!normalizedPollutants.includes(required)) {
            normalizedPollutants.push(required);
          }
        });
      }
      
      // Dédupliquer les polluants après normalisation
      normalizedPollutants = Array.from(new Set(normalizedPollutants));
    } else {
      // Pour les sources avec données dans le device
      // PurpleAir : PM1, PM2.5, PM10
      if (device.source === 'purpleair') {
        const purpleDevice = device as MeasurementDevice & {
          pm1Value?: number;
          pm25Value?: number;
          pm10Value?: number;
        };
        if (purpleDevice.pm1Value !== undefined) normalizedPollutants.push('PM₁');
        if (purpleDevice.pm25Value !== undefined) normalizedPollutants.push('PM₂.₅');
        if (purpleDevice.pm10Value !== undefined) normalizedPollutants.push('PM₁₀');
      }
      // NebuleAir : mesure toujours PM₁, PM₂.₅ et PM₁₀ au minimum
      else if (device.source === 'nebuleair') {
        // Toujours inclure les 3 polluants de base
        normalizedPollutants.push('PM₁');
        normalizedPollutants.push('PM₂.₅');
        normalizedPollutants.push('PM₁₀');
      }
      // Pour les autres sources, on affiche au minimum le polluant actuellement sélectionné
      else {
        const currentPollutant = pollutants[device.pollutant]?.name || device.pollutant;
        normalizedPollutants.push(currentPollutant);
      }
    }

    // Séparer en deux catégories
    const availableOnOpenAirMap: string[] = [];
    const others: string[] = [];

    normalizedPollutants.forEach((pollutant) => {
      if (isPollutantAvailableOnOpenAirMap(pollutant)) {
        availableOnOpenAirMap.push(pollutant);
      } else {
        others.push(pollutant);
      }
    });

    return { availableOnOpenAirMap, others };
  };

  const { availableOnOpenAirMap, others } = getMeasuredPollutants();

  // Obtenir le modèle du capteur
  const getSensorModel = (): string | null => {
    if (sensorMetadata?.sensorModel) {
      return sensorMetadata.sensorModel;
    }

    // Sensor Community : extraire depuis le nom
    if (device.source === 'sensorCommunity') {
      const sensorCommunityDevice = device as MeasurementDevice & {
        manufacturer?: string;
        sensorType?: string;
      };
      if (sensorCommunityDevice.manufacturer && sensorCommunityDevice.sensorType) {
        return `${sensorCommunityDevice.manufacturer} ${sensorCommunityDevice.sensorType}`;
      }
    }

    // PurpleAir : modèle standard
    if (device.source === 'purpleair') {
      return 'PurpleAir';
    }

    return null;
  };

  const sensorModel = getSensorModel();

  return (
    <div
      className="fixed z-[2999] bg-gray-800/70 backdrop-blur-sm text-white text-xs rounded-md shadow-xl p-2 pointer-events-none max-w-xs border border-gray-600/50"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 10}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      {/* Nom du capteur */}
      <div className="font-semibold mb-1.5 text-sm border-b border-gray-600/50 pb-1">
        {device.name}
      </div>

      {/* Modèle du capteur */}
      {sensorModel && (
        <div className="mb-1.5 text-gray-200 text-xs">
          <span className="font-medium">Modèle :</span> {sensorModel}
        </div>
      )}

      {/* Dernière mise à jour */}
      <div className="mb-1.5 text-gray-200 text-xs">
        <span className="font-medium">Dernière mise à jour :</span>{' '}
        <span className="text-gray-300">{formattedDate}</span>
      </div>

      {/* Polluants mesurés */}
      {(availableOnOpenAirMap.length > 0 || others.length > 0) && (
        <div className="mt-1.5 pt-1.5 border-t border-gray-600/50">
          {/* Polluants disponibles sur OpenAirMap */}
          {availableOnOpenAirMap.length > 0 && (
            <div className="mb-1.5">
              <div className="font-medium mb-1 text-xs text-gray-200">
                Polluants OpenAirMap :
              </div>
              <div className="flex flex-wrap gap-1">
                {availableOnOpenAirMap.map((pollutant, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded bg-blue-600/60 px-1.5 py-0.5 text-xs"
                  >
                    {pollutant}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Autres polluants */}
          {others.length > 0 && (
            <div>
              <div className="font-medium mb-1 text-xs text-gray-200">
                Autres polluants :
              </div>
              <div className="flex flex-wrap gap-1">
                {others.map((pollutant, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded bg-gray-700/70 px-1.5 py-0.5 text-xs"
                  >
                    {pollutant}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MarkerTooltip;

