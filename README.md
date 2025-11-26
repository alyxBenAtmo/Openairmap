# Carte de la Qualité de l'Air - React Open Air Map

Une application React modulaire et responsive pour afficher des appareils de mesure de la qualité de l'air sur une carte interactive Leaflet avec clustering intelligent et statistiques.

## 🚀 Installation et démarrage

### Démarrage rapide

Pour commencer rapidement, vous aurez besoin de Node.js (version 18.0.0 ou supérieure) et npm. Une fois ces prérequis installés, c'est très simple :

```bash
# Cloner le repository
git clone <repository-url>
cd ReactOpenAirMap

# Installer les dépendances
npm install

# Lancer l'application
npm run dev
```

L'application s'ouvrira automatiquement dans votre navigateur à l'adresse `http://localhost:5173`. Vous devriez voir la carte avec les contrôles dans l'en-tête et les marqueurs de qualité de l'air apparaître sur la carte.

### 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** : Version 18.0.0 ou supérieure ([télécharger ici](https://nodejs.org/))
- **npm** : Version 8.0.0 ou supérieure (inclus avec Node.js)
- **Git** : Pour cloner le repository ([télécharger ici](https://git-scm.com/))
- **Navigateur moderne** : Chrome, Firefox, Safari ou Edge (dernières versions recommandées)

### 🖥️ Installation détaillée par système

#### Windows

1. **Installer Node.js**
   - Téléchargez la version LTS depuis [nodejs.org](https://nodejs.org/)
   - Exécutez l'installateur et suivez les instructions
   - Vérifiez l'installation en ouvrant un terminal :
     ```cmd
     node --version
     npm --version
     ```

2. **Installer Git** (si ce n'est pas déjà fait)
   - Téléchargez depuis [git-scm.com](https://git-scm.com/)
   - Exécutez l'installateur avec les options par défaut
   - Vérifiez : `git --version`

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

#### macOS

1. **Installer Node.js avec Homebrew** (recommandé)
   ```bash
   # Installer Homebrew si nécessaire
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   
   # Installer Node.js
   brew install node
   
   # Vérifier
   node --version
   npm --version
   ```

   **Alternative** : Téléchargez directement depuis [nodejs.org](https://nodejs.org/) et installez le package .pkg

2. **Installer Git** (si nécessaire)
   ```bash
   brew install git
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

#### Linux (Ubuntu/Debian)

1. **Installer Node.js**
   ```bash
   # Mettre à jour le système
   sudo apt update && sudo apt upgrade -y
   
   # Installer Node.js via NodeSource
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Vérifier
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

#### Linux (CentOS/RHEL/Fedora)

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

### 🔧 Scripts disponibles

Une fois le projet installé, vous pouvez utiliser ces commandes :

```bash
# Développement
npm run dev          # Lance le serveur de développement avec hot-reload

# Production
npm run build        # Compile l'application pour la production
npm run preview      # Prévisualise le build de production

# Qualité de code
npm run lint         # Vérifie le code avec ESLint
```

### 🐛 Résolution de problèmes courants

Si vous rencontrez des problèmes, voici quelques solutions courantes :

**Erreur "command not found: node"**
- Vérifiez que Node.js est bien installé : `node --version`
- Redémarrez votre terminal après l'installation
- Sur Windows, un redémarrage complet peut être nécessaire

**Erreur "EACCES" lors de npm install**
- Sur macOS/Linux, essayez : `sudo npm install`
- Ou mieux, configurez npm pour utiliser un répertoire local :
  ```bash
  npm config set prefix ~/.npm-global
  ```

**Port 5173 déjà utilisé**
- L'application utilisera automatiquement le port suivant disponible
- Ou spécifiez un port manuellement : `npm run dev -- --port 3000`

**Problèmes de dépendances**
- Supprimez `node_modules` et `package-lock.json`
- Réinstallez : `npm install`
- Si le problème persiste : `npm install --legacy-peer-deps`

## 🚀 Fonctionnalités

Cette application vous permet de visualiser et analyser les données de qualité de l'air provenant de multiples sources. Voici ce qu'elle offre :

### 🗺️ **Carte Interactive**

- **Carte Leaflet** pour afficher tous les appareils de mesure sur une carte interactive
- **Clustering intelligent** des marqueurs pour améliorer la lisibilité (vous pouvez le désactiver si besoin)
- **Marqueurs colorés** qui changent selon la valeur des mesures, avec les valeurs affichées directement
- **Contrôle du fond de carte** : Basculez facilement entre la carte standard et la vue satellite
- **Légende dynamique** : Les seuils s'adaptent automatiquement au polluant que vous sélectionnez

### 🎛️ **Contrôles Intégrés**

Tous les contrôles sont accessibles depuis l'en-tête de l'application :

- **Sélection du polluant** : Choisissez quel polluant afficher sur la carte (un seul à la fois)
- **Sélection des sources** : Activez plusieurs sources de données simultanément, chacune avec ses propres marqueurs
- **Sélection du pas de temps** : Définissez la granularité des données (instantané, 2 min, 15 min, heure, jour)
- **Sélecteurs de période** : Pour SignalAir et MobileAir, vous pouvez définir des périodes personnalisées
- **Auto-refresh intelligent** : Les données se rafraîchissent automatiquement selon le pas de temps sélectionné

### 📊 **Side Panels Spécialisés**

Chaque source de données dispose de son propre panneau latéral avec des fonctionnalités adaptées :

- **MobileAir Panels** : Sélectionnez un capteur mobile et visualisez ses différentes sessions de mesure
- **Périodes personnalisées** : Utilisez les périodes prédéfinies (3h, 24h, 7j, 30j) ou créez vos propres plages de dates
- **Redimensionnement flexible** : Ajustez la taille des panneaux (normal, plein écran, ou masqué)
- **🆕 Intercomparaison Multi-Sources** : Comparez jusqu'à 5 stations (Station de référence AtmoSud/Microcapteur qualifié AtmoSud) sur un même graphique
  - L'application détecte automatiquement les polluants communs à toutes les stations
  - Gère intelligemment les résolutions temporelles différentes (notamment en mode Scan)
  - Pour plus de détails techniques, consultez : `docs/features/INTERCOMPARAISON_TECHNIQUE.md`

### 🔄 **Gestion des Données**

- **Architecture modulaire** avec services séparés pour chaque source
- **Auto-refresh adaptatif** selon le pas de temps sélectionné et les sources actives
- **Indicateurs de correction** pour les données AtmoMicro
- **Gestion des statuts de chargement** : Actif, inactif, en cours de chargement
- **Gestion d'erreurs** robuste avec fallbacks

### 🎨 **Interface Utilisateur**

- **Design responsive** adapté à tous les écrans
- **Interface moderne** avec Tailwind CSS
- **Contrôles intégrés** dans l'en-tête pour maximiser l'espace carte
- **Barre de progression** et indicateurs de chargement par source
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
│   │   ├── ComparisonSidePanel.tsx    # Panneau de comparaison
│   │   ├── StationSidePanel.tsx      # AtmoRef
│   │   ├── MicroSidePanel.tsx        # AtmoMicro
│   │   ├── NebuleAirSidePanel.tsx    # NebuleAir
│   │   ├── PurpleAirSidePanel.tsx    # PurpleAir
│   │   ├── SensorCommunitySidePanel.tsx # SensorCommunity
│   │   ├── MobileAirSidePanel.tsx    # MobileAir sélection
│   │   ├── MobileAirSelectionPanel.tsx # MobileAir visualisation
│   │   ├── MobileAirDetailPanel.tsx  # MobileAir détails
│   │   ├── MobileAirRoutes.tsx       # MobileAir routes
│   │   ├── SignalAirDetailPanel.tsx # SignalAir détails
│   │   ├── SignalAirSelectionPanel.tsx # SignalAir sélection
│   │   ├── CustomSpiderfiedMarkers.tsx # Marqueurs spiderfiés
│   │   ├── SpiderfiedMarkers.tsx     # Marqueurs spiderfiés (legacy)
│   │   ├── SearchControlDemo.tsx     # Contrôle de recherche
│   │   ├── hooks/                    # Hooks spécifiques à la carte
│   │   │   ├── useMapView.ts         # Gestion de la vue (zoom, centre, spiderfy)
│   │   │   ├── useMapLayers.ts       # Gestion des couches (base, modélisation, vent)
│   │   │   ├── useWildfireLayer.ts   # Gestion de la couche feux de forêt
│   │   │   ├── useMapAttribution.ts  # Gestion de l'attribution Leaflet
│   │   │   ├── useSidePanels.ts      # Gestion des panneaux latéraux
│   │   │   ├── useSignalAir.ts       # Gestion de SignalAir
│   │   │   └── useMobileAir.ts       # Gestion de MobileAir
│   │   ├── utils/                    # Utilitaires pour la carte
│   │   │   ├── mapIconUtils.ts       # Création d'icônes de marqueurs
│   │   │   └── mapMarkerUtils.ts     # Utilitaires pour les marqueurs
│   │   └── handlers/                 # Handlers pour la carte
│   │       └── comparisonHandlers.ts # Handlers pour le mode comparaison
│   └── App.tsx        # Composant principal
├── services/          # Services de données
│   ├── BaseDataService.ts
│   ├── AtmoRefService.ts
│   ├── AtmoMicroService.ts
│   ├── NebuleAirService.ts
│   ├── SignalAirService.ts
│   ├── MobileAirService.ts
│   ├── PurpleAirService.ts
│   ├── SensorCommunityService.ts
│   ├── FeuxDeForetService.ts
│   ├── ModelingLayerService.ts
│   └── DataServiceFactory.ts
├── hooks/             # Hooks personnalisés globaux
│   ├── useAirQualityData.ts
│   ├── useTemporalVisualization.ts
│   ├── useDomainConfig.ts
│   ├── useCustomSpiderfier.ts
│   ├── useSpiderfier.ts
│   └── useToast.ts
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

L'application intègre plusieurs sources de données pour vous offrir une vue complète de la qualité de l'air. Voici les sources actuellement disponibles :

### ✅ **Sources implémentées et fonctionnelles :**

- **AtmoRef** : Stations de référence AtmoSud

  - ✅ Marqueurs colorés selon les seuils de qualité de l'air pour le polluant sélectionné
  - ✅ Panneau latéral avec graphiques historiques détaillés
  - ✅ Support de tous les polluants disponibles dans les stations AtmoSud
  - ✅ Gestion intelligente des variables par station
  - ✅ Rafraîchissement automatique adaptatif

- **AtmoMicro** : Microcapteurs qualifiés AtmoSud

  - ✅ Marqueurs colorés avec distinction visuelle entre données corrigées et non corrigées
  - ✅ Panneau latéral avec graphiques historiques
  - ✅ Support des polluants PM₁, PM₂.₅, PM₁₀, NO₂ (selon ce que mesurent les microcapteurs)
  - ✅ Affichage clair des sites actifs et inactifs

- **NebuleAir** : Capteurs communautaires NebuleAir Air Carto

  - ✅ Marqueurs colorés selon les seuils de qualité de l'air
  - ✅ Panneau latéral avec graphiques historiques
  - ✅ Support des polluants PM₁, PM₂.₅, PM₁₀, NO₂
  - ✅ Indication du statut des capteurs (actifs/inactifs)

- **MobileAir** : Capteurs communautaires mobileAir Air Carto

  - ✅ Sélection d'un capteur mobile à la fois
  - ✅ Panneau de sélection des capteurs disponibles
  - ✅ Panneau de visualisation des parcours et données
  - ✅ Support des polluants PM₁, PM₂.₅, PM₁₀
  - ✅ Limitation à un capteur à la fois pour protéger l'API
  - ✅ Périodes personnalisées pour vos analyses

- **PurpleAir** : Capteurs communautaires PurpleAir

  - ✅ Marqueurs colorés selon les seuils de qualité de l'air
  - ✅ Popup avec les mesures instantanées et lien vers le site PurpleAir pour les données historiques
  - ✅ Support des polluants PM₁, PM₂.₅, PM₁₀
  - ✅ Support des pas de temps scan et <= 2min

- **SensorCommunity** : Capteurs communautaires SensorCommunity

  - ✅ Marqueurs colorés selon les seuils de qualité de l'air
  - ✅ Popup avec intégration Grafana pour visualiser les dernières mesures
  - ✅ Support des polluants PM₁, PM₂.₅, PM₁₀
  - ✅ Support des pas de temps instantané et <= 2min

- **SignalAir** : Signalements citoyens SignalAir
  - ✅ Affichage des signalements sur la carte (odeurs, bruits, brûlages, visuels)
  - ✅ Sélecteur de période personnalisé pour filtrer les signalements
  - ✅ Marqueurs spécifiques et reconnaissables par type de signalement

## 🎨 Polluants supportés par l'application

- **PM₁** : Particules fines ≤ 1 µm
- **PM₂.₅** : Particules fines ≤ 2.5 µm (activé par défaut)
- **PM₁₀** : Particules fines ≤ 10 µm
- **NO₂** : Dioxyde d'azote
- **O₃** : Ozone (Disponible uniquement pour les stations de référence atmoSud)
- **SO₂** : Dioxyde de soufre (Disponible uniquement pour les stations de référence atmoSud)

### Seuils de qualité de l'air

Chaque polluant dispose de 6 niveaux de qualité avec des seuils spécifiques :

- **Bon**
- **Moyen**
- **Dégradé**
- **Mauvais**
- **Très mauvais**
- **Extrêmement mauvais**

## ⏱️ Gestion du Temps et Auto-Refresh

### Pas de temps disponibles

- **instantane** : Pas de temps le plus fin de l'appareil
- **<=2min** : Moyenne sur 2 minutes et moins
- **quartHeure** : Moyenne sur 15 minutes
- **heure** : Moyenne horaire (activé par défaut)
- **jour** : Moyenne journalière

### Auto-Refresh Intelligent

L'application dispose d'un système de rafraîchissement automatique qui s'adapte intelligemment à vos besoins :

#### **Fonctionnalités de l'Auto-Refresh**

- **Activation/Désactivation** : Activez ou désactivez le rafraîchissement automatique selon vos préférences
- **Adaptation automatique** : La fréquence de rafraîchissement s'ajuste selon le pas de temps sélectionné et les sources actives
- **Indicateur de période** : Vous voyez toujours quelle période de données est actuellement affichée

#### **Périodes de Données Affichées**

- **Données instantanées** : Dernière donnée non aggrégé renvoyé par l'appareil
- **Données par 2 minutes** : Dernière période de 2 minutes terminée
- **Données par quart d'heure** : Dernier quart d'heure plein
- **Données horaires** : Dernière heure pleine (heure précédente)
- **Données journalières** : Dernier jour plein (veille)

#### **Contrôles de Période pour la consultation des données historiques d'un appareil de mesure**

- **Périodes prédéfinies** : 3h, 24h, 7 jours, 1 an
- **Périodes personnalisées** : Sélecteur de dates pour analyses sur mesure
- **Validation des dates** : Contrôles de cohérence des périodes sélectionnées
- **Limitation** : Limitation de la plage historique selon le pas de temps selectionné (scan : 2 mois max, 15 min : 6 mois max)

## 🗺️ Fonds de carte

- **Carte standard** : Fond CARTO clair avec Stadia maps
- **Satellite IGN** : Imagerie satellite IGN

## 🔗 Clustering des marqueurs

### Fonctionnalités de clustering

- **Clustering automatique** : Regroupement intelligent des marqueurs proches
- **Performance optimisée** : Amélioration des performances avec de nombreux marqueurs
- **Activation/Désactivation** : Activation/Désactivation du clustering depuis le menu de la carte (desactivé par defaut)
- **Spiderfy au zoom maximum** : Éclatement des clusters au zoom maximum
- **Affichage de la zone** : Visualisation de la zone de cluster au survol
- **Zoom sur la zone** : Zoom automatique sur la zone du cluster au clic
- **Animations** : Transitions fluides pour le clustering
- **Animations d'ajout** : Effets visuels lors de l'ajout de marqueurs

## 📊 Side Panels et Graphiques Historiques

### Side Panels par Source de Données

#### **AtmoRef Side Panel**

- **Affichage des informations de station** : Détails complets de la station sélectionnée (à venir)
- **Graphiques historiques** : Visualisation des données sur différentes périodes
- **Sélection de polluants** : Choix des polluants à afficher dans les graphiques
- **Contrôles de période** : Sélection de la période d'analyse (3h, 24h, 7j, 30j)
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
- **Gestion des capteurs** : Affichage des informations des capteurs communautaires (à venir)

#### **MobileAir Side Panels**

- **Gestion des statuts** : Affichage du statut de connexion des capteurs
- **Panel de sélection** : Choix des capteurs mobiles disponibles
- **Limitation** : Un seul capteur à la fois pour protéger l'API
- **Sélection de période** : Périodes prédéfinies et personnalisées
- **Panel de visualisation** : Affichage des parcours et données des capteurs sélectionnés

### Contrôles Communs des Side Panels

- **Sélection de polluants** : Checkboxes pour choisir les polluants à afficher
- **Périodes personnalisées** : Sélecteur de dates pour les analyses sur mesure
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
- **Indicateurs d'information** : Affichage de la période affiché sur la carte actuellement + indicateur auto-refresh activé/    desactivé
- **Modélisation**: Menu déroulant pour le choix de la carte de modélisation à afficher sur la carte
- **Mode historique**: Bouton pour basculer entre mode historique et mode actuel
- **Barre de recherche**: Permet de rechercher directement dans la Banque d'Adresse National ou bien un appareil de mesure  

### Contrôles du mode historique

- **Sélecteur de dates** : Sélecteur de dates pour les analyses sur mesure
- **Bouton de chargement** : Bouton pour charger les données historiques
- **Bouton de désactivation** : Bouton pour désactiver le mode historique
- **Bouton de réduction** : Bouton pour réduire le panel de contrôle
- **Bouton de fermeture** : Bouton pour fermer le panel de contrôle
- **Panel de contrôle** : Panel de contrôle pour paramétrer le mode historique
  - **Timeline** : Timeline pour visualiser les données historiques
  - **Bouton de contrôle** : Bouton pour contrôler la lecture de la timeline
- **Bouton de réouverture** : Bouton pour réouvrir le panel masqué

### Contrôles de carte

- **Contrôle du clustering** : Icône en bas à gauche pour activer/desactiver le clustering
- **Contrôle fond de carte** : Icône en bas à gauche pour basculer entre fond de carte standard et fond de carte satellite
- **Légende** : Affichage des seuils en bas au centre avec tooltips au hover
- **Informations de la carte** : Compteur de nombre d'appareils et de signalements affichés sur la carte en bas à droite
- **Indicateur de chargement** : Affichage discret des sources en cours de chargement en haut à droite

### Marqueurs et affichage

- **Marqueurs colorés** : Couleurs selon les seuils de qualité de l'air
- **Formes des marqueurs** : Différentes formes selon la source de donnée
- **Affichage des valeurs** : Valeurs numériques directement sur les marqueurs
- **Indicateurs de correction** : Badge bleu pour les données des microcapteurs qualifiés AtmoSud corrigées
- **Marqueurs SignalAir** : Icônes spécifiques par type de signalement
- **Animations de chargement** : Effets visuels de transparance pendant le chargement des données

### Design et UX

- **Interface compacte** : Contrôles intégrés dans l'en-tête pour maximiser l'espace de la carte
- **Menus déroulants horizontaux** : Labels et boutons alignés côte à côte
- **Sélection multiple intelligente** : Groupes de sources avec états partiels
- **États visuels clairs** : Sélectionné, partiellement sélectionné, non sélectionné
- **Responsive design** : Adapté à tous les écrans
- **Indicateurs de chargement** : Affichage discret des états de chargement
- **Clustering** : Amélioration de la lisibilité avec de nombreux marqueurs

## 📊 Utilisation des Side Panels

Les panneaux latéraux vous permettent d'explorer en détail les données de chaque source. Voici comment les utiliser :

### Side Panel station de référence AtmoSud

1. Cliquez sur un marqueur AtmoRef sur la carte
2. Le panneau latéral s'ouvre automatiquement (les informations détaillées de la station arriveront bientôt)
3. Les graphiques historiques se chargent par défaut au pas de temps horaire sur une période de 24h
4. Sélectionnez les polluants que vous souhaitez visualiser parmi ceux disponibles pour la station
5. Ajustez le pas de temps et la période selon vos besoins 

### Side Panel microcapteur qualifié AtmoSud

1. Cliquez sur un marqueur AtmoMicro sur la carte
2. Les graphiques historiques se chargent par défaut au pas de temps horaire sur une période de 24h
3. Choisissez les polluants que vous voulez analyser parmi ceux mesurés par le microcapteur
4. Personnalisez le pas de temps et la période d'analyses

### Side Panel NebuleAir AirCarto

1. Cliquez sur un marqueur NebuleAir sur la carte
2. Les graphiques historiques se chargent par défaut au pas de temps quart-horaire sur une période de 24h
3. Sélectionnez les polluants à afficher parmi ceux disponibles
4. Adaptez le pas de temps et la période à votre analyse

### 🆕 Mode Intercomparaison (Station de référence / Microcapteur qualifié AtmoSud)

Le mode intercomparaison est une fonctionnalité puissante qui vous permet de **comparer jusqu'à 5 stations** (Station de référence et/ou Microcapteur qualifié AtmoSud) sur un même graphique.

#### **Activation du mode comparaison**

1. Cliquez sur une station ou un microcapteur sur la carte
2. Dans le panneau latéral, cliquez sur l'**Activer comparaison** (en haut à droite)
3. Le mode comparaison s'active et vous pouvez ensuite soit ajouter d'autres appareils de mesure en cliquant dessus sur la carte, ou bien en utilisant la barre de recherche

#### **Ajout de stations à la comparaison**

1. Une fois en mode comparaison, **cliquez sur d'autres marqueurs** AtmoRef ou AtmoMicro sur la carte
2. Chaque clic ajoute la station à la comparaison (maximum 5 stations)
3. Les stations sélectionnées apparaissent dans la liste "Stations sélectionnées"
4. Vous pouvez retirer une station de la comparaison en cliquant sur le bouton **×** à côté de son nom

#### **Utilisation du graphique de comparaison**

1. **Sélection du polluant** : Le menu déroulant affiche uniquement les polluants disponibles dans **toutes** les stations sélectionnées

   - Par exemple : Si vous comparez 3 stations qui mesurent PM2.5 et PM10, seuls ces 2 polluants seront disponibles dans le menu
   - Sélectionnez un polluant à comparer (un seul à la fois)

2. **Graphique** : Chaque station est représentée par une courbe de couleur différente

   - Couleurs utilisées : Bleu, Rouge, Vert, Orange, Violet
   - La légende affiche : "Nom de la station - Polluant"
   - Le type de station est indiqué : "Station de référence" (AtmoRef) ou "Microcapteur" (AtmoMicro)

3. **Contrôles temporels** :
   - **Période** : Choisissez parmi 3h, 24h, 7j, 30j, ou créez une période personnalisée
   - **Pas de temps** : Scan, 15min, 1h, 1j

#### **Mode Scan - Résolutions variables**

⚠️ **Point important** : En mode Scan, les résolutions temporelles peuvent différer selon le type de station :

- **AtmoRef** : Mesure toutes les **15 minutes** (résolution fixe)
- **AtmoMicro** : Mesure toutes les **1 à 15 minutes** selon le modèle de capteur

#### **Limitations**

- **Maximum 5 stations** peuvent être comparées simultanément
- **Un seul polluant** est affiché à la fois
- **Sources supportées** : Seules les stations de référence AtmoSud et les microcapteurs AtmoSud peuvent être comparées

#### **Désactivation du mode comparaison**

1. Cliquez sur **"Désactiver comparaison"** dans le panneau
2. Vous revenez automatiquement au mode normal

📚 **Documentation technique complète** : `docs/features/INTERCOMPARAISON_TECHNIQUE.md`

### Side Panels MobileAir

Les capteurs mobiles fonctionnent un peu différemment. Voici comment les utiliser :

#### **Sélection des capteurs**

1. Activez "MobileAir" dans les sources de données
2. Le panneau de sélection s'ouvre automatiquement
3. Choisissez un capteur dans la liste (un seul à la fois pour protéger l'API)
4. Sélectionnez la période d'analyse qui vous intéresse
5. Cliquez sur "Charger le parcours" pour visualiser les données du capteur

#### **Visualisation des parcours**

1. Après avoir sélectionné un capteur, le panneau de visualisation s'ouvre
2. Vous pouvez voir le parcours du capteur directement sur la carte
3. Analysez les données en temps réel du capteur mobile
4. N'hésitez pas à changer de capteur si vous voulez explorer d'autres données

### Contrôles Communs des Side Panels

Tous les panneaux latéraux partagent des fonctionnalités communes :

- **Sélection de polluants** : Cochez ou décochez les polluants que vous souhaitez afficher
- **Périodes prédéfinies** : Utilisez les boutons rapides 3h, 24h, 7j, 30j pour changer rapidement la période
- **Périodes personnalisées** : Utilisez le sélecteur de dates pour créer vos propres plages d'analyse
- **Pas de temps** : Choisissez la granularité des données selon vos besoins
- **Redimensionnement** : Ajustez la taille du panneau (normal, plein écran, ou masqué)
- **Réouverture** : Si vous avez masqué un panneau, des boutons flottants vous permettent de le rouvrir facilement

### Fonctionnalités Avancées

- **Données historiques** : Visualisation des tendances sur différentes périodes
- **Multi-polluants** : Affichage simultané de plusieurs polluants
- **Mode comparaison** : Affichage simultané de plusieurs stations
- **Zoom et navigation** : Interactions avec les graphiques pour explorer les données
- **Export** : Possibilité d'exporter les données en csv/png

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
- **Tests** : (à venir)
