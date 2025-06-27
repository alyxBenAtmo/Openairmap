# Marqueurs avec Valeurs Affichées - Documentation

## 🎯 Vue d'ensemble

Le système de marqueurs avec valeurs affichées permet d'afficher directement la valeur de mesure (arrondie) sur chaque marqueur PNG de la carte. Cette fonctionnalité améliore l'expérience utilisateur en permettant de voir immédiatement les valeurs sans avoir à cliquer sur les marqueurs.

**Nouveauté :** Support des valeurs corrigées pour AtmoMicro avec indicateur visuel et formatage spécial.

## 🏗️ Architecture Technique

### Approche Choisie

Nous utilisons des **marqueurs HTML personnalisés** (L.divIcon) plutôt que des marqueurs Canvas dynamiques pour les raisons suivantes :

- **Performance** : Plus rapide que la génération de Canvas
- **Simplicité** : Code plus maintenable
- **Flexibilité** : Facile à personnaliser avec CSS
- **Compatibilité** : Fonctionne sur tous les navigateurs

### Structure des Marqueurs

```html
<div class="custom-marker-container">
  <img src="/markers/source_qualityLevel.png" alt="marker" />
  <div class="value-text">42</div>
  <!-- Indicateur de valeur corrigée (AtmoMicro uniquement) -->
  <div class="correction-indicator"></div>
</div>
```

## 🔗 Clustering des Marqueurs

### Vue d'ensemble du clustering

Le système de clustering permet de regrouper automatiquement les marqueurs géographiquement proches, améliorant ainsi les performances et la lisibilité de la carte.

### Intégration avec les marqueurs personnalisés

Les marqueurs avec valeurs affichées sont entièrement compatibles avec le système de clustering :

```typescript
{
  clusterConfig.enabled ? (
    <MarkerClusterGroup
      maxClusterRadius={clusterConfig.maxClusterRadius}
      spiderfyOnMaxZoom={clusterConfig.spiderfyOnMaxZoom}
      showCoverageOnHover={clusterConfig.showCoverageOnHover}
      zoomToBoundsOnClick={clusterConfig.zoomToBoundsOnClick}
      animate={clusterConfig.animate}
      animateAddingMarkers={clusterConfig.animateAddingMarkers}
    >
      {devices.map((device) => (
        <Marker
          key={device.id}
          position={[device.latitude, device.longitude]}
          icon={createCustomIcon(device)}
          eventHandlers={{
            click: () => handleMarkerClick(device),
          }}
        />
      ))}
    </MarkerClusterGroup>
  ) : (
    // Rendu normal sans clustering
    devices.map((device) => (
      <Marker
        key={device.id}
        position={[device.latitude, device.longitude]}
        icon={createCustomIcon(device)}
        eventHandlers={{
          click: () => handleMarkerClick(device),
        }}
      />
    ))
  );
}
```

### Avantages du clustering avec marqueurs personnalisés

1. **Performance optimisée** : Moins de marqueurs HTML à rendre simultanément
2. **Lisibilité améliorée** : Regroupement logique des points proches
3. **Navigation facilitée** : Zoom automatique sur les zones d'intérêt
4. **Préservation des fonctionnalités** : Les valeurs affichées restent visibles dans les clusters

### Configuration du clustering

Le clustering est configurable via l'interface utilisateur avec les options suivantes :

- **Activation/Désactivation** : Basculement du clustering
- **Rayon de clustering** : Distance de regroupement (20px à 200px)
- **Spiderfy au zoom maximum** : Éclatement des clusters au zoom max
- **Affichage de la zone** : Visualisation de la zone de cluster au survol
- **Zoom sur la zone** : Zoom automatique sur la zone du cluster au clic
- **Animations** : Transitions fluides pour le clustering

### Comportement des marqueurs dans les clusters

- **Marqueurs individuels** : Affichage normal avec valeurs visibles
- **Clusters** : Compteur du nombre de marqueurs dans le cluster
- **Éclatement** : Les marqueurs reprennent leur apparence normale lors de l'éclatement

