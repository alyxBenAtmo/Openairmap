# Fonctionnalité de Recherche Avancée

## Description
Une fonctionnalité de recherche avancée a été ajoutée à la carte de qualité de l'air, permettant de rechercher à la fois des adresses et des capteurs de mesure. Cette fonctionnalité combine la recherche d'adresses via l'API BAN (Base Adresse Nationale) et la recherche de capteurs par nom parmi ceux affichés sur la carte.

## Fonctionnalités

### Recherche combinée
- **Recherche de capteurs** : Recherche par nom parmi tous les capteurs affichés sur la carte (insensible à la casse, recherche partielle)
- **Recherche d'adresses** : Utilise l'API BAN (Base Adresse Nationale) pour une précision maximale
- **Autocomplétion en temps réel** : Suggestions automatiques après 2-3 caractères tapés
- **Résultats combinés** : Affiche d'abord les capteurs correspondants, puis les adresses (jusqu'à 10 résultats au total)

### Affichage des capteurs
- **Marqueurs visuels** : Affiche le marqueur correspondant à chaque capteur (même style que sur la carte)
- **Valeurs mesurées** : Affiche la valeur actuelle directement dans le marqueur
- **Libellés lisibles** : Affiche des noms compréhensibles au lieu des codes sources :
- `atmoRef` → "Station de référence AtmoSud"
- `atmoMicro` → "Microcapteur qualifié AtmoSud"
- `nebuleair` → "AirCarto"
- `sensorCommunity` → "Sensor.Community"
- `purpleair` → "PurpleAir"
- `mobileair` → "MobileAir"
- `signalair` → "SignalAir"
- **Indicateurs visuels** : Badge de vérification pour les valeurs corrigées (AtmoMicro)

