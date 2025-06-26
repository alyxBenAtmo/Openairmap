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
}

.value-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 8px;
  font-weight: bold;
  font-family: Arial, sans-serif;
  text-align: center;
  line-height: 1;
  pointer-events: none;
  user-select: none;
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
  - 1 chiffre : 16px
  - 2 chiffres : 14px
  - 3+ chiffres : 10px

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
  qualityLevel?: string;
  // ... autres propriétés
}
```

### Sources Actuellement Supportées

#### AtmoRef (AtmoSud)

- **Champ de valeur** : `measure.valeur`
- **Statut** : Basé sur la présence de mesures récentes
- **Qualité** : Utilisé les seuils par polluant

#### Sources à Intégrer

##### AtmoMicro

- **Champ de valeur** : Probablement `measure.valeur` ou `measure.value`
- **Statut** : Basé sur la fraîcheur des données
- **Qualité** : Utilisé les seuils par polluant

##### NebuleAir (Capteurs communautaires)

- **Champ de valeur** : `sensor.value` ou `measurement.value`
- **Statut** : Basé sur la connectivité du capteur
- **Qualité** : Utilisé les seuils par polluant

##### PurpleAir

- **Champ de valeur** : `sensor.pm2.5_atm` ou `sensor.pm10_atm`
- **Statut** : Basé sur la dernière transmission
- **Qualité** : Utilisé les seuils par polluant

##### Sensor.Community

- **Champ de valeur** : `sensor.P1` (PM10) ou `sensor.P2` (PM2.5)
- **Statut** : Basé sur la dernière mise à jour
- **Qualité** : Utilisé les seuils par polluant

##### SignalAir

- **Champ de valeur** : Pas de valeur numérique (signalements qualitatifs)
- **Statut** : Toujours `"active"` pour les signalements récents
- **Qualité** : Pas de qualité

## 🛠️ Implémentation Technique

### Fonction de Création des Marqueurs

```typescript
const createCustomIcon = (device: MeasurementDevice) => {
  const qualityLevel = device.qualityLevel || "default";
  const markerPath = getMarkerPath(device.source, qualityLevel);

  // Créer l'élément HTML
  const div = document.createElement("div");
  div.className = "custom-marker-container";

  // Image de base
  const img = document.createElement("img");
  img.src = markerPath;

  // Texte de la valeur
  const valueText = document.createElement("div");
  valueText.className = "value-text";

  // Logique d'affichage
  if (device.status === "active" && device.value > 0) {
    const displayValue = Math.round(device.value);
    valueText.textContent = displayValue.toString();
    // ... configuration des couleurs
  }

  return L.divIcon({
    html: div.outerHTML,
    className: "custom-marker-div",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};
```

### Gestion des Cas Particuliers

#### SignalAir (Signalements Qualitatifs)

Pour les signalements sans valeur numérique :

```typescript
// Dans le service SignalAir
if (device.source === "signalAir") {
  // Afficher un symbole au lieu d'une valeur
  valueText.textContent = getSignalIcon(device.signalType);
  valueText.style.fontSize = "12px"; // Icône plus grande
}
```

#### Valeurs Très Élevées

Pour les valeurs à 3 chiffres ou plus :

```typescript
if (displayValue >= 100) {
  valueText.style.fontSize = "6px"; // Police plus petite
}
```

## 🔧 Configuration et Personnalisation

### Modifier la Taille du Texte

Pour adapter la taille selon la valeur :

```typescript
// Ajustement automatique selon la longueur de la valeur
if (displayValue >= 100) {
  valueText.style.fontSize = "10px"; // Police plus petite pour les grandes valeurs
} else if (displayValue >= 10) {
  valueText.style.fontSize = "14px"; // Police moyenne pour les valeurs à 2 chiffres
} else {
  valueText.style.fontSize = "16px"; // Police normale pour les valeurs à 1 chiffre
}
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

### Dépannage

- **Valeurs non affichées** : Vérifier le statut et la valeur de l'appareil
- **Texte illisible** : Vérifier les couleurs et le contraste
- **Marqueurs manquants** : Vérifier les chemins d'images et les classes CSS
- **Performance** : Surveiller le nombre de marqueurs générés
