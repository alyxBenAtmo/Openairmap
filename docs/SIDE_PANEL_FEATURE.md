# Fonctionnalité Side Panel - Données Historiques

## 🎯 Vue d'ensemble

La fonctionnalité de side panel permet d'afficher les données historiques d'une station de mesure en cliquant sur son marqueur sur la carte. Cette fonctionnalité est actuellement disponible uniquement pour les stations AtmoRef et offre une interface complète pour explorer les données temporelles des polluants.

## 🚀 Fonctionnalités Implémentées

### 📊 Affichage des données historiques

- **Graphique interactif** : Utilise Recharts pour afficher les données sous forme de graphique linéaire multi-polluants
- **Données en temps réel** : Récupération des données historiques via l'API AtmoSud
- **Multi-polluants** : Possibilité d'afficher plusieurs polluants simultanément sur le même graphique
- **Tooltips informatifs** : Affichage des valeurs, unités et noms de polluants au survol

### 🎛️ Contrôles du graphique

#### Polluants

- **Affichage complet** : Tous les polluants pris en charge par l'application sont affichés
- **Filtrage intelligent** : Seuls les polluants disponibles dans la station sont affichés
- **Indication de disponibilité** : Les polluants non disponibles sont grisés avec "Non disponible"
- **Sélection automatique** : Le polluant initial est sélectionné s'il est disponible, sinon le premier disponible
- **Mapping automatique** : Conversion des codes AtmoRef vers les noms de polluants de l'application
- **Sélection multiple** : Possibilité de sélectionner plusieurs polluants simultanément

#### Polluants supportés par l'application

- **PM₁** (pm1) : Particules fines < 1 µm
- **PM₂.₅** (pm25) : Particules fines < 2.5 µm
- **PM₁₀** (pm10) : Particules fines < 10 µm
- **NO₂** (no2) : Dioxyde d'azote
- **SO₂** (so2) : Dioxyde de soufre
- **O₃** (o3) : Ozone

#### Période historique

- **Périodes prédéfinies** : 3h, 24h, 7j, 1an
- **Calcul automatique** : Les dates de début et fin sont calculées automatiquement
- **Interface intuitive** : Boutons toggle pour sélectionner la période
- **Format français** : Affichage des dates en format français

#### Pas de temps

- **Options disponibles** : Scan (instantané), 15min (quartHeure), 1h (heure), 1j (jour)
- **Indépendant de la carte** : Ce contrôle n'affecte que le graphique
- **Adaptation automatique** : Les données sont récupérées selon le pas de temps sélectionné
- **Mapping AtmoSud** : Conversion automatique vers les paramètres AtmoSud

#### Contrôles de taille du panel

- **Taille normale** : 500px de largeur, taille par défaut optimale
- **Plein écran** : 100% de la largeur pour une vue maximale
- **Masqué** : Cache complètement le panel avec bouton de réouverture
- **Transitions fluides** : Animation de 300ms entre les états
- **Bouton flottant** : Bouton bleu en haut à gauche pour rouvrir le panel masqué

## 🏗️ Architecture Technique

### Composants principaux

#### `StationSidePanel` (688 lignes)

- **Rôle** : Composant principal du panneau latéral
- **Fonctionnalités** :
  - Gestion de l'état du panneau (ouvert/fermé/masqué)
  - Contrôles des polluants, période et pas de temps
  - Chargement des données historiques
  - Affichage du graphique
  - Gestion des erreurs et états de chargement
  - Contrôles de taille du panel

#### `HistoricalChart` (168 lignes)

- **Rôle** : Composant de graphique utilisant Recharts
- **Fonctionnalités** :
  - Affichage multi-lignes pour plusieurs polluants
  - Tooltips interactifs avec valeurs et unités
  - Légende automatique
  - Formatage des dates en français
  - Gestion des unités de mesure
  - Couleurs distinctes pour chaque polluant
  - Responsive design

### Services

#### `AtmoRefService` (extensions)

- **`fetchHistoricalData`** : Récupère les données historiques d'une station
  - Paramètres : stationId, pollutant, timeStep, startDate, endDate
  - Retour : Array<{ timestamp: string; value: number; unit: string }>
