# Carte de la Qualité de l'Air - React Open Air Map

Une application React modulaire et responsive pour afficher des appareils de mesure de la qualité de l'air sur une carte interactive Leaflet avec clustering intelligent et statistiques.

## 🚀 Fonctionnalités

- **Carte interactive** avec Leaflet pour afficher les appareils de mesure
- **Clustering intelligent** des marqueurs avec paramétrage utilisateur
- **Contrôles intégrés dans l'en-tête** :
  - Sélection du polluant (1 actif à la fois)
  - Sélection des sources de données (plusieurs sources possibles)
  - Sélection du pas de temps (1 actif à la fois)
  - Sélecteur de période pour SignalAir (visible uniquement si SignalAir est sélectionné)
- **Contrôle du fond de carte** : Basculement entre carte standard et satellite
- **Contrôle du clustering** : Paramétrage en temps réel du clustering des marqueurs
- **Légende dynamique** : Affichage des seuils selon le polluant sélectionné
- **Architecture modulaire** avec services séparés pour chaque source de données
- **Design responsive** adapté à tous les écrans
- **Marqueurs colorés** selon la valeur des mesures
- **Interface moderne** avec Tailwind CSS

## 📁 Architecture du projet

```
src/
├── components/          # Composants React
│   ├── controls/       # Composants de contrôle (menus)
│   │   ├── PollutantDropdown.tsx
│   │   ├── SourceDropdown.tsx
│   │   ├── TimeStepDropdown.tsx
│   │   ├── SignalAirPeriodSelector.tsx
│   │   ├── TimePeriodDisplay.tsx
│   │   ├── BaseLayerControl.tsx
│   │   └── ClusterControl.tsx
│   ├── map/           # Composants de carte
│   │   ├── AirQualityMap.tsx
│   │   ├── Legend.tsx
│   │   ├── HistoricalChart.tsx
│   │   └── StationSidePanel.tsx
│   └── App.tsx        # Composant principal
├── services/          # Services de données
│   ├── BaseDataService.ts
│   ├── AtmoRefService.ts
│   ├── AtmoMicroService.ts
│   ├── NebuleAirService.ts
│   ├── SignalAirService.ts
│   └── DataServiceFactory.ts
├── hooks/             # Hooks personnalisés
│   └── useAirQualityData.ts
├── constants/         # Constantes
│   ├── pollutants.ts
│   ├── sources.ts
│   ├── timeSteps.ts
│   └── mapLayers.ts
├── types/             # Types TypeScript
│   └── index.ts
└── utils/             # Utilitaires
```

## 🛠️ Sources de données supportées

- **AtmoRef** : Stations de référence AtmoSud
- **AtmoMicro** : Microcapteurs qualifiés AtmoSud
- **SignalAir** : Capteurs SignalAir
- **Capteurs communautaires** :
  - **NebuleAir** : Capteurs communautaires NebuleAir
  - **Sensor.Community** : Capteurs communautaires
  - **PurpleAir** : Capteurs PurpleAir

## 🎨 Polluants supportés

- **PM₁** : Particules fines ≤ 1 µm
- **PM₂.₅** : Particules fines ≤ 2.5 µm
- **PM₁₀** : Particules fines ≤ 10 µm
- **NO₂** : Dioxyde d'azote
- **O₃** : Ozone
- **SO₂** : Dioxyde de soufre

### Seuils de qualité de l'air

Chaque polluant dispose de 6 niveaux de qualité avec des seuils spécifiques :

- **Bon** : Qualité excellente
- **Moyen** : Qualité acceptable
- **Dégradé** : Qualité médiocre
- **Mauvais** : Qualité mauvaise
- **Très mauvais** : Qualité très mauvaise
- **Extrêmement mauvais** : Qualité extrêmement mauvaise

## ⏱️ Pas de temps disponibles

- **Scan** : Valeurs instantanées
- **≤ 2 minutes** : Moyenne sur 2 minutes
- **15 minutes** : Moyenne sur 15 minutes
- **Heure** : Moyenne horaire (par défaut)
- **Jour** : Moyenne journalière

## 🗺️ Fonds de carte

- **Carte standard** : Fond CARTO clair avec OpenStreetMap
- **Satellite** : Imagerie satellite ESRI

## 🔗 Clustering des marqueurs

### Fonctionnalités de clustering

- **Clustering automatique** : Regroupement intelligent des marqueurs proches
- **Paramétrage en temps réel** : Contrôle utilisateur des options de clustering
- **Performance optimisée** : Amélioration des performances avec de nombreux marqueurs
- **Interface intuitive** : Menu de contrôle accessible depuis la carte

### Options de clustering configurables

- **Activation/Désactivation** : Basculement du clustering
- **Rayon de clustering** : Distance de regroupement (20px à 200px)
- **Spiderfy au zoom maximum** : Éclatement des clusters au zoom max
- **Affichage de la zone** : Visualisation de la zone de cluster au survol
- **Zoom sur la zone** : Zoom automatique sur la zone du cluster au clic
- **Animations** : Transitions fluides pour le clustering
- **Animations d'ajout** : Effets visuels lors de l'ajout de marqueurs

## 🎨 Interface utilisateur

### En-tête avec contrôles intégrés

L'interface principale dispose d'un en-tête compact contenant tous les contrôles :

