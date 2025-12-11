import { MeasurementDevice } from '../types';

/**
 * Génère des devices de test pour les tests de performance
 * @param count - Nombre de devices à générer
 * @param center - Centre géographique [latitude, longitude]
 * @param radius - Rayon en degrés (approximatif)
 * @param sources - Sources à utiliser pour la génération
 */
export function generateTestDevices(
  count: number = 1000,
  center: [number, number] = [43.6, 5.4], // Centre de la France (Marseille)
  radius: number = 2.0, // ~200km
  sources: string[] = ['atmoref', 'atmomicro', 'nebuleair', 'purpleair', 'sensorcommunity']
): MeasurementDevice[] {
  const devices: MeasurementDevice[] = [];
  const qualityLevels = ['bon', 'moyen', 'degrade', 'mauvais', 'tresMauvais', 'extrMauvais'];
  const pollutants = ['pm25', 'pm10', 'no2', 'o3', 'so2'];
  
  for (let i = 0; i < count; i++) {
    // Position aléatoire dans un cercle
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radius;
    const latitude = center[0] + distance * Math.cos(angle);
    const longitude = center[1] + distance * Math.sin(angle);
    
    // Source aléatoire
    const source = sources[i % sources.length];
    const pollutant = pollutants[i % pollutants.length];
    const qualityLevel = qualityLevels[i % qualityLevels.length];
    
    // Valeur aléatoire selon le niveau de qualité
    const value = getValueForQualityLevel(qualityLevel, pollutant);
    
    devices.push({
      id: `test-device-${i}`,
      name: `Capteur de test ${i + 1}`,
      latitude,
      longitude,
      source,
      pollutant,
      value,
      unit: 'µg/m³',
      timestamp: new Date().toISOString(),
      status: 'active',
      qualityLevel,
      address: `Adresse test ${i + 1}`,
      departmentId: '13', // Bouches-du-Rhône par exemple
    });
  }
  
  return devices;
}

/**
 * Génère une valeur aléatoire selon le niveau de qualité et le polluant
 */
function getValueForQualityLevel(level: string, pollutant: string): number {
  // Valeurs approximatives selon les seuils réels
  const ranges: Record<string, Record<string, [number, number]>> = {
    bon: { 
      pm25: [0, 6], 
      pm10: [0, 16], 
      no2: [0, 10], 
      o3: [0, 60], 
      so2: [0, 20] 
    },
    moyen: { 
      pm25: [6, 16], 
      pm10: [16, 46], 
      no2: [10, 25], 
      o3: [60, 100], 
      so2: [20, 40] 
    },
    degrade: { 
      pm25: [16, 51], 
      pm10: [46, 121], 
      no2: [25, 60], 
      o3: [100, 120], 
      so2: [40, 125] 
    },
    mauvais: { 
      pm25: [51, 91], 
      pm10: [121, 196], 
      no2: [60, 100], 
      o3: [120, 160], 
      so2: [125, 190] 
    },
    tresMauvais: { 
      pm25: [91, 141], 
      pm10: [196, 271], 
      no2: [100, 150], 
      o3: [160, 180], 
      so2: [190, 275] 
    },
    extrMauvais: { 
      pm25: [141, 300], 
      pm10: [271, 500], 
      no2: [150, 400], 
      o3: [180, 400], 
      so2: [275, 500] 
    },
  };
  
  const range = ranges[level]?.[pollutant] || [0, 100];
  return Math.round((Math.random() * (range[1] - range[0]) + range[0]) * 100) / 100;
}



