# Carte de la Qualité de l'Air - React Open Air Map

Une application React modulaire et responsive pour afficher des appareils de mesure de la qualité de l'air sur une carte interactive.

## 🚀 Fonctionnalités

- **Carte interactive** avec Leaflet pour afficher les appareils de mesure
- **3 menus de contrôle** :
  - Sélection du polluant (1 actif à la fois)
  - Sélection des sources de données (plusieurs sources possibles)
  - Sélection du pas de temps (1 actif à la fois)
- **Architecture modulaire** avec services séparés pour chaque source de données
- **Design responsive** adapté à tous les écrans
- **Marqueurs colorés** selon la valeur des mesures

## 📁 Architecture du projet

```
src/
├── components/          # Composants React
│   ├── controls/       # Composants de contrôle (menus)
│   ├── map/           # Composants de carte
│   └── App.tsx        # Composant principal
├── services/          # Services de données
│   ├── BaseDataService.ts
│   ├── AtmoRefService.ts
│   ├── AtmoMicroService.ts
│   ├── NebuleAirService.ts
│   ├── SignalAirService.ts
│   └── DataServiceFactory.ts
├── hooks/             # Hooks personnalisés
├── constants/         # Constantes (sources, polluants, pas de temps)
├── types/             # Types TypeScript
└── utils/             # Utilitaires
```

## 🛠️ Sources de données supportées

- **AtmoRef** : Stations de référence AtmoSud
- **AtmoMicro** : Microcapteurs qualifiés AtmoSud
- **NebuleAir** : Capteurs communautaires NebuleAir
- **SignalAir** : Capteurs SignalAir
- **Sensor.Community** : Capteurs communautaires (prévu)
- **PurpleAir** : Capteurs PurpleAir (prévu)

## 🎨 Polluants supportés

- **PM2.5** : Particules fines ≤ 2.5 µm
- **PM10** : Particules fines ≤ 10 µm
- **NO₂** : Dioxyde d'azote
- **O₃** : Ozone
- **CO** : Monoxyde de carbone

## ⏱️ Pas de temps disponibles

- **Temps réel** : Données en temps réel
- **Horaire** : Données horaires
- **Journalier** : Données journalières
- **Hebdomadaire** : Données hebdomadaires

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

Les menus sont organisés en composants réutilisables :

- `PollutantSelector` : Sélection du polluant
- `SourceSelector` : Sélection des sources
- `TimeStepSelector` : Sélection du pas de temps

### Hook personnalisé

`useAirQualityData` gère la récupération et l'état des données :

```typescript
const { devices, loading, error } = useAirQualityData({
  selectedPollutant,
  selectedSources,
  selectedTimeStep,
});
```

## 🎯 Prochaines étapes

- [ ] Intégration des vraies APIs de données
- [ ] Ajout d'images PNG pour les marqueurs
- [ ] Amélioration de la logique de couleur selon les seuils
- [ ] Ajout de filtres supplémentaires
- [ ] Optimisation des performances
- [ ] Tests unitaires et d'intégration

## 🛠️ Technologies utilisées

- **React 18** avec TypeScript
- **Vite** pour le build et le développement
- **Leaflet** pour la carte interactive
- **React Leaflet** pour l'intégration React
- **CSS Modules** pour les styles

## 📝 Licence

Ce projet est sous licence MIT.