## 🎨 Styles CSS

### Classes Principales

```css
.custom-marker-div {
  background: transparent !important;
  border: none !important;
}

.custom-marker-container {
  position: relative;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.custom-marker-container img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  pointer-events: none;
}

.value-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: bold;
  font-family: Arial, sans-serif;
  text-align: center;
  line-height: 1;
  pointer-events: none;
  user-select: none;
  z-index: 10;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.9);
}

/* Indicateur de valeur corrigée (AtmoMicro) */
.correction-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 6px;
  height: 6px;
  background-color: #10b981;
  border-radius: 50%;
  border: 1px solid white;
  z-index: 10;
}
```

## 📊 Logique d'Affichage

### Conditions d'Affichage

La valeur n'est affichée que si :

1. L'appareil a le statut `"active"`
2. La valeur de mesure est supérieure à 0
3. Le niveau de qualité n'est pas `"default"`

### Format de la Valeur

- **Arrondi** : La valeur est arrondie à l'entier le plus proche
- **Pas d'unité** : Seule la valeur numérique est affichée
- **Taille adaptative** : Police qui s'ajuste selon la longueur de la valeur
  - 1 chiffre : 18px
  - 2 chiffres : 16px
  - 3+ chiffres : 12px

### Gestion des Valeurs Corrigées (AtmoMicro)

Pour les sources AtmoMicro, le système gère les valeurs corrigées :

```typescript
// Logique de sélection de la valeur à afficher
const hasCorrection = measure.valeur !== null;
const displayValue = hasCorrection ? measure.valeur! : measure.valeur_brute;
const correctedValue = hasCorrection ? measure.valeur : undefined;
const rawValue = measure.valeur_brute;
```

**Comportement :**

- Si `valeur` (corrigée) existe → utilise la valeur corrigée + point vert
- Si `valeur` est null → utilise `valeur_brute` sans indicateur
- Format d'affichage : `42 (corrigé, brut: 45)` quand applicable

## 🔄 Gestion des Formats de Données Différents

### État Actuel

L'application gère **partiellement** les formats de données différents :

#### ✅ **Ce qui fonctionne bien :**

1. **Architecture modulaire** : Chaque source a son propre service
2. **Interface unifiée** : Tous les services retournent `MeasurementDevice[]`
3. **Transformation locale** : Chaque service transforme ses données spécifiques
4. **Gestion des erreurs** : Support de différents content-types
5. **Valeurs corrigées** : Support complet pour AtmoMicro

#### ⚠️ **Améliorations recommandées :**

### 1. **Normalisation Centralisée des Unités**

```typescript
// utils/dataNormalization.ts
export class DataNormalizer {
  private static unitMapping: Record<string, string> = {
    "µg-m3": "µg/m³",
    "µg-m³": "µg/m³",
    "µg/m3": "µg/m³",
    "µg/m³": "µg/m³",
    "mg/m³": "mg/m³",
    ppm: "ppm",
    ppb: "ppb",
    "°C": "°C",
    "%": "%",
  };

  static normalizeUnit(unit: string): string {
    return this.unitMapping[unit] || unit;
  }

  static normalizeValue(
    value: number,
    fromUnit: string,
    toUnit: string
  ): number {
    // Conversion entre unités si nécessaire
    if (fromUnit === "ppb" && toUnit === "ppm") {
      return value / 1000;
    }
    if (fromUnit === "mg/m³" && toUnit === "µg/m³") {
      return value * 1000;
    }
    return value;
  }
}
```

### 2. **Validation et Filtrage des Données**

```typescript
// utils/dataValidation.ts
export class DataValidator {
  static validateMeasurement(value: number, unit: string): boolean {
    // Vérifier que la valeur est dans des limites raisonnables
    const limits = {
      "µg/m³": { min: 0, max: 1000 },
      ppm: { min: 0, max: 100 },
      ppb: { min: 0, max: 100000 },
    };

    const limit = limits[unit] || { min: 0, max: Infinity };
    return value >= limit.min && value <= limit.max;
  }

  static filterOutliers(devices: MeasurementDevice[]): MeasurementDevice[] {
    return devices.filter((device) =>
      this.validateMeasurement(device.value, device.unit)
    );
  }
}
```

