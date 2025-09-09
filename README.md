# Carte de la Qualité de l'Air - React Open Air Map

Une application React modulaire et responsive pour afficher des appareils de mesure de la qualité de l'air sur une carte interactive Leaflet avec clustering intelligent et statistiques.

## 🚀 Fonctionnalités

### 🗺️ **Carte Interactive**

- **Carte Leaflet** pour afficher les appareils de mesure
- **Clustering intelligent** des marqueurs avec paramétrage utilisateur
- **Marqueurs colorés** selon la valeur des mesures avec affichage des valeurs
- **Contrôle du fond de carte** : Basculement entre carte standard et satellite
- **Légende dynamique** : Affichage des seuils selon le polluant sélectionné
- **Zoom et navigation** optimisés pour l'exploration des données

### 🎛️ **Contrôles Intégrés**

- **Sélection du polluant** : Un polluant actif à la fois
- **Sélection des sources** : Plusieurs sources possibles avec hiérarchie
- **Sélection du pas de temps** : Un pas de temps actif à la fois
- **Sélecteurs de période** : Périodes personnalisées pour SignalAir et MobileAir
- **Auto-refresh intelligent** : Rafraîchissement automatique adaptatif
- **Contrôle du clustering** : Paramétrage en temps réel du clustering

### 📊 **Side Panels Spécialisés**

- **AtmoRef Panel** : Graphiques historiques complets
- **AtmoMicro Panel** : Visualisation des microcapteurs avec données corrigées
- **NebuleAir Panel** : Analyse des capteurs communautaires
- **MobileAir Panels** : Sélection et visualisation des capteurs mobiles
- **Périodes personnalisées** : 3h, 24h, 7j, 1an + sélecteur de dates
- **Redimensionnement** : Normal, plein écran, masqué

### 🔄 **Gestion des Données**

- **Architecture modulaire** avec services séparés pour chaque source
- **Auto-refresh adaptatif** selon le pas de temps sélectionné
- **Indicateurs de correction** pour les données AtmoMicro
- **Gestion des statuts** : Actif, inactif, en cours de chargement
- **Cache intelligent** pour optimiser les performances
- **Gestion d'erreurs** robuste avec fallbacks

### 🎨 **Interface Utilisateur**

- **Design responsive** adapté à tous les écrans
- **Interface moderne** avec Tailwind CSS
- **Contrôles intégrés** dans l'en-tête pour maximiser l'espace carte
- **Barre de progression** et indicateurs de chargement par source
- **Animations fluides** et transitions pour une meilleure UX
- **États visuels clairs** : Sélectionné, partiellement sélectionné, non sélectionné

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
│   │   ├── ClusterControl.tsx
│   │   ├── AutoRefreshControl.tsx
│   │   └── HistoricalTimeRangeSelector.tsx
│   ├── map/           # Composants de carte et side panels
│   │   ├── AirQualityMap.tsx
│   │   ├── Legend.tsx
│   │   ├── HistoricalChart.tsx
│   │   ├── StationSidePanel.tsx      # AtmoRef
│   │   ├── MicroSidePanel.tsx        # AtmoMicro
│   │   ├── NebuleAirSidePanel.tsx    # NebuleAir
│   │   ├── MobileAirSidePanel.tsx    # MobileAir sélection
│   │   └── MobileAirSelectionPanel.tsx # MobileAir visualisation
│   └── App.tsx        # Composant principal
├── services/          # Services de données
│   ├── BaseDataService.ts
│   ├── AtmoRefService.ts
│   ├── AtmoMicroService.ts
│   ├── NebuleAirService.ts
│   ├── SignalAirService.ts
│   ├── MobileAirService.ts
│   └── DataServiceFactory.ts
├── hooks/             # Hooks personnalisés
│   └── useAirQualityData.ts
├── constants/         # Constantes
│   ├── pollutants.ts
│   ├── sources.ts
│   ├── timeSteps.ts
│   ├── mapLayers.ts
│   └── qualityColors.ts
├── types/             # Types TypeScript
│   └── index.ts
└── utils/             # Utilitaires
    └── index.ts
