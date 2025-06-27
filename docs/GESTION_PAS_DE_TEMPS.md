# Gestion des Pas de Temps - ReactOpenAirMap

## 📋 Vue d'ensemble

Ce document décrit la gestion des pas de temps dans l'application ReactOpenAirMap, incluant la configuration des APIs, la validation des sources, et l'adaptation dynamique de l'interface utilisateur.

## 🎯 Objectif

Adapter les appels API selon le pas de temps sélectionné et filtrer dynamiquement les options disponibles selon les sources de données sélectionnées.

## ⚙️ Configuration des Pas de Temps

### Structure des Pas de Temps

Les pas de temps sont définis dans `src/constants/timeSteps.ts` :

```typescript
export const pasDeTemps = {
  instantane: { name: "Scan", code: "instantane", value: 0 },
  deuxMin: { name: "≤2min", code: "deuxMin", value: 2 },
  quartHeure: { name: "15min", code: "quartHeure", value: 15 },
  heure: { name: "Heure", code: "heure", value: 60 },
  jour: { name: "Jour", code: "jour", value: 1440 },
};
```

### Support par Source de Données

Chaque source de données définit les pas de temps qu'elle supporte dans `src/constants/sources.ts` :

```typescript
export const sources = {
  atmoRef: {
    name: "Station de référence atmosud",
    code: "atmoRef",
    activated: true,
    supportedTimeSteps: ["instantane", "quartHeure", "heure", "jour"], // Pas de support pour "deuxMin"
  },
  atmoMicro: {
    name: "Microcapteurs qualifiés",
    code: "atmoMicro",
    activated: true,
    supportedTimeSteps: ["instantane", "deuxMin", "quartHeure", "heure"], // Pas de support pour "jour"
  },
  // ...
};
```

## 🔧 Configuration des APIs

### AtmoRef Service

**Fichier :** `src/services/AtmoRefService.ts`

```typescript
private getAtmoRefTimeStepConfig(timeStep: string): { temporalite: string; delais: number } | null {
  const timeStepConfigs = {
    instantane: { temporalite: "quart-horaire", delais: 181 },
    quartHeure: { temporalite: "quart-horaire", delais: 19 },
    heure: { temporalite: "horaire", delais: 64 },
    jour: { temporalite: "journalière", delais: 1444 },
    // deuxMin: Pas supporté par AtmoRef
  };
  return timeStepConfigs[timeStep] || null;
}
```

**URL générée :**

```
https://api.atmosud.org/observations/stations/mesures/derniere?format=json&nom_polluant=${pollutant}&temporalite=${temporalite}&delais=${delais}&download=false
```

### AtmoMicro Service

**Fichier :** `src/services/AtmoMicroService.ts`

```typescript
private getAtmoMicroTimeStepConfig(timeStep: string): { aggregation: string; delais: number } | null {
  const timeStepConfigs = {
    instantane: { aggregation: "brute", delais: 181 },
    deuxMin: { aggregation: "brute", delais: 181 },
    quartHeure: { aggregation: "quart-horaire", delais: 19 },
    heure: { aggregation: "horaire", delais: 64 },
    // jour: Pas supporté par AtmoMicro
  };
  return timeStepConfigs[timeStep] || null;
}
```

**URL générée :**

```
https://api.atmosud.org/observations/capteurs/mesures/dernieres?format=json&download=false&valeur_brute=true&type_capteur=true&variable=${variable}&aggregation=${aggregation}&delais=${delais}
```

## 🎛️ Interface Utilisateur

### Filtrage Dynamique

Le composant `TimeStepDropdown` filtre automatiquement les pas de temps disponibles selon les sources sélectionnées :

**Fichier :** `src/components/controls/TimeStepDropdown.tsx`

```typescript
const getSupportedTimeSteps = () => {
  if (selectedSources.length === 0) {
    return Object.keys(pasDeTemps); // Tous les pas de temps si aucune source sélectionnée
  }

  const allSupportedTimeSteps = new Set<string>();

  selectedSources.forEach((sourceCode) => {
    const source = sources[sourceCode];
    if (source && source.supportedTimeSteps) {
      source.supportedTimeSteps.forEach((timeStep) => {
        allSupportedTimeSteps.add(timeStep);
      });
    }
  });

  return Array.from(allSupportedTimeSteps);
};
```

### Adaptation Automatique

Si le pas de temps actuel n'est plus supporté par les sources sélectionnées, l'application passe automatiquement au premier pas de temps disponible :

