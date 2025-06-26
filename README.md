# Carte de la Qualité de l'Air - React Open Air Map

Une application React modulaire et responsive pour afficher des appareils de mesure de la qualité de l'air sur une carte interactive Leaflet.

## 🚀 Fonctionnalités

- **Carte interactive** avec Leaflet pour afficher les appareils de mesure
- **Contrôles intégrés dans l'en-tête** :
  - Sélection du polluant (1 actif à la fois)
  - Sélection des sources de données (plusieurs sources possibles)
  - Sélection du pas de temps (1 actif à la fois)
  - Sélecteur de période pour SignalAir (visible uniquement si SignalAir est sélectionné)
- **Contrôle du fond de carte** : Basculement entre carte standard et satellite
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
│   │   └── BaseLayerControl.tsx
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

## 🎯 Fonctionnalités avancées

- **Mise à jour automatique** : Les données se mettent à jour quand les paramètres changent
- **Gestion des erreurs** : Affichage des erreurs de chargement
- **États de chargement** : Indicateurs visuels pendant le chargement avec détails des sources
- **Sélection intelligente** : Gestion des groupes de sources avec états partiels
- **Interface adaptative** : Affichage conditionnel des contrôles selon les sélections

## 🛠️ Technologies utilisées

- **React 19** avec TypeScript
- **Vite** pour le build et le développement
- **Leaflet** pour la carte interactive
- **React Leaflet** pour l'intégration React
- **Tailwind CSS** pour les styles
- **PostCSS** pour le traitement CSS

## 📝 Licence

Ce projet est sous licence MIT.