```

## 🛠️ Sources de données supportées

### ✅ **Sources implémentées et fonctionnelles :**

- **AtmoRef** : Stations de référence AtmoSud

  - ✅ Données en temps réel
  - ✅ Side panel avec graphiques historiques
  - ✅ Support de tous les polluants
  - ✅ Gestion des variables par station
  - ✅ Auto-refresh intelligent

- **AtmoMicro** : Microcapteurs qualifiés AtmoSud

  - ✅ Données en temps réel avec valeurs corrigées
  - ✅ Side panel avec graphiques historiques
  - ✅ Indicateurs visuels de correction
  - ✅ Support des polluants PM₁, PM₂.₅, PM₁₀, NO₂, O₃, SO₂
  - ✅ Gestion des sites actifs et inactifs

- **NebuleAir** : Capteurs communautaires NebuleAir

  - ✅ Données en temps réel
  - ✅ Side panel avec graphiques historiques
  - ✅ Support des polluants PM₁, PM₂.₅, PM₁₀, NO₂, O₃, SO₂
  - ✅ Gestion des capteurs communautaires

- **MobileAir** : Capteurs mobiles Air Carto

  - ✅ Sélection de capteurs individuels
  - ✅ Side panel de sélection des capteurs
  - ✅ Side panel de visualisation des parcours
  - ✅ Support des polluants PM₁, PM₂.₅, PM₁₀
  - ✅ Limitation à un capteur à la fois (protection API)
  - ✅ Gestion des périodes personnalisées

- **SignalAir** : Capteurs SignalAir
  - ✅ Signalements de nuisances (odeurs, bruits, brûlages, visuels)
  - ✅ Sélecteur de période personnalisé
  - ✅ Marqueurs spécifiques par type de signalement
  - ✅ Filtrage par date

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

## ⏱️ Gestion du Temps et Auto-Refresh

### Pas de temps disponibles

- **instantane** : Valeurs instantanées
- **deuxMin** : Moyenne sur 2 minutes
- **quartHeure** : Moyenne sur 15 minutes
- **heure** : Moyenne horaire (activé par défaut)
- **jour** : Moyenne journalière

### Auto-Refresh Intelligent

L'application dispose d'un système d'auto-refresh intelligent qui s'adapte automatiquement au pas de temps sélectionné :

#### **Fonctionnalités de l'Auto-Refresh**

- **Activation/Désactivation** : Toggle pour contrôler le rafraîchissement automatique
- **Adaptation au pas de temps** : Fréquence de rafraîchissement adaptée au type de données
- **Indicateur de période** : Affichage de la période de données actuellement affichée
- **Dernier rafraîchissement** : Horodatage du dernier chargement des données
- **Indicateurs visuels** : États visuels clairs (actif, inactif, en cours de chargement)

#### **Périodes de Données Affichées**

- **Données journalières** : Dernier jour plein (veille)
- **Données horaires** : Dernière heure pleine (heure précédente)
- **Données par quart d'heure** : Dernier quart d'heure terminé
- **Données instantanées** : Heure et minute actuelles
- **Données par 2 minutes** : Dernière période de 2 minutes terminée

#### **Contrôles de Période Personnalisés**

- **Périodes prédéfinies** : 3h, 24h, 7 jours, 1 an
- **Périodes personnalisées** : Sélecteur de dates pour analyses sur mesure
- **Validation des dates** : Contrôles de cohérence des périodes sélectionnées
- **Adaptation automatique** : Ajustement selon les sources de données sélectionnées

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

## 📊 Side Panels et Graphiques Historiques

### Side Panels par Source de Données

#### **AtmoRef Side Panel**

- **Affichage des informations de station** : Détails complets de la station sélectionnée
- **Graphiques historiques** : Visualisation des données sur différentes périodes
- **Sélection de polluants** : Choix des polluants à afficher dans les graphiques
- **Contrôles de période** : Sélection de la période d'analyse (3h, 24h, 7j, 1an)
- **Gestion des tailles** : Panel normal, plein écran ou masqué
- **Support complet** : Intégration complète avec les données historiques AtmoRef

#### **AtmoMicro Side Panel**

- **Graphiques historiques** : Visualisation des données des microcapteurs
- **Sélection de polluants** : Choix des polluants disponibles dans la station
- **Contrôles de période** : Sélection de la période d'analyse
- **Gestion des variables** : Affichage des variables en service par station
- **Support des données corrigées** : Indicateurs visuels pour les données corrigées

#### **NebuleAir Side Panel**

- **Graphiques historiques** : Visualisation des données des capteurs communautaires
- **Sélection de polluants** : Choix des polluants disponibles
- **Contrôles de période** : Sélection de la période d'analyse
- **Gestion des capteurs** : Affichage des informations des capteurs communautaires

#### **MobileAir Side Panels**

- **Panel de sélection** : Choix des capteurs mobiles disponibles
- **Panel de visualisation** : Affichage des parcours et données des capteurs sélectionnés
- **Sélection de période** : Périodes prédéfinies et personnalisées
- **Limitation intelligente** : Un seul capteur à la fois pour protéger l'API
- **Gestion des statuts** : Affichage du statut de connexion des capteurs

### Contrôles Communs des Side Panels

- **Sélection de polluants** : Checkboxes pour choisir les polluants à afficher
- **Périodes prédéfinies** : Boutons pour 3h, 24h, 7 jours, 1 an
- **Périodes personnalisées** : Sélecteur de dates pour les analyses sur mesure
- **Pas de temps** : Sélection de la granularité des données
- **Redimensionnement** : Boutons pour changer la taille du panel (normal, plein écran, masqué)
- **Réouverture** : Boutons flottants pour rouvrir les panels masqués

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

### 📋 Prérequis

- **Node.js** : Version 18.0.0 ou supérieure
- **npm** : Version 8.0.0 ou supérieure (inclus avec Node.js)
- **Git** : Pour cloner le repository
- **Navigateur moderne** : Chrome, Firefox, Safari, Edge (dernières versions)

### 🖥️ Installation par système d'exploitation

#### **Windows**

1. **Installer Node.js**

   - Télécharger depuis [nodejs.org](https://nodejs.org/)
   - Choisir la version LTS (Long Term Support)
   - Exécuter l'installateur et suivre les instructions
   - Vérifier l'installation :
     ```cmd
     node --version
     npm --version
     ```

2. **Installer Git (si pas déjà installé)**

   - Télécharger depuis [git-scm.com](https://git-scm.com/)
   - Exécuter l'installateur avec les options par défaut
   - Vérifier l'installation :
     ```cmd
     git --version
     ```

3. **Cloner et installer le projet**

   ```cmd
   git clone <repository-url>
   cd ReactOpenAirMap
   npm install
   ```

4. **Démarrer l'application**
   ```cmd
   npm run dev
   ```

#### **macOS**

1. **Installer Node.js avec Homebrew (recommandé)**

   ```bash
   # Installer Homebrew si pas déjà installé
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

   # Installer Node.js
   brew install node

   # Vérifier l'installation
   node --version
   npm --version
   ```

2. **Alternative : Installer Node.js directement**

   - Télécharger depuis [nodejs.org](https://nodejs.org/)
   - Choisir la version LTS
   - Exécuter le package .pkg

3. **Installer Git (si pas déjà installé)**

   ```bash
   brew install git
   # ou télécharger depuis git-scm.com
   ```

4. **Cloner et installer le projet**

   ```bash
   git clone <repository-url>
   cd ReactOpenAirMap
   npm install
   ```

5. **Démarrer l'application**
   ```bash
   npm run dev
   ```

#### **Linux (Ubuntu/Debian)**

1. **Installer Node.js**

   ```bash
   # Mettre à jour le système
   sudo apt update && sudo apt upgrade -y

   # Installer Node.js via NodeSource
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Vérifier l'installation
   node --version
   npm --version
   ```

2. **Installer Git**

   ```bash
   sudo apt install git
   ```

3. **Cloner et installer le projet**

   ```bash
   git clone <repository-url>
   cd ReactOpenAirMap
   npm install
   ```

4. **Démarrer l'application**
   ```bash
   npm run dev
   ```

#### **Linux (CentOS/RHEL/Fedora)**

1. **Installer Node.js**

   ```bash
   # Pour CentOS/RHEL
   curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
   sudo yum install -y nodejs

   # Pour Fedora
   sudo dnf install nodejs npm
   ```

2. **Installer Git**

   ```bash
   # CentOS/RHEL
   sudo yum install git

   # Fedora
   sudo dnf install git
   ```

3. **Cloner et installer le projet**

   ```bash
   git clone <repository-url>
   cd ReactOpenAirMap
   npm install
   ```

4. **Démarrer l'application**
   ```bash
   npm run dev
   ```

### 🚀 Démarrage de l'application

Une fois l'installation terminée :

1. **Démarrer le serveur de développement**

   ```bash
   npm run dev
   ```

2. **Ouvrir dans le navigateur**

   - L'application s'ouvrira automatiquement dans votre navigateur par défaut
   - Ou accédez manuellement à : `http://localhost:5173`