- **Logo OpenAirMap** : Titre de l'application à gauche
- **Contrôles de sélection** : Alignés horizontalement à droite
  - **Polluant** : Menu déroulant avec label et bouton côte à côte
  - **Sources** : Menu déroulant avec sélection multiple et hiérarchie
  - **Pas de temps** : Menu déroulant pour la période de mesure
  - **Période SignalAir** : Sélecteur de dates (visible si SignalAir est actif)
- **Indicateurs d'information** : Affichage des sélections actuelles séparés par une bordure verticale

### Contrôles de carte

- **Contrôle du clustering** : Icône en bas à gauche pour paramétrer le clustering
- **Contrôle fond de carte** : Icône en bas à gauche pour basculer entre carte et satellite
- **Légende** : Affichage des seuils en bas au centre avec tooltips au hover
- **Informations de la carte** : Compteur d'appareils et signalements en bas à droite

### Design et UX

- **Interface compacte** : Contrôles intégrés dans l'en-tête pour maximiser l'espace de la carte
- **Menus déroulants horizontaux** : Labels et boutons alignés côte à côte
- **Sélection multiple intelligente** : Groupes de sources avec états partiels
- **États visuels clairs** : Sélectionné, partiellement sélectionné, non sélectionné
- **Responsive design** : Adapté à tous les écrans
- **Animations fluides** : Transitions et hover effects
- **Indicateurs de chargement** : Affichage discret des états de chargement
- **Clustering intelligent** : Amélioration de la lisibilité avec de nombreux marqueurs

## 🚀 Installation et démarrage

1. **Cloner le projet**

   ```bash
   git clone <repository-url>
   cd ReactOpenAirMap
   ```

2. **Installer les dépendances**

   ```bash
   npm install
   ```

3. **Démarrer le serveur de développement**

   ```bash
   npm run dev
   ```

4. **Ouvrir dans le navigateur**
   ```
   http://localhost:5173
   ```

## 🏗️ Structure modulaire

### Services de données

Chaque source de données a son propre service qui hérite de `BaseDataService` :

```typescript
export class AtmoRefService extends BaseDataService {
  async fetchData(params) {
    // Logique spécifique à AtmoRef
  }
}
```

### Composants de contrôle

Les menus sont organisés en composants réutilisables avec interface horizontale :

- `PollutantDropdown` : Sélection du polluant avec label et bouton alignés
- `SourceDropdown` : Sélection multiple des sources avec hiérarchie et groupes
- `TimeStepDropdown` : Sélection du pas de temps
- `SignalAirPeriodSelector` : Sélecteur de période pour SignalAir
- `TimePeriodDisplay` : Affichage de la période actuelle
- `BaseLayerControl` : Contrôle du fond de carte avec icônes
- `ClusterControl` : Contrôle du clustering des marqueurs

### Hook personnalisé

`useAirQualityData` gère la récupération et l'état des données :

```typescript
const { devices, reports, loading, error, loadingSources } = useAirQualityData({
  selectedPollutant,
  selectedSources,
  selectedTimeStep,
  signalAirPeriod,
});
```

### Constantes centralisées

- `pollutants.ts` : Définition des polluants avec seuils
- `sources.ts` : Configuration des sources de données
- `timeSteps.ts` : Définition des pas de temps
- `mapLayers.ts` : Configuration des fonds de carte

## 📊 Utilisation du clustering

### Activation du clustering

1. Cliquez sur l'icône de clustering en bas à gauche de la carte
2. Cochez "Activer le clustering" pour activer le regroupement automatique
3. Ajustez le rayon de clustering selon vos préférences

### Personnalisation des options

- **Rayon de clustering** : Détermine la distance à laquelle les marqueurs se regroupent
- **Spiderfy au zoom maximum** : Éclate les clusters quand vous zoomez au maximum
- **Affichage de la zone** : Montre la zone couverte par un cluster au survol
- **Zoom sur la zone** : Zoom automatique sur la zone du cluster au clic
- **Animations** : Active les transitions fluides pour une meilleure UX

### Avantages du clustering

- **Performance améliorée** : Moins de marqueurs à rendre simultanément
- **Lisibilité accrue** : Regroupement logique des points proches
- **Navigation facilitée** : Zoom automatique sur les zones d'intérêt
- **Interface responsive** : Adaptation automatique selon le niveau de zoom

## 🔧 Dépendances principales

- **React 19** : Framework principal
- **Leaflet** : Bibliothèque de cartographie
- **react-leaflet** : Intégration React pour Leaflet
- **react-leaflet-cluster** : Clustering des marqueurs
- **Tailwind CSS** : Framework CSS utilitaire
- **Recharts** : Graphiques pour les données historiques
- **TypeScript** : Typage statique

## 📝 Notes de développement

### Compatibilité

- Compatible avec React 19 et react-leaflet v5
- Utilisation de `--legacy-peer-deps` pour certaines dépendances
- Support complet de TypeScript

### Performance

- Clustering automatique pour optimiser les performances
- Chargement différé des données
- Gestion intelligente des états de chargement
- Optimisation du rendu des marqueurs

### Extensibilité

- Architecture modulaire pour faciliter l'ajout de nouvelles sources
- Services séparés pour chaque type de données
- Composants réutilisables
- Configuration centralisée

## 📝 Licence

Ce projet est sous licence MIT.