```typescript
useEffect(() => {
  if (selectedTimeStep && !supportedTimeSteps.includes(selectedTimeStep)) {
    const firstSupported = supportedTimeSteps[0];
    if (firstSupported) {
      onTimeStepChange(firstSupported);
    }
  }
}, [selectedTimeStep, supportedTimeSteps, onTimeStepChange]);
```

## 📊 Mapping des Pas de Temps

### AtmoRef (Stations de Référence)

| Pas de Temps | Temporalité   | Délais (min) | Description               |
| ------------ | ------------- | ------------ | ------------------------- |
| Scan         | quart-horaire | 181          | Données les plus récentes |
| 15min        | quart-horaire | 19           | Agrégation sur 15 minutes |
| Heure        | horaire       | 64           | Agrégation horaire        |
| Jour         | journalière   | 1444         | Agrégation journalière    |
| ≤2min        | ❌            | ❌           | **Non supporté**          |

### AtmoMicro (Microcapteurs)

| Pas de Temps | Agrégation    | Délais (min) | Description                       |
| ------------ | ------------- | ------------ | --------------------------------- |
| Scan         | brute         | 181          | Données brutes les plus récentes  |
| ≤2min        | brute         | 181          | Données brutes quasi-instantanées |
| 15min        | quart-horaire | 19           | Agrégation sur 15 minutes         |
| Heure        | horaire       | 64           | Agrégation horaire                |
| Jour         | ❌            | ❌           | **Non supporté**                  |

## 🔄 Flux de Données

1. **Sélection des Sources** : L'utilisateur sélectionne une ou plusieurs sources
2. **Filtrage des Pas de Temps** : Le dropdown se met à jour pour afficher uniquement les pas de temps supportés
3. **Sélection du Pas de Temps** : L'utilisateur choisit un pas de temps disponible
4. **Configuration de l'API** : Chaque service adapte ses paramètres selon le pas de temps
5. **Appel API** : Les requêtes sont envoyées avec les bons paramètres
6. **Affichage des Données** : Les marqueurs sont mis à jour avec les nouvelles données

## 🛠️ Ajout d'une Nouvelle Source

Pour ajouter une nouvelle source avec des pas de temps spécifiques :

1. **Définir les pas de temps supportés** dans `sources.ts`
2. **Créer le service** avec la méthode `getTimeStepConfig`
3. **Adapter l'URL** selon les paramètres de l'API
4. **Tester** avec différents pas de temps

### Exemple pour une Nouvelle Source

```typescript
// Dans sources.ts
newSource: {
  name: "Nouvelle Source",
  code: "newSource",
  activated: true,
  supportedTimeSteps: ["instantane", "heure", "jour"], // Pas de support pour 15min
},

// Dans NewSourceService.ts
private getNewSourceTimeStepConfig(timeStep: string): { param: string; delay: number } | null {
  const configs = {
    instantane: { param: "realtime", delay: 5 },
    heure: { param: "hourly", delay: 60 },
    jour: { param: "daily", delay: 1440 },
  };
  return configs[timeStep] || null;
}
```

## 🔍 Dépannage

### Problèmes Courants

1. **Pas de temps non disponible** : Vérifier que la source supporte ce pas de temps
2. **Données manquantes** : Vérifier les paramètres de délais et d'agrégation
3. **Erreurs API** : Contrôler les URLs générées dans les logs

### Logs de Débogage

Les services affichent les URLs générées dans la console :

```
📡 AtmoMicro - URLs générées: {
  sites: "https://api.atmosud.org/observations/capteurs/sites?format=json&variable=pm2.5&actifs=2880",
  measures: "https://api.atmosud.org/observations/capteurs/mesures/dernieres?format=json&download=false&valeur_brute=true&type_capteur=true&variable=pm2.5&aggregation=quart-horaire&delais=19"
}
```

## 🚀 Évolutions Futures

- **Support de pas de temps personnalisés** : Permettre à l'utilisateur de définir des intervalles
- **Cache intelligent** : Mettre en cache les données selon le pas de temps
- **Prévisualisation** : Afficher un aperçu des données disponibles pour chaque pas de temps
- **Optimisation des performances** : Adapter la fréquence de rafraîchissement selon le pas de temps

## 📝 Notes Techniques

- Les délais sont exprimés en minutes
- Les agrégations varient selon les APIs (brute, quart-horaire, horaire, journalière)
- Le filtrage est effectué côté client pour une meilleure réactivité
- Les changements de pas de temps déclenchent automatiquement de nouveaux appels API
