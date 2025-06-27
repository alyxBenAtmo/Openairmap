# Changelog - React Open Air Map

## [1.1.0] - 2024-06-27

### 🆕 Nouvelles fonctionnalités

#### 🔗 Clustering des marqueurs

- **Clustering intelligent** : Regroupement automatique des marqueurs géographiquement proches
- **Contrôle utilisateur** : Interface de paramétrage du clustering en temps réel
- **Performance optimisée** : Amélioration des performances avec de nombreux marqueurs
- **Configuration flexible** : Options personnalisables pour le comportement du clustering

#### 🎮 Interface de contrôle du clustering

- **Bouton de contrôle** : Icône dédiée en bas à gauche de la carte
- **Menu de configuration** : Interface intuitive pour paramétrer le clustering
- **Options configurables** :
  - Activation/désactivation du clustering
  - Rayon de clustering (20px à 200px)
  - Spiderfy au zoom maximum
  - Affichage de la zone au survol
  - Zoom sur la zone au clic
  - Animations de clustering
  - Animations d'ajout de marqueurs

### 🔧 Améliorations techniques

#### Architecture

- **Intégration react-leaflet-cluster** : Support complet du clustering Leaflet
- **Rendu conditionnel** : Basculement intelligent entre clustering et affichage normal
- **État local** : Gestion optimisée de la configuration du clustering
- **Types TypeScript** : Interface `ClusterConfig` pour la sécurité des types

#### Performance

- **Optimisation du rendu** : Réduction du nombre de marqueurs affichés simultanément
- **Chargement différé** : Amélioration de la fluidité de la carte
- **Gestion mémoire** : Optimisation de l'utilisation des ressources

### 🐛 Corrections

#### Dépendances

- **Résolution des conflits React** : Utilisation de `--legacy-peer-deps` pour React 19
- **Installation react-is** : Correction des dépendances manquantes pour Recharts
- **Compatibilité** : Support complet de React 19 avec react-leaflet-cluster

### 📚 Documentation

#### Nouveaux documents

- **CLUSTERING_FEATURE.md** : Documentation complète de la fonctionnalité de clustering
- **CHANGELOG.md** : Historique des changements et nouvelles fonctionnalités

#### Mises à jour

- **README.md** : Ajout des sections clustering et nouvelles dépendances
- **MARQUEURS_AVEC_VALEURS.md** : Intégration de la documentation du clustering

### 🔧 Dépendances ajoutées

```json
{
  "react-leaflet-cluster": "^2.1.0",
  "react-is": "^18.2.0"
}
```

### 🎯 Impact utilisateur

#### Avantages du clustering

- **Performance améliorée** : Carte plus fluide avec de nombreux marqueurs
- **Lisibilité accrue** : Regroupement logique des points proches
- **Navigation facilitée** : Zoom automatique sur les zones d'intérêt
- **Interface responsive** : Adaptation automatique selon le niveau de zoom

#### Expérience utilisateur

- **Contrôle intuitif** : Interface simple pour paramétrer le clustering
- **Feedback immédiat** : Changements appliqués en temps réel
- **Flexibilité** : Possibilité d'activer/désactiver selon les besoins
- **Personnalisation** : Options avancées pour les utilisateurs expérimentés

## [1.0.0] - Version initiale

### 🚀 Fonctionnalités de base

- Carte interactive avec Leaflet
- Contrôles intégrés dans l'en-tête
- Support de multiples sources de données
- Marqueurs colorés avec valeurs affichées
- Légende dynamique
- Interface responsive avec Tailwind CSS
- Architecture modulaire avec services séparés
- Support complet de TypeScript

### 📊 Sources de données supportées

- AtmoRef (stations de référence)
- AtmoMicro (microcapteurs qualifiés)
- SignalAir (capteurs communautaires)
- NebuleAir (capteurs communautaires)
- Sensor.Community (capteurs citoyens)
- PurpleAir (capteurs propriétaires)

### 🎨 Polluants supportés

- PM₁, PM₂.₅, PM₁₀
- NO₂, O₃, SO₂

### ⏱️ Pas de temps

- Scan, ≤2min, 15min, Heure, Jour

---

## 📝 Notes de développement

### Compatibilité

- React 19 avec legacy-peer-deps
- react-leaflet v5+
- TypeScript complet
- Vite pour le build

### Architecture

- Composants modulaires
- Services séparés par source
- Hooks personnalisés
- Constantes centralisées

### Performance

- Clustering intelligent
- Chargement différé
- Optimisation du rendu
- Gestion mémoire optimisée