### 3. **Mapping Centralisé des Polluants**

```typescript
// constants/pollutantMapping.ts
export const POLLUTANT_MAPPING: Record<string, Record<string, string>> = {
  atmoRef: {
    pm25: "pm2.5",
    pm10: "pm10",
    o3: "o3",
    no2: "no2",
    so2: "so2",
  },
  atmoMicro: {
    pm25: "pm2.5",
    pm10: "pm10",
    o3: "o3",
    no2: "no2",
    so2: "so2",
  },
  purpleAir: {
    pm25: "pm2.5_atm",
    pm10: "pm10_atm",
  },
  sensorCommunity: {
    pm25: "P2",
    pm10: "P1",
  },
};
```

### 4. **Gestion des Timestamps**

```typescript
// utils/timestampNormalization.ts
export class TimestampNormalizer {
  static normalizeTimestamp(timestamp: string | number): string {
    if (typeof timestamp === "number") {
      // Timestamp Unix en millisecondes
      return new Date(timestamp).toISOString();
    }

    // Essayer différents formats
    const formats = [
      "YYYY-MM-DDTHH:mm:ss.SSSZ",
      "YYYY-MM-DDTHH:mm:ssZ",
      "YYYY-MM-DD HH:mm:ss",
      "DD/MM/YYYY HH:mm:ss",
    ];

    for (const format of formats) {
      try {
        const parsed = moment(timestamp, format);
        if (parsed.isValid()) {
          return parsed.toISOString();
        }
      } catch {
        continue;
      }
    }

    // Fallback
    return new Date(timestamp).toISOString();
  }
}
```

### 5. **Amélioration de BaseDataService**

```typescript
// services/BaseDataService.ts
export abstract class BaseDataService implements DataService {
  // ... code existant ...

  protected normalizeDevice(device: any): MeasurementDevice {
    return {
      id: device.id || device.station_id || device.sensor_id,
      name: device.name || device.nom_station || device.sensor_name,
      latitude: Number(device.latitude || device.lat),
      longitude: Number(device.longitude || device.lon || device.lng),
      source: this.sourceCode,
      pollutant: device.pollutant,
      value: Number(device.value || device.valeur || device.measurement),
      unit: DataNormalizer.normalizeUnit(device.unit || device.unite),
      timestamp: TimestampNormalizer.normalizeTimestamp(
        device.timestamp || device.date
      ),
      status: this.determineStatus(device),
      qualityLevel: this.calculateQualityLevel(device),
      address: device.address || device.adresse,
      departmentId: device.departmentId || device.departement_id,
      // Nouvelles propriétés pour les valeurs corrigées
      corrected_value: device.corrected_value,
      raw_value: device.raw_value,
      has_correction: device.has_correction,
    };
  }

  protected determineStatus(device: any): "active" | "inactive" | "error" {
    // Logique spécifique à chaque source
    const lastUpdate = new Date(device.timestamp || device.date);
    const now = new Date();
    const diffHours = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

    if (diffHours > 24) return "inactive";
    if (device.error || device.status === "error") return "error";
    return "active";
  }

  protected calculateQualityLevel(device: any): string {
    const pollutant = pollutants[device.pollutant];
    if (!pollutant) return "default";

    return getAirQualityLevel(device.value, pollutant.thresholds);
  }
}
```

## 🔄 Adaptation aux Autres Sources de Données

### Structure Unifiée

Toutes les sources de données utilisent la même interface `MeasurementDevice` :

