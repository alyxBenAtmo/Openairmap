# Fonctionnalité de Clustering - React Open Air Map

## 📋 Vue d'ensemble

La fonctionnalité de clustering permet de regrouper automatiquement les marqueurs géographiquement proches sur la carte, améliorant ainsi les performances et la lisibilité de l'interface utilisateur.

## 🎯 Objectifs

- **Améliorer les performances** : Réduire le nombre de marqueurs rendus simultanément
- **Améliorer la lisibilité** : Regrouper logiquement les points proches
- **Faciliter la navigation** : Zoom automatique sur les zones d'intérêt
- **Interface responsive** : Adaptation automatique selon le niveau de zoom

## 🏗️ Architecture technique

### Composants impliqués

- `AirQualityMap.tsx` : Intégration du clustering dans la carte
- `ClusterControl.tsx` : Interface de contrôle du clustering
- `react-leaflet-cluster` : Bibliothèque de clustering

### Types TypeScript

```typescript
interface ClusterConfig {
  enabled: boolean;
  maxClusterRadius: number;
  spiderfyOnMaxZoom: boolean;
  showCoverageOnHover: boolean;
  zoomToBoundsOnClick: boolean;
  animate: boolean;
  animateAddingMarkers: boolean;
}
```

## ⚙️ Configuration par défaut

```typescript
const defaultClusterConfig = {
  enabled: true,
  maxClusterRadius: 60,
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: true,
  zoomToBoundsOnClick: true,
  animate: true,
  animateAddingMarkers: true,
};
```

## 🎮 Interface utilisateur

### Contrôle du clustering

Le contrôle du clustering est accessible via un bouton en bas à gauche de la carte, au-dessus du contrôle de fond de carte.

#### Icône du bouton

- **Design** : Icône représentant des points groupés
- **Position** : En bas à gauche, au-dessus du contrôle de fond de carte
- **Style** : Cohérent avec les autres contrôles de la carte

#### Menu de configuration

Le menu s'ouvre vers le haut et la droite pour éviter d'être caché par les bords de la carte.

**Sections du menu :**

1. **Activation du clustering**

   - Checkbox pour activer/désactiver le clustering
   - État visible immédiatement sur la carte

2. **Rayon de clustering**

   - Slider de 20px à 200px
   - Affichage de la valeur actuelle
   - Mise à jour en temps réel

3. **Options avancées**
   - Spiderfy au zoom maximum
   - Affichage de la zone au survol
   - Zoom sur la zone au clic
   - Animations de clustering
   - Animations d'ajout de marqueurs

## 🔧 Intégration dans AirQualityMap

### Rendu conditionnel

```typescript
{
  clusterConfig.enabled ? (
    <MarkerClusterGroup
      maxClusterRadius={clusterConfig.maxClusterRadius}
      spiderfyOnMaxZoom={clusterConfig.spiderfyOnMaxZoom}
      showCoverageOnHover={clusterConfig.showCoverageOnHover}
      zoomToBoundsOnClick={clusterConfig.zoomToBoundsOnClick}
      animate={clusterConfig.animate}
      animateAddingMarkers={clusterConfig.animateAddingMarkers}
    >
      {devices.map((device) => (
        <Marker
          key={device.id}
          position={[device.latitude, device.longitude]}
          icon={createCustomIcon(device)}
          eventHandlers={{
            click: () => handleMarkerClick(device),
          }}
        />
      ))}
    </MarkerClusterGroup>
  ) : (
    devices.map((device) => (
      <Marker
        key={device.id}
        position={[device.latitude, device.longitude]}
        icon={createCustomIcon(device)}
        eventHandlers={{
          click: () => handleMarkerClick(device),
        }}
      />
    ))
  );
}
```

### Gestion de l'état

```typescript
const [clusterConfig, setClusterConfig] = useState(defaultClusterConfig);
```

## 📊 Options de clustering

### maxClusterRadius

- **Type** : `number`
- **Plage** : 20px à 200px
- **Défaut** : 60px
- **Description** : Distance en pixels à laquelle les marqueurs se regroupent

### spiderfyOnMaxZoom

- **Type** : `boolean`
- **Défaut** : `true`
- **Description** : Éclate les clusters quand l'utilisateur zoome au maximum

### showCoverageOnHover

- **Type** : `boolean`
- **Défaut** : `true`
- **Description** : Affiche la zone couverte par un cluster au survol

### zoomToBoundsOnClick

- **Type** : `boolean`
- **Défaut** : `true`
- **Description** : Zoom automatique sur la zone du cluster au clic

### animate

- **Type** : `boolean`
- **Défaut** : `true`
- **Description** : Active les animations de clustering

### animateAddingMarkers

- **Type** : `boolean`
- **Défaut** : `true`
- **Description** : Active les animations lors de l'ajout de marqueurs

## 🎨 Styles CSS

### Conteneur des contrôles

```css
.absolute.bottom-4.left-4.z-[1000].flex.flex-col.space-y-2;
```

### Menu de clustering

```css
.absolute.z-[2000].w-80.bg-white/95.backdrop-blur-sm.border.border-gray-200/50.rounded-md.shadow-sm.bottom-full.mb-1.left-0;
```

## 🔄 Comportement dynamique

### Mise à jour en temps réel

- Les changements de configuration sont appliqués immédiatement
- Pas de rechargement de page nécessaire
- Transitions fluides entre les états

### Gestion des événements

- **Clic sur un cluster** : Zoom sur la zone du cluster
- **Survol d'un cluster** : Affichage de la zone couverte
- **Zoom maximum** : Éclatement automatique des clusters

## 🚀 Avantages

### Performance

- Réduction du nombre de marqueurs rendus
- Amélioration de la fluidité de la carte
- Chargement plus rapide avec de nombreux points

### UX

- Interface plus claire et lisible
- Navigation intuitive
- Feedback visuel immédiat

### Flexibilité

- Configuration personnalisable
- Activation/désactivation à la demande
- Adaptation automatique au contexte

## 🔧 Dépendances

### react-leaflet-cluster

- **Version** : 2.1.0
- **Installation** : `npm install react-leaflet-cluster --legacy-peer-deps`
- **Compatibilité** : React 18+ (utilisé avec React 19 via legacy-peer-deps)

### Configuration requise

- react-leaflet v5+
- leaflet v1.9+
- React 19 (avec legacy-peer-deps)

## 📝 Notes de développement

### Résolution des conflits

- Utilisation de `--legacy-peer-deps` pour la compatibilité React 19
- Installation de `react-is` pour résoudre les dépendances manquantes

### Optimisations

- Rendu conditionnel pour éviter le clustering inutile
- État local pour les performances
- Mise à jour optimisée des configurations

### Extensibilité

- Interface modulaire pour ajouter de nouvelles options
- Types TypeScript pour la sécurité
- Architecture réutilisable