3. **Vérifier le fonctionnement**
   - La carte devrait s'afficher avec les contrôles dans l'en-tête
   - Les marqueurs de qualité de l'air devraient apparaître sur la carte
   - Testez les différents contrôles (polluants, sources, pas de temps)

### 🔧 Scripts disponibles

```bash
# Développement
npm run dev          # Serveur de développement avec hot-reload

# Production
npm run build        # Build de production
npm run preview      # Prévisualisation du build de production

# Qualité de code
npm run lint         # Vérification ESLint
```

### 🐛 Résolution de problèmes courants

#### **Erreur "command not found: node"**

- Vérifiez que Node.js est installé : `node --version`
- Redémarrez votre terminal après l'installation
- Sur Windows, redémarrez votre ordinateur si nécessaire

#### **Erreur "EACCES" lors de npm install**

- Sur macOS/Linux : `sudo npm install`
- Ou configurez npm pour un répertoire local : `npm config set prefix ~/.npm-global`

#### **Port 5173 déjà utilisé**

- L'application utilisera automatiquement le port suivant disponible
- Ou spécifiez un port : `npm run dev -- --port 3000`

#### **Problèmes de dépendances**

- Supprimez `node_modules` et `package-lock.json`
- Réinstallez : `npm install`
- Si problème persiste : `npm install --legacy-peer-deps`