```typescript
interface MeasurementDevice {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  source: string;
  pollutant: string;
  value: number; // ← Valeur utilisée pour l'affichage
  unit: string;
  timestamp: string;
  status: "active" | "inactive" | "error";
  qualityLevel?: string; // bon, moyen, degrade, mauvais, tresMauvais, extrMauvais, default
  address?: string;
  departmentId?: string;
  // ✅ NOUVELLES propriétés pour les valeurs corrigées (AtmoMicro uniquement)
  corrected_value?: number; // Valeur corrigée si disponible
  raw_value?: number; // Valeur brute originale
  has_correction?: boolean; // Indique si une correction a été appliquée
}
```

### Sources Actuellement Supportées

#### AtmoRef (AtmoSud)

- **Champ de valeur** : `measure.valeur`
- **Statut** : Basé sur la présence de mesures récentes
- **Qualité** : Utilisé les seuils par polluant via `getAirQualityLevel()`
- **Valeurs corrigées** : Non applicable (données déjà validées)

#### AtmoMicro (Micro-capteurs AtmoSud)

- **Champ de valeur** : `measure.valeur` (corrigée) ou `measure.valeur_brute` (brute)
- **Statut** : Basé sur la fraîcheur des données
- **Qualité** : Utilisé les seuils par polluant via `getAirQualityLevel()`
- **Valeurs corrigées** : ✅ Support complet avec indicateur visuel
  - `valeur` : Valeur corrigée (peut être null)
  - `valeur_brute` : Valeur brute originale
  - `has_correction` : Indique si une correction a été appliquée
  - **Indicateur visuel** : Point vert sur les marqueurs avec valeurs corrigées
  - **Format d'affichage** : `42 µg/m³ (corrigé, brut: 45)` quand applicable

#### SignalAir (Signalements Qualitatifs)

- **Champ de valeur** : Pas de valeur numérique (signalements qualitatifs)
- **Statut** : Toujours `"active"` pour les signalements récents
- **Qualité** : Pas de qualité, utilise `signalType` pour le marqueur
- **Marqueur spécial** : Pas de texte affiché, seulement l'icône du type de signalement
- **Valeurs corrigées** : Non applicable

#### Sources à Intégrer

##### NebuleAir (Capteurs communautaires)

- **Champ de valeur** : `sensor.value` ou `measurement.value`
- **Statut** : Basé sur la connectivité du capteur
- **Qualité** : Utilisé les seuils par polluant via `getAirQualityLevel()`
- **Valeurs corrigées** : À implémenter selon l'API

##### PurpleAir

- **Champ de valeur** : `sensor.pm2.5_atm` ou `sensor.pm10_atm`
- **Statut** : Basé sur la dernière transmission
- **Qualité** : Utilisé les seuils par polluant via `getAirQualityLevel()`
- **Valeurs corrigées** : À implémenter selon l'API

##### Sensor.Community

- **Champ de valeur** : `sensor.P1` (PM10) ou `sensor.P2` (PM2.5)
- **Statut** : Basé sur la dernière mise à jour
- **Qualité** : Utilisé les seuils par polluant via `getAirQualityLevel()`
- **Valeurs corrigées** : À implémenter selon l'API

## 🛠️ Implémentation Technique

### Fonction de Création des Marqueurs

