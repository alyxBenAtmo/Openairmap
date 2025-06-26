# Marqueurs avec Valeurs Affichées - Documentation

## 🎯 Vue d'ensemble

Le système de marqueurs avec valeurs affichées permet d'afficher directement la valeur de mesure (arrondie) sur chaque marqueur PNG de la carte. Cette fonctionnalité améliore l'expérience utilisateur en permettant de voir immédiatement les valeurs sans avoir à cliquer sur les marqueurs.

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
</div>
```

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
}
```

### Sources Actuellement Supportées

#### AtmoRef (AtmoSud)

- **Champ de valeur** : `measure.valeur`
- **Statut** : Basé sur la présence de mesures récentes
- **Qualité** : Utilisé les seuils par polluant via `getAirQualityLevel()`

#### SignalAir (Signalements Qualitatifs)

- **Champ de valeur** : Pas de valeur numérique (signalements qualitatifs)
- **Statut** : Toujours `"active"` pour les signalements récents
- **Qualité** : Pas de qualité, utilise `signalType` pour le marqueur
- **Marqueur spécial** : Pas de texte affiché, seulement l'icône du type de signalement

#### Sources à Intégrer

##### AtmoMicro

- **Champ de valeur** : Probablement `measure.valeur` ou `measure.value`
- **Statut** : Basé sur la fraîcheur des données
- **Qualité** : Utilisé les seuils par polluant via `getAirQualityLevel()`

##### NebuleAir (Capteurs communautaires)

- **Champ de valeur** : `sensor.value` ou `measurement.value`
- **Statut** : Basé sur la connectivité du capteur
- **Qualité** : Utilisé les seuils par polluant via `getAirQualityLevel()`

##### PurpleAir

- **Champ de valeur** : `sensor.pm2.5_atm` ou `sensor.pm10_atm`
- **Statut** : Basé sur la dernière transmission
- **Qualité** : Utilisé les seuils par polluant via `getAirQualityLevel()`

##### Sensor.Community

- **Champ de valeur** : `sensor.P1` (PM10) ou `sensor.P2` (PM2.5)
- **Statut** : Basé sur la dernière mise à jour
- **Qualité** : Utilisé les seuils par polluant via `getAirQualityLevel()`

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
│   └── ...
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

### Dépannage

- **Valeurs non affichées** : Vérifier le statut et la valeur de l'appareil
- **Texte illisible** : Vérifier les couleurs et le contraste
- **Marqueurs manquants** : Vérifier les chemins d'images et les classes CSS
- **Performance** : Surveiller le nombre de marqueurs générés

### Intégration de Nouvelles Sources

Pour intégrer une nouvelle source de données :

1. **Créer le service** : Implémenter un service qui étend `BaseDataService`
2. **Ajouter les marqueurs** : Créer les images PNG pour chaque niveau de qualité
3. **Mettre à jour `getMarkerPath()`** : Ajouter le mapping pour la nouvelle source
4. **Tester l'affichage** : Vérifier que les valeurs s'affichent correctement
5. **Ajouter au factory** : Intégrer dans `DataServiceFactory`

### Exemple d'Intégration

```typescript
// 1. Ajouter le mapping dans getMarkerPath()
const sourceMapping: Record<string, string> = {
  // ... sources existantes
  nouvelleSource: "nouvelleSourceMarkers/nouvelleSource",
};

// 2. Créer les fichiers de marqueurs
// public/markers/nouvelleSourceMarkers/nouvelleSource_bon.png
// public/markers/nouvelleSourceMarkers/nouvelleSource_moyen.png
// etc.

// 3. Dans le service, calculer le qualityLevel
const qualityLevel = getAirQualityLevel(device.value, pollutant.thresholds);

// 4. Retourner un MeasurementDevice avec qualityLevel
return {
  // ... autres propriétés
  qualityLevel,
  status: "active", // ou "inactive" selon les données
};
```
