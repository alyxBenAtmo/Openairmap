# Marqueurs de la Carte - Organisation

## 📁 Structure des Marqueurs

Ce dossier contient tous les marqueurs utilisés sur la carte interactive de qualité de l'air.

### 🎯 Organisation par Source

```
markers/
├── atmoRefMarkers/          # Stations de référence AtmoSud
├── atmoMicroMarkers/        # Micro-capteurs AtmoSud
├── nebuleAirMarkers/        # Capteurs communautaires NebuleAir
├── purpleAirMarkers/        # Capteurs PurpleAir
├── sensorCommunityMarkers/  # Capteurs Sensor.Community
└── signalAirMarkers/        # Signalements SignalAir
```

### 🎨 Convention de Nommage

#### Sources de Mesure (AtmoRef, AtmoMicro, etc.)

- Format : `{baseName}_{qualityLevel}.png`
- Exemple : `refStationAtmoSud_bon.png`

**Niveaux de qualité disponibles :**

- `bon` : Qualité bonne (vert)
- `moyen` : Qualité moyenne (jaune)
- `degrade` : Qualité dégradée (orange)
- `mauvais` : Qualité mauvaise (rouge)
- `tresMauvais` : Qualité très mauvaise (rouge foncé)
- `extrMauvais` : Qualité extrêmement mauvaise (violet)
- `default` : Marqueur par défaut (gris)

#### Signalements SignalAir

- Format : `{signalType}.png`
- Exemple : `odeur.png`

**Types de signalements disponibles :**

- `odeur.png` : Signalements d'odeurs
- `bruits.png` : Signalements de bruits
- `brulage.png` : Signalements de brûlage
- `visuel.png` : Signalements visuels
- `pollen.png` : Signalements de pollen

### 🔧 Spécifications Techniques

#### Format d'Image

- **Format** : PNG avec transparence
- **Taille recommandée** : 32x32 pixels
- **Résolution** : 72 DPI minimum
- **Transparence** : Supportée pour l'intégration sur la carte

#### Optimisation

- **Compression** : Optimiser les PNG pour le web
- **Poids** : Maintenir sous 10KB par image
- **Qualité** : Équilibrer qualité visuelle et performance

### 📝 Ajout de Nouveaux Marqueurs

1. **Créer le dossier** pour la nouvelle source si nécessaire
2. **Nommer les fichiers** selon la convention établie
3. **Ajouter la configuration** dans `src/constants/markers.ts`
4. **Tester l'affichage** sur la carte
5. **Documenter** les nouveaux marqueurs ici

### 🚀 Utilisation dans le Code

```typescript
import { getMarkerPath } from "../constants/markers";

// Obtenir le chemin d'un marqueur
const markerPath = getMarkerPath("atmoRef", "bon");
// Retourne : '/markers/atmoRefMarkers/refStationAtmoSud_bon.png'

// Vérifier si un marqueur existe
const exists = markerExists("atmoMicro", "moyen");
// Retourne : true
```

### 🔍 Validation

Avant de commiter de nouveaux marqueurs :

- [ ] Images au format PNG avec transparence
- [ ] Taille 32x32 pixels
- [ ] Nommage conforme à la convention
- [ ] Configuration ajoutée dans `markers.ts`
- [ ] Test d'affichage sur la carte
- [ ] Optimisation du poids des fichiers

### 📊 Statistiques

- **Nombre total de marqueurs** : ~50 fichiers
- **Taille totale** : ~500KB
- **Sources supportées** : 6 sources différentes
- **Niveaux de qualité** : 7 niveaux par source (sauf SignalAir)