```typescript
const createCustomIcon = (device: MeasurementDevice) => {
  const qualityLevel = device.qualityLevel || "default";
  const markerPath = getMarkerPath(device.source, qualityLevel);

  // Créer un élément HTML personnalisé pour le marqueur
  const div = document.createElement("div");
  div.className = "custom-marker-container";

  // Image de base du marqueur
  const img = document.createElement("img");
  img.src = markerPath;
  img.alt = `${device.source} marker`;

  // Ajouter une animation subtile pendant le chargement
  if (loading) {
    div.style.opacity = "0.7";
    div.style.transform = "scale(0.95)";
    div.style.transition = "all 0.3s ease";
  }

  // Texte de la valeur pour les appareils de mesure
  const valueText = document.createElement("div");
  valueText.className = "value-text";

  // Gestion normale pour les appareils de mesure
  if (device.status === "active" && device.value > 0) {
    const displayValue = Math.round(device.value);
    valueText.textContent = displayValue.toString();

    // Ajuster la taille du texte selon la longueur de la valeur
    if (displayValue >= 100) {
      valueText.style.fontSize = "12px"; // Police plus petite pour les valeurs à 3 chiffres
    } else if (displayValue >= 10) {
      valueText.style.fontSize = "16px"; // Police moyenne pour les valeurs à 2 chiffres
    } else {
      valueText.style.fontSize = "18px"; // Police normale pour les valeurs à 1 chiffre
    }

    // Couleur du texte selon le niveau de qualité
    const textColors: Record<string, string> = {
      bon: "#000000",
      moyen: "#000000",
      degrade: "#000000",
      mauvais: "#000000", // Noir au lieu de blanc pour les marqueurs rouges
      tresMauvais: "#000000", // Noir au lieu de blanc pour les marqueurs rouges
      extrMauvais: "#000000", // Noir au lieu de blanc pour les marqueurs rouges
      default: "#666666",
    };

    valueText.style.color = textColors[qualityLevel] || "#000000";

    // Ajouter un contour blanc pour améliorer la lisibilité
    if (qualityLevel !== "default") {
      // Contour plus subtil pour éviter l'effet de "paté"
      valueText.style.textShadow =
        "1px 1px 2px rgba(255,255,255,0.8), -1px -1px 2px rgba(255,255,255,0.8)";
    }

    // ✅ Indicateur de valeur corrigée pour AtmoMicro
    if (device.source === "atmoMicro" && device.has_correction) {
      // Ajouter un petit indicateur visuel (point vert)
      const correctionIndicator = document.createElement("div");
      correctionIndicator.style.cssText = `
        position: absolute;
        top: -2px;
        right: -2px;
        width: 6px;
        height: 6px;
        background-color: #10b981;
        border-radius: 50%;
        border: 1px solid white;
        z-index: 10;
      `;
      div.appendChild(correctionIndicator);
    }
  }

  div.appendChild(img);
  div.appendChild(valueText);

  return L.divIcon({
    html: div.outerHTML,
    className: "custom-marker-div",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};
```

### Fonction de Création des Marqueurs SignalAir

```typescript
const createSignalIcon = (report: SignalAirReport) => {
  const qualityLevel = report.qualityLevel || "default";
  const markerPath = getMarkerPath(report.source, qualityLevel);

  // Créer un élément HTML personnalisé pour le marqueur de signalement
  const div = document.createElement("div");
  div.className = "custom-marker-container";

  // Image de base du marqueur
  const img = document.createElement("img");
  img.src = markerPath;
  img.alt = `${report.source} signal marker`;

  // Ajouter une animation subtile pendant le chargement
  if (loading) {
    div.style.opacity = "0.7";
    div.style.transform = "scale(0.95)";
    div.style.transition = "all 0.3s ease";
  }

  // Pour SignalAir, on n'ajoute pas de texte par-dessus le marqueur
  div.appendChild(img);

  return L.divIcon({
    html: div.outerHTML,
    className: "custom-marker-div",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};
```

### Fonction de Formatage des Valeurs

```typescript
const formatValue = (device: MeasurementDevice) => {
  if (device.status === "inactive") {
    return "Pas de données récentes";
  }

  // ✅ Pour AtmoMicro avec valeurs corrigées
  if (device.source === "atmoMicro" && device.has_correction) {
    const correctedValue = device.corrected_value;
    const rawValue = device.raw_value;
    return `${correctedValue} ${device.unit} (corrigé, brut: ${rawValue})`;
  }

  // Pour les autres sources ou AtmoMicro sans correction
  return `${device.value} ${device.unit}`;
};
```

### Fonction Utilitaires

#### getMarkerPath()