### 📱 Accès mobile

L'application est responsive et fonctionne sur mobile :

- Accédez à `http://[votre-ip]:5173` depuis votre appareil mobile
- Remplacez `[votre-ip]` par l'adresse IP de votre ordinateur
- Les deux appareils doivent être sur le même réseau

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

## 📊 Utilisation des Side Panels

### Side Panel AtmoRef

1. Cliquez sur un marqueur AtmoRef sur la carte
2. Le side panel s'ouvre automatiquement avec les informations de la station
3. Les graphiques historiques se chargent pour la période par défaut (24h)

### Side Panel AtmoMicro

1. Cliquez sur un marqueur AtmoMicro sur la carte
2. Le side panel s'ouvre avec les données des microcapteurs
3. Sélectionnez les polluants disponibles dans la station
4. Visualisez les données corrigées et non corrigées

### Side Panel NebuleAir

1. Cliquez sur un marqueur NebuleAir sur la carte
2. Le side panel s'ouvre avec les données des capteurs communautaires
3. Analysez les tendances des capteurs citoyens

### Side Panels MobileAir

#### **Sélection des capteurs**

1. Sélectionnez "MobileAir" dans les sources de données
2. Le panel de sélection s'ouvre automatiquement
3. Choisissez un capteur dans la liste (un seul à la fois)
4. Sélectionnez la période d'analyse souhaitée
5. Cliquez sur "Charger le parcours" pour visualiser les données

