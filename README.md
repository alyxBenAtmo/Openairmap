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
- **Side Panel avec graphiques historiques** : Visualisation des données historiques pour AtmoRef
- **Architecture modulaire** avec services séparés pour chaque source de données
- **Design responsive** adapté à tous les écrans
- **Marqueurs colorés** selon la valeur des mesures avec affichage des valeurs
- **Interface moderne** avec Tailwind CSS
- **Indicateurs de correction** pour les données AtmoMicro
- **Barre de progression** et indicateurs de chargement par source

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

### ✅ **Sources implémentées et fonctionnelles :**

- **AtmoRef** : Stations de référence AtmoSud

  - ✅ Données en temps réel
  - ✅ Side panel avec graphiques historiques
  - ✅ Support de tous les polluants
  - ✅ Gestion des variables par station

- **SignalAir** : Capteurs SignalAir
  - ✅ Signalements de nuisances (odeurs, bruits, brûlages, visuels)
  - ✅ Sélecteur de période personnalisé
  - ✅ Marqueurs spécifiques par type de signalement
  - ✅ Filtrage par date

### 🔄 **Sources partiellement implémentées :**

- **AtmoMicro** : Microcapteurs qualifiés AtmoSud

  - ✅ Données en temps réel avec valeurs corrigées
  - ✅ Indicateurs visuels de correction
  - ❌ Side panel (en développement)
  - ✅ Support des polluants PM₁, PM₂.₅, PM₁₀, NO₂, O₃, SO₂

- **NebuleAir** : Capteurs communautaires NebuleAir
  - 🔄 Données mockées (implémentation en cours)
  - ❌ API réelle (à implémenter)

### 🚧 **Sources à implémenter :**

- **PurpleAir** : Capteurs PurpleAir

  - ❌ Service vide (planifié)
  - ❌ API à intégrer

- **Sensor.Community** : Capteurs communautaires
  - ❌ Service vide (planifié)
  - ❌ API à intégrer

## 🎨 Polluants supportés

- **PM₁** : Particules fines ≤ 1 µm
- **PM₂.₅** : Particules fines ≤ 2.5 µm (activé par défaut)
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

- **instantane** : Valeurs instantanées
- **deuxMin** : Moyenne sur 2 minutes
- **quartHeure** : Moyenne sur 15 minutes
- **heure** : Moyenne horaire (activé par défaut)
- **jour** : Moyenne journalière

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

## 📊 Side Panel et Graphiques Historiques

### Fonctionnalités du Side Panel

- **Affichage des informations de station** : Détails complets de la station sélectionnée
- **Graphiques historiques** : Visualisation des données sur différentes périodes
- **Sélection de polluants** : Choix des polluants à afficher dans les graphiques
- **Contrôles de période** : Sélection de la période d'analyse (3h, 24h, 7j, 1an)
- **Gestion des tailles** : Panel normal, plein écran ou masqué
- **Support AtmoRef** : Intégration complète avec les données historiques AtmoRef

### Contrôles du Side Panel

- **Sélection de polluants** : Checkboxes pour choisir les polluants à afficher
- **Périodes prédéfinies** : Boutons pour 3h, 24h, 7 jours, 1 an
- **Pas de temps** : Sélection de la granularité des données
- **Redimensionnement** : Boutons pour changer la taille du panel

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
- **Barre de progression** : Indicateur de chargement discret en bas de l'en-tête

### Contrôles de carte

- **Contrôle du clustering** : Icône en bas à gauche pour paramétrer le clustering
- **Contrôle fond de carte** : Icône en bas à gauche pour basculer entre carte et satellite
- **Légende** : Affichage des seuils en bas au centre avec tooltips au hover
- **Informations de la carte** : Compteur d'appareils et signalements en bas à droite
- **Indicateur de chargement** : Affichage discret des sources en cours de chargement

### Marqueurs et affichage

- **Marqueurs colorés** : Couleurs selon les seuils de qualité de l'air
- **Affichage des valeurs** : Valeurs numériques directement sur les marqueurs
- **Indicateurs de correction** : Badge bleu pour les données AtmoMicro corrigées
- **Marqueurs SignalAir** : Icônes spécifiques par type de signalement
- **Animations de chargement** : Effets visuels pendant le chargement des données

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

  async fetchHistoricalData(params) {
    // Données historiques pour le side panel
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

## 📊 Utilisation du Side Panel

### Ouverture du Side Panel

1. Cliquez sur un marqueur AtmoRef sur la carte
2. Le side panel s'ouvre automatiquement avec les informations de la station
3. Les graphiques historiques se chargent pour la période par défaut (24h)

### Contrôles du Side Panel

- **Sélection de polluants** : Cochez/décochez les polluants à afficher
- **Périodes** : Utilisez les boutons 3h, 24h, 7j, 1an pour changer la période
- **Pas de temps** : Sélectionnez la granularité des données (15min par défaut)
- **Redimensionnement** : Utilisez les boutons pour changer la taille du panel

### Fonctionnalités avancées

- **Données historiques** : Visualisation des tendances sur différentes périodes
- **Multi-polluants** : Affichage simultané de plusieurs polluants
- **Zoom et navigation** : Interactions avec les graphiques pour explorer les données
- **Export** : Possibilité d'exporter les données (à implémenter)

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
- Cache des données SignalAir pour éviter les appels répétés

### Extensibilité

- Architecture modulaire pour faciliter l'ajout de nouvelles sources
- Services séparés pour chaque type de données
- Composants réutilisables
- Configuration centralisée

## 🚧 Fonctionnalités en développement

### À implémenter prochainement

- **Side Panel pour AtmoMicro** : Graphiques historiques pour les microcapteurs
- **Panel statistique** : Statistiques des appareils affichés sur la carte
- **NebuleAir complet** : Intégration de l'API réelle NebuleAir
- **PurpleAir** : Intégration des capteurs PurpleAir
- **Sensor.Community** : Intégration des capteurs communautaires

### Améliorations prévues

- **Export de données** : Export CSV/JSON des données affichées
- **Notifications** : Alertes pour les dépassements de seuils
- **Filtres avancés** : Filtrage par qualité de l'air, distance, etc.
- **Mode hors ligne** : Cache local pour consultation hors ligne
- **API publique** : Exposition des données via API REST

## 📝 Licence

Ce projet est sous licence MIT.