```typescript
export function getMarkerPath(source: string, level: string): string {
  // Gestion spéciale pour SignalAir
  if (source === "signalair") {
    const signalTypeMapping: Record<string, string> = {
      odeur: "odeur",
      bruit: "bruits", // Le fichier s'appelle "bruits.png"
      brulage: "brulage",
      visuel: "visuel",
      pollen: "pollen",
    };

    const signalType = signalTypeMapping[level] || "odeur";
    return `/markers/signalAirMarkers/${signalType}.png`;
  }

  // Gestion pour les autres sources
  const sourceMapping: Record<string, string> = {
    atmoRef: "atmoRefMarkers/refStationAtmoSud",
    atmoMicro: "atmoMicroMarkers/microStationAtmoSud",
    nebuleAir: "nebuleAirMarkers/nebuleAir",
    purpleAir: "purpleAirMarkers/purpleAir",
    sensorCommunity: "sensorCommunityMarkers/SensorCommunity",
  };

  const basePath = sourceMapping[source] || "atmoRefMarkers/refStationAtmoSud";
  return `/markers/${basePath}_${level}.png`;
}
```

#### getAirQualityLevel()

```typescript
export function getAirQualityLevel(value: number, thresholds: Seuils): string {
  if (value <= thresholds.bon.max) return "bon";
  if (value <= thresholds.moyen.max) return "moyen";
  if (value <= thresholds.degrade.max) return "degrade";
  if (value <= thresholds.mauvais.max) return "mauvais";
  if (value <= thresholds.tresMauvais.max) return "tresMauvais";
  return "extrMauvais";
}
```

## 🔧 Configuration et Personnalisation

### Modifier la Taille du Texte

Pour adapter la taille selon la valeur :

```typescript
// Ajustement automatique selon la longueur de la valeur
if (displayValue >= 100) {
  valueText.style.fontSize = "12px"; // Police plus petite pour les grandes valeurs
} else if (displayValue >= 10) {
  valueText.style.fontSize = "16px"; // Police moyenne pour les valeurs à 2 chiffres
} else {
  valueText.style.fontSize = "18px"; // Police normale pour les valeurs à 1 chiffre
}
```

### Couleurs du Texte

```typescript
// Couleur du texte selon le niveau de qualité
const textColors: Record<string, string> = {
  bon: "#000000",
  moyen: "#000000",
  degrade: "#000000",
  mauvais: "#000000", // Noir au lieu de blanc pour les marqueurs rouges
  tresMauvais: "#000000", // Noir au lieu de blanc pour les marqueurs rouges
  extrMauvais: "#000000", // Noir au lieu de blanc pour les marqueurs rouges
  default: "#666666",
};
```

### Contour du Texte

```typescript
// Ajouter un contour blanc pour améliorer la lisibilité
if (qualityLevel !== "default") {
  // Contour plus subtil pour éviter l'effet de "paté"
  valueText.style.textShadow =
    "1px 1px 2px rgba(255,255,255,0.8), -1px -1px 2px rgba(255,255,255,0.8)";
}
```

### Indicateur de Valeur Corrigée

```typescript
// Indicateur de valeur corrigée pour AtmoMicro
if (device.source === "atmoMicro" && device.has_correction) {
  const correctionIndicator = document.createElement("div");
  correctionIndicator.style.cssText = `
    position: absolute;
    top: -2px;
    right: -2px;
    width: 6px;
    height: 6px;
    background-color: #10b981;
    border-radius: 50%;
    border: 1px solid white;
    z-index: 10;
  `;
  div.appendChild(correctionIndicator);
}
```

## 📁 Structure des Fichiers de Marqueurs

```
public/markers/
├── atmoRefMarkers/
│   ├── refStationAtmoSud_bon.png
│   ├── refStationAtmoSud_moyen.png
│   ├── refStationAtmoSud_degrade.png
│   ├── refStationAtmoSud_mauvais.png
│   ├── refStationAtmoSud_tresMauvais.png
│   ├── refStationAtmoSud_extrMauvais.png
│   └── refStationAtmoSud_default.png
├── atmoMicroMarkers/
│   ├── microStationAtmoSud_bon.png
│   ├── microStationAtmoSud_moyen.png
│   ├── microStationAtmoSud_degrade.png
│   ├── microStationAtmoSud_mauvais.png
│   ├── microStationAtmoSud_tresMauvais.png
│   ├── microStationAtmoSud_extrMauvais.png
│   └── microStationAtmoSud_default.png
├── nebuleAirMarkers/
│   ├── nebuleAir_bon.png
│   ├── nebuleAir_moyen.png
│   └── ...
├── purpleAirMarkers/
│   ├── purpleAir_bon.png
│   ├── purpleAir_moyen.png
│   └── ...
├── sensorCommunityMarkers/
│   ├── SensorCommunity_bon.png
│   ├── SensorCommunity_moyen.png
│   └── ...
└── signalAirMarkers/
    ├── odeur.png
    ├── bruits.png
    ├── brulage.png
    ├── visuel.png
    └── pollen.png
```