#### **Visualisation des parcours**

1. Après sélection d'un capteur, le panel de visualisation s'ouvre
2. Visualisez le parcours du capteur sur la carte
3. Analysez les données en temps réel du capteur mobile
4. Changez de capteur si nécessaire

### Contrôles Communs des Side Panels

- **Sélection de polluants** : Cochez/décochez les polluants à afficher
- **Périodes** : Utilisez les boutons 3h, 24h, 7j, 1an pour changer la période
- **Périodes personnalisées** : Sélecteur de dates pour analyses sur mesure
- **Pas de temps** : Sélectionnez la granularité des données
- **Redimensionnement** : Utilisez les boutons pour changer la taille du panel
- **Réouverture** : Boutons flottants pour rouvrir les panels masqués

### Fonctionnalités Avancées

- **Données historiques** : Visualisation des tendances sur différentes périodes
- **Multi-polluants** : Affichage simultané de plusieurs polluants
- **Zoom et navigation** : Interactions avec les graphiques pour explorer les données
- **Gestion des statuts** : Indicateurs de connexion et d'activité des capteurs
- **Export** : Possibilité d'exporter les données (à implémenter)

## 🔧 Dépendances principales

### **Frontend Core**

- **React 19.1.0** : Framework principal
- **TypeScript** : Typage statique
- **Vite 7.0.0** : Build tool et serveur de développement

### **Cartographie**

- **Leaflet 1.9.4** : Bibliothèque de cartographie
- **react-leaflet 5.0.0** : Intégration React pour Leaflet
- **react-leaflet-cluster 2.1.0** : Clustering des marqueurs
- **@types/leaflet 1.9.18** : Types TypeScript pour Leaflet

### **Styling et UI**

- **Tailwind CSS 3.4.17** : Framework CSS utilitaire
- **PostCSS 8.5.6** : Processeur CSS
- **Autoprefixer 10.4.21** : Préfixes CSS automatiques

### **Graphiques et Visualisation**

- **Recharts 3.0.0** : Graphiques pour les données historiques

### **Développement et Tests**

- **ESLint 9.29.0** : Linter JavaScript/TypeScript
- **Jest 30.1.3** : Framework de tests
- **@testing-library/react 16.3.0** : Utilitaires de test React
- **@testing-library/jest-dom 6.8.0** : Matchers Jest pour DOM
- **@testing-library/user-event 14.6.1** : Simulation d'événements utilisateur
- **ts-jest 29.4.1** : Préprocesseur TypeScript pour Jest

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

### ✅ **Récemment implémentées**

- **Side Panel AtmoMicro** : Graphiques historiques pour les microcapteurs ✅
- **Side Panel NebuleAir** : Visualisation des capteurs communautaires ✅
- **Side Panels MobileAir** : Sélection et visualisation des capteurs mobiles ✅
- **Auto-refresh intelligent** : Rafraîchissement automatique adaptatif ✅
- **Gestion des périodes personnalisées** : Sélecteurs de dates avancés ✅
- **Contrôles de redimensionnement** : Panels normal, plein écran, masqué ✅

### 🚧 **À implémenter prochainement**

- **PurpleAir** : Intégration des capteurs PurpleAir
- **Sensor.Community** : Intégration des capteurs communautaires
- **Panel statistique** : Statistiques des appareils affichés sur la carte
- **Export de données** : Export CSV/JSON des données affichées

### 🔮 **Améliorations prévues**

- **Notifications** : Alertes pour les dépassements de seuils
- **Filtres avancés** : Filtrage par qualité de l'air, distance, etc.
- **Mode hors ligne** : Cache local pour consultation hors ligne
- **API publique** : Exposition des données via API REST
- **Comparaison de sources** : Analyse comparative entre différentes sources
- **Alertes personnalisées** : Configuration d'alertes par zone géographique

## 📝 Licence

Ce projet est sous licence MIT.