### Recherche d'adresses
- **Géocodage automatique** : Centrage automatique de la carte sur l'adresse trouvée
- **Zoom adaptatif intelligent** : Le niveau de zoom s'adapte automatiquement au type de résultat :
- **Adresse précise** (avec numéro) → Zoom 18 (très détaillé)
- **Rue** → Zoom 16 (détaillé)
- **Quartier/Arrondissement** → Zoom 14 (vue d'ensemble du quartier)
- **Commune/Ville** → Zoom 12 (vue de la ville)
- **Département** → Zoom 10 (vue département)
- **Région/Pays** → Zoom 6 (vue large)

### Sélection de capteurs
Lorsqu'un capteur est sélectionné dans l'autocomplétion :
1. **Centrage automatique** : La carte se centre sur le capteur avec un zoom de niveau 16
2. **Sélection du capteur** : Le capteur est automatiquement sélectionné
3. **Ouverture du sidepanel** : Le panneau latéral s'ouvre automatiquement pour afficher les détails du capteur

### Navigation clavier
- **Flèches haut/bas** : Naviguer dans les résultats
- **Entrée** : Sélectionner le résultat actuel
- **Échap** : Fermer la liste déroulante et réinitialiser la recherche

### Interface utilisateur
- **Position** : Haut à droite de la carte
- **Style cohérent** : S'intègre parfaitement avec l'interface existante
- **Placeholder** : "Rechercher une adresse ou une station/capteur..."
- **Recherche en temps réel** : Déclenche la recherche après 2-3 caractères tapés (debounce de 300ms)
- **Gestion du focus** : Ferme la liste déroulante au clic en dehors

## Utilisation

### Recherche d'un capteur
1. Cliquez dans la barre de recherche en haut à droite de la carte
2. Tapez le nom du capteur (ex: "Marseille", "Aix", "Station Centre")
3. Sélectionnez le capteur dans la liste déroulante
4. La carte se centre automatiquement sur le capteur et ouvre le panneau de détails

### Recherche d'une adresse
1. Cliquez dans la barre de recherche
2. Tapez l'adresse ou le nom du lieu (ex: "15 rue de Rivoli, Paris")
3. Sélectionnez un résultat dans la liste déroulante
4. La carte se centre automatiquement sur la localisation avec le zoom adaptatif

## Exemples de recherche

### Capteurs
- "Marseille" → Trouve tous les capteurs contenant "Marseille" dans leur nom
- "Station" → Trouve toutes les stations de référence
- "Micro" → Trouve tous les microcapteurs qualifiés

### Adresses avec zoom adaptatif

#### Adresses précises (Zoom 18)
- "15 rue de Rivoli, Paris" → Zoom très détaillé sur l'adresse exacte
- "42 avenue des Champs-Élysées, Paris" → Vue de la rue avec numéro

#### Rues (Zoom 16)
- "Rue de Rivoli, Paris" → Vue détaillée de la rue entière
- "Boulevard Saint-Germain, Paris" → Vue de la rue sans numéro spécifique

#### Quartiers (Zoom 14)
- "Marais, Paris" → Vue d'ensemble du quartier
- "Quartier Latin, Paris" → Vue du quartier

#### Communes (Zoom 12)
- "Paris" → Vue de la ville de Paris
- "Lyon" → Vue de la ville de Lyon
- "Marseille" → Vue de la ville de Marseille

#### Départements/Régions (Zoom 6-10)
- "Île-de-France" → Vue de la région (zoom 6)
- "Bouches-du-Rhône" → Vue du département (zoom 10)

## Configuration technique

### Composant
- **Fichier** : `src/components/controls/CustomSearchControl.tsx`
- **Position** : Haut à droite de la carte (`top-4 right-4`)
- **Largeur** : 320px sur desktop (`sm:w-80`), pleine largeur moins marge sur mobile (`w-[calc(100vw-2rem)]`)
- **Hauteur** : Auto (selon le contenu)
- **Z-index** : 800 (conteneur), 801 (liste déroulante des résultats)

### Recherche de capteurs
- **Filtrage** : Par nom (insensible à la casse, recherche partielle)
- **Limite** : 5 capteurs maximum
- **Déclenchement** : Après 2 caractères minimum

### Recherche d'adresses
- **API** : Base Adresse Nationale (BAN) - `https://api-adresse.data.gouv.fr/search/`
- **Limite** : 5 adresses maximum
- **Format** : GeoJSON
- **Gratuit** : Aucune clé API requise

### Résultats combinés
- **Total maximum** : 10 résultats (5 capteurs + 5 adresses)
- **Ordre d'affichage** : Capteurs en premier, puis adresses
- **Debounce** : 300ms pour éviter les recherches excessives

## Avantages pour la qualité de l'air

### Localisation rapide
- **Trouvez facilement les stations** : Recherche par nom parmi tous les capteurs affichés
- **Navigation intuitive** : Accédez rapidement à n'importe quelle zone géographique ou capteur
- **Données en temps réel** : Affiche les valeurs mesurées directement dans les résultats

### Informations visuelles
- **Marqueurs identifiables** : Reconnaissez immédiatement le type de capteur grâce aux marqueurs colorés
- **Valeurs intégrées** : Voyez la valeur mesurée sans ouvrir le panneau de détails
- **Indicateurs de qualité** : Les couleurs des marqueurs indiquent le niveau de qualité de l'air

### Intégration parfaite
- **Sélection automatique** : Sélectionne et centre automatiquement sur le capteur choisi
- **Panneau de détails** : Ouvre automatiquement le panneau latéral avec les informations détaillées
- **Cohérence visuelle** : Utilise les mêmes marqueurs et styles que sur la carte principale

## Dépendances

### Bibliothèques
- `react` : Framework React
- `leaflet` : Bibliothèque de cartographie
- `react-leaflet` : Intégration React pour Leaflet

### Utilitaires internes
- `getMarkerPath` : Fonction pour obtenir le chemin des marqueurs (`src/utils/index.ts`)
- `MeasurementDevice` : Type TypeScript pour les capteurs (`src/types/index.ts`)

### APIs externes
- **API BAN** : Base Adresse Nationale française (gratuite, sans clé API)

## Notes importantes

### Recherche de capteurs
- La recherche se fait uniquement parmi les capteurs actuellement affichés sur la carte
- Les capteurs filtrés par les sources sélectionnées ne seront pas trouvables
- La recherche est insensible à la casse et supporte la recherche partielle

### Recherche d'adresses
- Cette fonctionnalité est optimisée pour les adresses françaises
- Aucune clé API n'est requise pour l'usage de base
- Les données proviennent de la Base Adresse Nationale française
- Compatible avec tous les navigateurs modernes

### Performance
- Debounce de 300ms pour limiter les appels API
- Limitation à 10 résultats maximum pour maintenir des performances optimales
- Recherche asynchrone pour ne pas bloquer l'interface utilisateur

## Évolutions futures possibles

- [ ] Recherche par coordonnées GPS
- [ ] Historique des recherches récentes
- [ ] Favoris de capteurs/adresses
- [ ] Recherche par code postal
- [ ] Filtrage des résultats par type de capteur
- [ ] Recherche par niveau de qualité de l'air