## 🚀 Évolutions Futures

### Fonctionnalités Possibles

1. **Affichage conditionnel** : Option pour masquer/afficher les valeurs
2. **Format personnalisé** : Choix entre valeur arrondie ou décimale
3. **Animations** : Transitions lors des changements de valeurs
4. **Filtres visuels** : Masquer les marqueurs selon des seuils
5. **Mode nuit** : Couleurs adaptées pour l'affichage nocturne
6. **Filtre par type de valeur** : Afficher seulement les valeurs corrigées ou brutes
7. **Statistiques de correction** : Pourcentage de valeurs corrigées par zone

### Optimisations

1. **Cache des marqueurs** : Mise en cache des éléments HTML générés
2. **Lazy loading** : Chargement différé des marqueurs hors écran
3. **Clustering** : Regroupement des marqueurs proches
4. **Compression** : Optimisation des images de marqueurs

## 📝 Notes de Développement

### Bonnes Pratiques

- Toujours vérifier le statut de l'appareil avant d'afficher une valeur
- Utiliser des couleurs contrastées pour la lisibilité
- Tester sur différents navigateurs et tailles d'écran
- Maintenir la cohérence visuelle entre toutes les sources
- Utiliser `getAirQualityLevel()` pour calculer le niveau de qualité
- Utiliser `getMarkerPath()` pour obtenir le chemin du marqueur
- **Normaliser les données** avant de les utiliser pour l'affichage
- **Valider les valeurs** pour éviter les affichages aberrants
- **Gérer les valeurs corrigées** de manière cohérente pour toutes les sources

### Dépannage

- **Valeurs non affichées** : Vérifier le statut et la valeur de l'appareil
- **Texte illisible** : Vérifier les couleurs et le contraste
- **Marqueurs manquants** : Vérifier les chemins d'images et les classes CSS
- **Performance** : Surveiller le nombre de marqueurs générés
- **Données aberrantes** : Vérifier la normalisation et validation des données
- **Indicateurs de correction** : Vérifier que `has_correction` est correctement défini
- **Formatage des valeurs** : Vérifier la logique de sélection valeur brute vs corrigée

### Intégration de Nouvelles Sources

Pour intégrer une nouvelle source de données :

1. **Créer le service** : Implémenter un service qui étend `BaseDataService`
2. **Ajouter les marqueurs** : Créer les images PNG pour chaque niveau de qualité
3. **Mettre à jour `getMarkerPath()`** : Ajouter le mapping pour la nouvelle source
4. **Implémenter la normalisation** : Utiliser les utilitaires de normalisation
5. **Tester l'affichage** : Vérifier que les valeurs s'affichent correctement
6. **Ajouter au factory** : Intégrer dans `DataServiceFactory`
7. **Gérer les valeurs corrigées** : Si applicable, implémenter le support des corrections

### Exemple d'Intégration Complète avec Valeurs Corrigées