- **`fetchStationVariables`** : Récupère les polluants disponibles pour une station
  - Paramètres : stationId
  - Retour : Record<string, { label: string; code_iso: string; en_service: boolean }>

### Types TypeScript

```typescript
// Types pour les données historiques
interface HistoricalDataPoint {
  timestamp: string;
  value: number;
  unit: string;
}

// Types pour les variables de station
interface StationVariable {
  label: string;
  code_iso: string;
  en_service: boolean;
}

// Types pour les informations de station
interface StationInfo {
  id: string;
  name: string;
  address: string;
  departmentId: string;
  source: string;
  variables: Record<string, StationVariable>;
}

// Types pour les contrôles du graphique
interface ChartControls {
  selectedPollutants: string[];
  timeRange: {
    type: "preset" | "custom";
    preset?: "3h" | "24h" | "7d" | "1y";
    custom?: {
      startDate: string;
      endDate: string;
    };
  };
  timeStep: string;
}

// Types pour l'état du side panel
interface SidePanelState {
  isOpen: boolean;
  selectedStation: StationInfo | null;
  chartControls: ChartControls;
  historicalData: Record<string, HistoricalDataPoint[]>;
  loading: boolean;
  error: string | null;
}

// Mapping des codes de polluants AtmoRef
const ATMOREF_POLLUTANT_MAPPING: Record<string, string> = {
  "01": "so2", // SO2
  "03": "no2", // NO2
  "08": "o3", // O3
  "24": "pm10", // PM10
  "39": "pm25", // PM2.5
  "68": "pm1", // PM1
};
```

## 🔧 Intégration

### Activation du side panel

1. **Clic sur marqueur** : L'utilisateur clique sur un marqueur de station AtmoRef
2. **Récupération des données** : Le système récupère les variables disponibles de la station
3. **Ouverture du panneau** : Le side panel s'ouvre avec les informations de la station
4. **Chargement initial** : Les données historiques sont chargées pour le polluant initial

### Gestion des états

- **Loading** : Affichage d'un spinner pendant le chargement
- **Error** : Affichage des messages d'erreur avec possibilité de retry
- **Empty** : Gestion des cas sans données avec message informatif
- **Multiple pollutants** : Chargement à la demande des polluants supplémentaires

### Flux de données

1. **Sélection de station** → Récupération des variables disponibles
2. **Sélection de polluants** → Chargement des données historiques
3. **Changement de période** → Rechargement avec nouvelles dates
4. **Changement de pas de temps** → Rechargement avec nouveau pas de temps

## 🎨 Interface utilisateur

### Design

- **Panneau latéral** : Largeur variable (500px par défaut, plein écran, ou masqué), positionné à gauche
- **Z-index élevé** : z-[2000] pour être au-dessus de la carte
- **Responsive** : Adaptation automatique à la hauteur de l'écran
- **Scroll** : Défilement vertical pour le contenu
- **Bordure** : Bordure droite pour séparer du contenu principal
- **Transitions fluides** : Animation de 300ms pour les changements de taille

### Contrôles de taille

- **Taille normale** : 500px de largeur (w-[500px])
- **Plein écran** : 100% de la largeur (w-full)
- **Masqué** : Largeur 0 avec overflow caché (w-0 overflow-hidden)
- **Bouton de réouverture** : Bouton flottant bleu quand le panel est masqué

### Interactions

- **Fermeture** : Bouton X discret en haut à droite avec effet hover
- **Redimensionnement** : 3 boutons dans le header pour contrôler la taille
- **Sélection polluants** : Checkboxes modernes avec états visuels subtils
- **Période** : Boutons toggle avec labels descriptifs (3 heures, 24 heures, etc.)
- **Pas de temps** : Boutons toggle avec labels courts (Scan, 15 min, 1 heure, 1 jour)

### Style moderne

- **Transitions fluides** : Durée de 200ms pour tous les effets hover
- **Couleurs subtiles** : Utilisation de gris et bleus discrets
- **Ombres légères** : Shadow-sm pour les éléments actifs
- **Coins arrondis** : rounded-lg pour un look moderne
- **États visuels** : Feedback clair pour les interactions utilisateur
- **Icônes SVG** : Icônes vectorielles pour les contrôles de taille

## 📡 API et données

