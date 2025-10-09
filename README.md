# Carte de la Qualité de l'Air - React Open Air Map

Une application React modulaire et responsive pour afficher des appareils de mesure de la qualité de l'air sur une carte interactive Leaflet avec clustering intelligent et statistiques.

## 🚀 Fonctionnalités

### 🗺️ **Carte Interactive**

- **Carte Leaflet** pour afficher les appareils de mesure
- **Clustering intelligent** des marqueurs avec possibilé de le desactiver
- **Marqueurs colorés** selon la valeur des mesures avec affichage des valeurs
- **Contrôle du fond de carte** : Basculement entre carte standard et satellite
- **Légende dynamique** : Affichage des seuils selon le polluant sélectionné

### 🎛️ **Contrôles Intégrés**

- **Sélection du polluant** : Un polluant actif à la fois sur la carte
- **Sélection des sources** : Plusieurs sources possibles différenciées par différents marqueurs
- **Sélection du pas de temps** : Un pas de temps actif à la fois
- **Sélecteurs de période** : Périodes personnalisées pour SignalAir et MobileAir
- **Auto-refresh intelligent** : Rafraîchissement automatique adaptatif

### 📊 **Side Panels Spécialisés**

- **MobileAir Panels** : Sélection d'un capteur et visualisation des différentes sessions de mesure de capteurs mobiles
- **Périodes personnalisées** : 3h, 24h, 7j, 1an + sélecteur de dates personnalisées
- **Redimensionnement** : Normal, plein écran, masqué
- **🆕 Intercomparaison Multi-Sources** : Comparaison de jusqu'à 5 stations (AtmoRef/AtmoMicro) sur un même graphique
  - Détection automatique des polluants communs
  - Gestion des résolutions temporelles différentes (mode Scan)
  - Documentation technique : `docs/features/INTERCOMPARAISON_TECHNIQUE.md`

### 🔄 **Gestion des Données**

- **Architecture modulaire** avec services séparés pour chaque source
- **Auto-refresh adaptatif** selon le pas de temps sélectionné et les sources actives
- **Indicateurs de correction** pour les données AtmoMicro
- **Gestion des statuts** : Actif, inactif, en cours de chargement
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
│   ├── PurpleAirService.ts
│   ├── SensorCommunityService.ts
│   └── DataServiceFactory.ts
├── hooks/             # Hooks personnalisés
│   └── useAirQualityData.ts
│   ├── useTemporalVisualization.ts
│   └── useDomainConfig.ts
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

  - ✅ Affichage des valeurs dans un marqueurs colorés selon le dépassement de seuil du polluant selectionné
  - ✅ Side panel avec graphiques historiques
  - ✅ Support de tous les polluants (selon les polluants supportés par les stations AtmoSud)
  - ✅ Gestion des variables par station
  - ✅ Auto-refresh intelligent

- **AtmoMicro** : Microcapteurs qualifiés AtmoSud

  - ✅ Affichage des valeurs dans un marqueurs colorés selon le dépassement de seuil du polluant selectionné avec différenciation des données corrigées et non corrigées
  - ✅ Side panel avec graphiques historiques
  - ✅ Support des polluants PM₁, PM₂.₅, PM₁₀, NO₂ (selon les polluants supportés par les microcapteurs AtmoSud)
  - ✅ Gestion des sites actifs et inactifs

- **NebuleAir** : Capteurs communautaires NebuleAir Air Carto

  - ✅ Affichage des valeurs dans un marqueurs colorés selon le dépassement de seuil du polluant selectionné
  - ✅ Side panel avec graphiques historiques
  - ✅ Support des polluants PM₁, PM₂.₅, PM₁₀, NO₂ (selon les polluants supportés par les capteurs communautaires NebuleAir Air Carto)
  - ✅ Gestion des site actifs/inactifs

- **MobileAir** : Capteurs communautaires mobileAir Air Carto

  - ✅ Sélection de capteurs individuels
  - ✅ Side panel de sélection des capteurs
  - ✅ Side panel de visualisation des parcours
  - ✅ Support des polluants PM₁, PM₂.₅, PM₁₀
  - ✅ Limitation à un capteur à la fois (protection API)
  - ✅ Gestion des périodes personnalisées

- **PurpleAir** : Capteurs communautaires

  - ✅ Affichage des valeurs dans un marqueurs colorés selon le dépassement de seuil du polluant selectionné
  - ✅ Popup affichant les mesures instantanés du capteur cliqué et lien vers le site purpleAir pour consultation des données historiques
  - ✅ Support des polluants PM₁, PM₂.₅, PM₁₀
  - ✅ Support des pas de temps scan et <= 2min

- **SensorCommunity** : Capteurs communautaires SensorCommunity

  - ✅ Affichage des valeurs dans un marqueurs colorés selon le dépassement de seuil du polluant selectionné
  - ✅ Popup affichant le grafana des dernières mesures du capteur cliqué
  - ✅ Support des polluants PM₁, PM₂.₅, PM₁₀
  - ✅ Support des pas de temps instantané et <= 2min

- **SignalAir** : Signalement citoyenSignalAir
  - ✅ Affichage des signalements sur la carte (odeurs, bruits, brûlages, visuels)
  - ✅ Sélecteur de période personnalisé
  - ✅ Marqueurs spécifiques par type de signalement

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

L'application dispose d'un système d'auto-refresh intelligent qui s'adapte automatiquement au pas de temps sélectionné :

#### **Fonctionnalités de l'Auto-Refresh**

- **Activation/Désactivation** : Toggle pour contrôler le rafraîchissement automatique
- **Adaptation** : Fréquence de rafraîchissement adaptée au pas de temps et aux sources actives
- **Indicateur de période** : Affichage de la période de données actuellement affichée
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