```typescript
// 1. Créer le service avec support des valeurs corrigées
export class NouvelleSourceService extends BaseDataService {
  async fetchData(params: any): Promise<MeasurementDevice[]> {
    const rawData = await this.fetchRawData(params);

    return rawData.map(rawDevice => {
      // Normaliser les données
      const normalizedDevice = {
        id: rawDevice.sensor_id,
        name: rawDevice.sensor_name,
        latitude: Number(rawDevice.lat),
        longitude: Number(rawDevice.lng),
        value: Number(rawDevice.measurement_value),
        unit: DataNormalizer.normalizeUnit(rawDevice.unit),
        timestamp: TimestampNormalizer.normalizeTimestamp(rawDevice.timestamp),
        pollutant: params.pollutant,
        // Gestion des valeurs corrigées
        corrected_value: rawDevice.corrected_value,
        raw_value: rawDevice.raw_value,
        has_correction: rawDevice.corrected_value !== null,
      };

      // Utiliser la méthode de normalisation de BaseDataService
      return this.normalizeDevice(normalizedDevice);
    });
  }
}

// 2. Ajouter le mapping dans getMarkerPath()
const sourceMapping: Record<string, string> = {
  // ... sources existantes
  nouvelleSource: "nouvelleSourceMarkers/nouvelleSource",
};

// 3. Créer les fichiers de marqueurs
// public/markers/nouvelleSourceMarkers/nouvelleSource_bon.png
// public/markers/nouvelleSourceMarkers/nouvelleSource_moyen.png
// etc.

// 4. Ajouter au factory
case "nouvelleSource":
  service = new NouvelleSourceService();
  break;

// 5. Mettre à jour la logique d'affichage si nécessaire
if (device.source === "nouvelleSource" && device.has_correction) {
  // Logique spécifique pour les valeurs corrigées
}
```

## 🔗 Comparaison des Sources

| Source               | Valeurs Corrigées  | Indicateur Visuel | Format d'Affichage             |
| -------------------- | ------------------ | ----------------- | ------------------------------ |
| **AtmoRef**          | Non applicable     | Aucun             | `42 µg/m³`                     |
| **AtmoMicro**        | ✅ Support complet | Point vert        | `42 µg/m³ (corrigé, brut: 45)` |
| **SignalAir**        | Non applicable     | Aucun             | Pas de valeur                  |
| **NebuleAir**        | À implémenter      | À définir         | À définir                      |
| **PurpleAir**        | À implémenter      | À définir         | À définir                      |
| **Sensor.Community** | À implémenter      | À définir         | À définir                      |

## 📊 Logique de Gestion des Valeurs Corrigées

### Principe de Fonctionnement

```typescript
// Dans AtmoMicroService.ts
const hasCorrection = measure.valeur !== null;
const displayValue = hasCorrection ? measure.valeur! : measure.valeur_brute;
const correctedValue = hasCorrection ? measure.valeur : undefined;
const rawValue = measure.valeur_brute;
```

### Comportement par Source

#### AtmoRef

- **Valeur utilisée** : `measure.valeur` (déjà validée)
- **Pas de distinction** : Les données de référence sont déjà calibrées
- **Affichage** : `42 µg/m³`

#### AtmoMicro

- **Valeur prioritaire** : `measure.valeur` (corrigée) si disponible
- **Valeur de repli** : `measure.valeur_brute` si pas de correction
- **Indicateur visuel** : Point vert si correction appliquée
- **Affichage** : `42 µg/m³ (corrigé, brut: 45)` ou `42 µg/m³`

#### Autres Sources

- **À définir** selon les capacités de chaque API
- **Extension possible** du système de valeurs corrigées
- **Cohérence** avec l'interface `MeasurementDevice`

### Avantages du Système

1. **Transparence** : L'utilisateur voit quand une correction a été appliquée
2. **Fiabilité** : Distinction claire entre valeurs brutes et corrigées
3. **Extensibilité** : Système prêt pour d'autres sources avec corrections
4. **Compatibilité** : Les sources sans correction continuent de fonctionner
5. **Performance** : Indicateur visuel léger (point coloré)

### Évolutions Futures

- **Filtres** : Option pour afficher seulement les valeurs corrigées
- **Statistiques** : Pourcentage de corrections par zone géographique
- **Historique** : Comparaison des valeurs brutes vs corrigées dans le temps
- **Validation** : Système de validation des corrections appliquées