### Endpoints AtmoSud utilisés

- **Stations** : `/observations/stations` pour récupérer les variables disponibles
- **Données historiques** : `/observations/stations/{id}/mesures` pour les données temporelles

### Format des données

```json
{
  "mesures": [
    {
      "date_debut": "2024-01-15T10:00:00Z",
      "valeur": 25.5,
      "unite": "µg/m³"
    }
  ]
}
```

### Mapping des polluants

```typescript
const ATMOREF_POLLUTANT_MAPPING = {
  "01": "so2", // SO2
  "03": "no2", // NO2
  "08": "o3", // O3
  "24": "pm10", // PM10
  "39": "pm25", // PM2.5
  "68": "pm1", // PM1
};
```

### Configuration des pas de temps

```typescript
const timeStepConfigs = {
  instantane: { temporalite: "quart-horaire", delais: 181 },
  quartHeure: { temporalite: "quart-horaire", delais: 19 },
  heure: { temporalite: "horaire", delais: 64 },
  jour: { temporalite: "journalière", delais: 1444 },
};
```

## 🚧 Limitations actuelles

### Sources supportées

- ✅ **AtmoRef** : Complètement supporté avec toutes les fonctionnalités
- ❌ **AtmoMicro** : Non supporté (à implémenter)
- ❌ **NebuleAir** : Non supporté (à implémenter)
- ❌ **PurpleAir** : Non supporté (à implémenter)
- ❌ **Sensor.Community** : Non supporté (à implémenter)
- ❌ **SignalAir** : Non supporté (données qualitatives)

### Fonctionnalités futures

- **Plage de dates personnalisée** : Sélecteur de dates pour période custom
- **Export des données** : Téléchargement des données en CSV/JSON
- **Comparaison de stations** : Affichage de plusieurs stations sur le même graphique
- **Alertes et seuils** : Affichage des seuils de qualité de l'air sur le graphique
- **Support multi-sources** : Extension aux autres sources de données
- **Mise en cache** : Cache des données historiques pour améliorer les performances

## 🧪 Tests et validation

### Tests à implémenter

- **Tests unitaires** : Composants React et services
- **Tests d'intégration** : Flux complet de clic → ouverture → chargement
- **Tests d'API** : Validation des réponses AtmoSud
- **Tests de performance** : Chargement de grandes quantités de données

### Validation des données

- **Format des timestamps** : Validation ISO 8601
- **Valeurs numériques** : Filtrage des valeurs aberrantes
- **Polluants supportés** : Vérification du mapping
- **Gestion d'erreurs** : Timeouts, erreurs réseau, données manquantes

## 📝 Notes de développement

### Dépendances ajoutées

- **Recharts** : Bibliothèque de graphiques React
- **Types TypeScript** : Interfaces pour la sécurité des types

### Bonnes pratiques implémentées

- **Séparation des responsabilités** : Composants UI vs logique métier
- **Gestion d'état** : Utilisation de useState et useEffect
- **Performance** : Chargement à la demande des données
- **UX** : États de chargement et gestion d'erreurs
- **Accessibilité** : Labels et descriptions appropriés
- **Type safety** : Utilisation complète de TypeScript

### Structure des fichiers

```
src/
├── components/map/
│   ├── StationSidePanel.tsx    # Composant principal (688 lignes)
│   └── HistoricalChart.tsx     # Composant graphique (168 lignes)
├── services/
│   └── AtmoRefService.ts       # Service avec méthodes historiques
└── types/
    └── index.ts                # Types TypeScript complets
```

### Métriques de code

- **StationSidePanel** : 688 lignes avec gestion complète des états
- **HistoricalChart** : 168 lignes avec graphique multi-polluants
- **Types TypeScript** : 187 lignes avec interfaces complètes
- **AtmoRefService** : 291 lignes avec méthodes historiques

## 🎯 Prochaines étapes

1. **Support multi-sources** : Étendre aux autres sources de données
2. **Optimisation des performances** : Mise en cache et lazy loading
3. **Fonctionnalités avancées** : Export, comparaison, alertes
4. **Tests complets** : Couverture de tests unitaires et d'intégration
5. **Documentation utilisateur** : Guide d'utilisation du side panel