## 🗺️ Fonds de carte

- **Carte standard** : Fond CARTO clair avec OpenStreetMap
- **Satellite IGN** : Imagerie satellite IGN

## 🔗 Clustering des marqueurs

### Fonctionnalités de clustering

- **Clustering automatique** : Regroupement intelligent des marqueurs proches
- **Performance optimisée** : Amélioration des performances avec de nombreux marqueurs
- **Activation/Désactivation** : Activation/Désactivation du clustering depuis le menu de la carte

### Options de clustering configurables

- **Activation/Désactivation** : Basculement du clustering depuis le menu de la carte
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
  - **Période SignalAir** : Sélecteur de dates (visible si SignalAir est actif)
- **Indicateurs d'information** : Affichage des sélections actuelles séparés par une bordure verticale
- **Barre de progression** : Indicateur de chargement discret en bas de l'en-tête
- **Mode historique** : Bouton pour basculer entre mode historique et mode actuel

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

- **Contrôle du clustering** : Icône en bas à gauche pour paramétrer le clustering
- **Contrôle fond de carte** : Icône en bas à gauche pour basculer entre fond de carte standard et fond de carte satellite
- **Légende** : Affichage des seuils en bas au centre avec tooltips au hover
- **Informations de la carte** : Compteur de nombre d'appareils et de signalements affichés sur la carte en bas à droite
- **Indicateur de chargement** : Affichage discret des sources en cours de chargement en haut à droite

### Marqueurs et affichage

- **Marqueurs colorés** : Couleurs selon les seuils de qualité de l'air
- **Formes des marqueurs** : Différentes formes selon le type de source de données
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

## 📊 Utilisation des Side Panels

### Side Panel AtmoRef

1. Cliquez sur un marqueur AtmoRef sur la carte
2. Le side panel s'ouvre automatiquement avec les informations de la station (à venir)
3. Les graphiques historiques se chargent au pas de temps horaire sur une période de 24h par défaut
4. Sélectionnez les polluants disponibles pour la station
5. Choix du pas de temps et de la période parmi les périodes prédéfinies ou personnalisées

### Side Panel AtmoMicro

1. Cliquez sur un marqueur AtmoMicro sur la carte
2. Les graphiques historiques se chargent au pas de temps horaire sur une période de 24h par défaut
3. Sélectionnez les polluants disponibles pour le microcapteur
4. Choix du pas de temps et de la période parmi les périodes prédéfinies ou personnalisées

### Side Panel NebuleAir

1. Cliquez sur un marqueur NebuleAir sur la carte
2. Les graphiques historiques se chargent au pas de temps quart-horaire sur une période de 24h par défaut
3. Sélectionnez les polluants disponibles pour le microcapteur
4. Choix du pas de temps et de la période parmi les périodes prédéfinies ou personnalisées

### 🆕 Mode Intercomparaison (AtmoRef / AtmoMicro)

Le mode intercomparaison permet de **comparer jusqu'à 5 stations** (AtmoRef et/ou AtmoMicro) sur un même graphique.

#### **Activation du mode comparaison**

1. Cliquez sur une station AtmoRef ou AtmoMicro
2. Dans le side panel, cliquez sur l'**icône de graphique** (en haut à droite)
3. Le mode comparaison s'active et la station actuelle devient la première station comparée

#### **Ajout de stations à la comparaison**

1. Une fois en mode comparaison, **cliquez sur d'autres marqueurs** AtmoRef ou AtmoMicro
2. Chaque clic ajoute la station à la comparaison (maximum 5)
3. Les stations s'affichent dans la liste "Stations sélectionnées"
4. Vous pouvez supprimer une station avec le bouton **×**

#### **Utilisation du graphique de comparaison**

1. **Sélection du polluant** : Le dropdown affiche uniquement les polluants disponibles dans **toutes** les stations

   - Exemple : Si vous comparez 3 stations qui mesurent PM2.5 et PM10, seuls ces 2 polluants seront disponibles
   - Sélectionnez un polluant à comparer (un seul à la fois)

2. **Graphique** : Affiche une courbe par station avec des couleurs différentes

   - Bleu, Rouge, Vert, Orange, Violet, Rose
   - Légende : "Nom de la station - Polluant"
   - Type de station : "Station de référence" (AtmoRef) ou "Microcapteur" (AtmoMicro)

3. **Contrôles temporels** :
   - **Période** : 3h, 24h, 7j, 1an, ou personnalisée
   - **Pas de temps** : Scan, 15min, 1h, 1j

#### **Mode Scan - Résolutions variables**

⚠️ **Important** : En mode Scan, les résolutions temporelles diffèrent :

- **AtmoRef** : Mesure toutes les **15 minutes** (résolution fixe)
- **AtmoMicro** : Mesure toutes les **1 à 5 minutes** selon le modèle de capteur

💡 Un bandeau informatif bleu s'affiche automatiquement en mode Scan pour expliquer cette différence.

#### **Limitations**

- **Maximum 5 stations** comparables simultanément
- **Un seul polluant** affiché à la fois (celui disponible dans toutes les stations)
- **Sources supportées** : AtmoRef et AtmoMicro uniquement

#### **Désactivation du mode comparaison**

1. Cliquez sur **"Désactiver comparaison"** dans le panel
2. Ou fermez le panel de comparaison
3. Le mode normal se réactive

📚 **Documentation technique complète** : `docs/features/INTERCOMPARAISON_TECHNIQUE.md`

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
- **Mode comparaison** : Affichage simultané de plusieurs stations
- **Zoom et navigation** : Interactions avec les graphiques pour explorer les données
- **Export** : Possibilité d'exporter les données (à venir)

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
