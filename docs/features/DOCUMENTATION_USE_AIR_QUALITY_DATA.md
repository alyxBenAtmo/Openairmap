# Documentation du Hook useAirQualityData

## 📋 Table des matières

1. [Introduction](#introduction)
2. [Qu'est-ce qu'un Hook React ?](#quest-ce-quun-hook-react-)
3. [Vue d'ensemble du hook useAirQualityData](#vue-densemble-du-hook-useairqualitydata)
4. [Interface et paramètres](#interface-et-paramètres)
5. [Fonctionnalités principales](#fonctionnalités-principales)
6. [Gestion des données](#gestion-des-données)
7. [Auto-refresh et intervalles](#auto-refresh-et-intervalles)
8. [Gestion des erreurs](#gestion-des-erreurs)
9. [Exemples d'utilisation](#exemples-dutilisation)
10. [Bonnes pratiques](#bonnes-pratiques)
11. [Dépannage](#dépannage)

---

## Introduction

Le hook `useAirQualityData` est le cœur de l'application ReactOpenAirMap. Il centralise la récupération, la gestion et la mise à jour des données de qualité de l'air provenant de différentes sources (AtmoRef, AtmoMicro, capteurs communautaires, SignalAir, etc.).

---

## Qu'est-ce qu'un Hook React ?

### Concept de base

Un **hook** dans React est une fonction spéciale qui permet d'utiliser des fonctionnalités React (comme l'état et les effets) dans des composants fonctionnels. Les hooks permettent de :

- Gérer l'état local d'un composant
- Effectuer des effets de bord (appels API, souscriptions, etc.)
- Partager la logique entre composants
- Organiser le code de manière réutilisable

### Hooks utilisés dans useAirQualityData

```typescript
import { useState, useEffect, useCallback, useRef } from "react";
```

- **`useState`** : Gère l'état local (données, chargement, erreurs)
- **`useEffect`** : Exécute des effets de bord (appels API, intervalles)
- **`useCallback`** : Mémorise une fonction pour éviter les re-renders inutiles
- **`useRef`** : Stocke une référence mutable (pour les intervalles)

---

## Vue d'ensemble du hook useAirQualityData

### Responsabilités principales

1. **Récupération des données** : Appelle les APIs des différentes sources de données
2. **Gestion de l'état** : Maintient les données, l'état de chargement et les erreurs
3. **Auto-refresh** : Met à jour automatiquement les données selon le pas de temps
4. **Transformation des données** : Normalise les données de différentes sources
5. **Gestion des erreurs** : Gère les erreurs de manière gracieuse

### Architecture

```
useAirQualityData
├── État local (useState)
│   ├── devices: MeasurementDevice[]
│   ├── reports: SignalAirReport[]
│   ├── loading: boolean
│   ├── error: string | null
│   ├── loadingSources: string[]
│   └── lastRefresh: Date | null
├── Logique métier (useCallback)
│   └── fetchData()
└── Effets (useEffect)
    ├── Auto-refresh
    └── Chargement initial
```

---

## Interface et paramètres

### Interface UseAirQualityDataProps

```typescript
interface UseAirQualityDataProps {
  selectedPollutant: string; // Polluant sélectionné (pm25, pm10, o3, etc.)
  selectedSources: string[]; // Sources sélectionnées
  selectedTimeStep: string; // Pas de temps (instantane, heure, jour, etc.)
  signalAirPeriod?: {
    // Période pour SignalAir (optionnel)
    startDate: string;
    endDate: string;
  };
  mobileAirPeriod?: {
    // Période pour MobileAir (optionnel)
    startDate: string;
    endDate: string;
  };
  selectedMobileAirSensor?: string | null; // Capteur MobileAir sélectionné
  autoRefreshEnabled?: boolean; // Activation du rafraîchissement automatique
}
```

### Valeurs de retour

```typescript
return {
  devices: MeasurementDevice[];     // Appareils de mesure
  reports: SignalAirReport[];       // Signalements SignalAir
  loading: boolean;                 // État de chargement global
  error: string | null;             // Message d'erreur
  loadingSources: string[];         // Sources en cours de chargement
  lastRefresh: Date | null;         // Timestamp du dernier rafraîchissement
};
```

---

## Fonctionnalités principales

### 1. Récupération des données (fetchData)

La fonction `fetchData` est le cœur du hook. Elle orchestre tout le processus de récupération des données en suivant ces étapes principales :

```typescript
const fetchData = useCallback(async () => {
  // 1. Vérification des sources sélectionnées
  if (selectedSources.length === 0) {
    setDevices([]);
    setReports([]);
    return;
  }

  // 2. Mise à jour du timestamp
  setLastRefresh(new Date());

  // 3. Nettoyage des données précédentes
  setDevices([]);
  setReports([]);
  setLoading(true);
  setError(null);
  setLoadingSources(selectedSources);

  // 4. Mapping des sources communautaires
  const mappedSources = selectedSources.map((source) => {
    if (source.startsWith("communautaire.")) {
      return source.split(".")[1]; // 'nebuleair' de 'communautaire.nebuleair'
    }
    return source;
  });

  // 5. Récupération des services
  const services = DataServiceFactory.getServices(mappedSources);

  // 6. Traitement de chaque service
  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    const data = await service.fetchData({
      pollutant: selectedPollutant,
      timeStep: selectedTimeStep,
      sources: mappedSources,
      signalAirPeriod,
      mobileAirPeriod,
      selectedSensors: selectedMobileAirSensor ? [selectedMobileAirSensor] : [],
    });

    // 7. Séparation des appareils et signalements
    if (Array.isArray(data)) {
      const measurementDevices: MeasurementDevice[] = [];
      const signalReports: SignalAirReport[] = [];

      data.forEach((item) => {
        if ("pollutant" in item && "value" in item && "unit" in item) {
          measurementDevices.push(item as MeasurementDevice);
        } else if ("signalType" in item) {
          signalReports.push(item as SignalAirReport);
        }
      });

      // 8. Mise à jour de l'état
      if (measurementDevices.length > 0) {
        setDevices((prevDevices) => {
          const filteredDevices = prevDevices.filter(
            (device) => device.source !== mappedSourceCode
          );
          return [...filteredDevices, ...measurementDevices];
        });
      }
    }
  }
}, [
  selectedPollutant,
  selectedSources,
  selectedTimeStep,
  signalAirPeriod,
  mobileAirPeriod,
  selectedMobileAirSensor,
]);
```

### 2. Gestion des sources communautaires

Le hook gère un système de mapping pour les sources communautaires :

```typescript
// Sources dans l'interface utilisateur
selectedSources = ["communautaire.nebuleair", "communautaire.mobileair"];

// Sources mappées pour les services
mappedSources = ["nebuleair", "mobileair"];
```

### 3. Nettoyage intelligent des données

Le hook nettoie automatiquement les données des sources non sélectionnées :

```typescript
// Suppression des devices des sources non sélectionnées
setDevices((prevDevices) => {
  const filteredDevices = prevDevices.filter((device) => {
    return mappedSources.includes(device.source);
  });
  return filteredDevices;
});
```

---

## Gestion des données

### Types de données

#### MeasurementDevice (Appareils de mesure)

```typescript
interface MeasurementDevice {
  id: string; // Identifiant unique
  name: string; // Nom de l'appareil
  latitude: number; // Latitude
  longitude: number; // Longitude
  source: string; // Source des données
  pollutant: string; // Polluant mesuré
  value: number; // Valeur mesurée
  unit: string; // Unité (µg/m³, ppm, etc.)
  timestamp: string; // Timestamp de la mesure
  status: "active" | "inactive" | "error";
  qualityLevel?: string; // Niveau de qualité (bon, moyen, etc.)
  address?: string; // Adresse
  departmentId?: string; // ID du département
  corrected_value?: number; // Valeur corrigée (AtmoMicro)
  raw_value?: number; // Valeur brute
  has_correction?: boolean; // Indique si correction appliquée
}
```

#### SignalAirReport (Signalements SignalAir)

```typescript
interface SignalAirReport {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  source: string;
  signalType: string; // Type de signalement
  timestamp: string;
  status: "active" | "inactive" | "error";
  signalCreatedAt: string; // Date de création
  signalDuration: string; // Durée du signalement
  signalHasSymptoms: string; // Présence de symptômes
  signalSymptoms: string; // Description des symptômes
  signalDescription: string; // Description du signalement
}
```

### Séparation des données

Le hook sépare automatiquement les données selon leur type :

```typescript
data.forEach((item) => {
  if ("pollutant" in item && "value" in item && "unit" in item) {
    // C'est un appareil de mesure
    measurementDevices.push(item as MeasurementDevice);
  } else if ("signalType" in item) {
    // C'est un signalement
    signalReports.push(item as SignalAirReport);
  }
});
```

---

## Auto-refresh et intervalles

### Calcul des intervalles

Le hook calcule automatiquement l'intervalle de rafraîchissement selon le pas de temps :

```typescript
const getRefreshInterval = (timeStep: string): number => {
  const code = pasDeTemps[timeStep]?.code || timeStep;
  switch (code) {
    case "instantane": // Scan
    case "2min": // ≤ 2 minutes
      return 60 * 1000; // 60 secondes
    case "qh": // 15 minutes
      return 15 * 60 * 1000; // 15 minutes
    case "h": // Heure
      return 60 * 60 * 1000; // 60 minutes
    case "d": // Jour
      return 24 * 60 * 60 * 1000; // 24 heures
    default:
      return 60 * 1000; // Par défaut, 60 secondes
  }
};
```

### Gestion des intervalles

```typescript
useEffect(() => {
  // Nettoyer l'intervalle précédent
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  // Ne pas démarrer si désactivé ou aucune source
  if (!autoRefreshEnabled || selectedSources.length === 0) {
    return;
  }

  // Calculer l'intervalle
  const refreshInterval = getRefreshInterval(selectedTimeStep);

  // Démarrer l'intervalle
  intervalRef.current = setInterval(() => {
    fetchData();
  }, refreshInterval) as any;

  // Nettoyer au démontage
  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
}, [selectedTimeStep, selectedSources, autoRefreshEnabled, fetchData]);
```

---

## Gestion des erreurs

### États d'erreur

Le hook gère plusieurs types d'erreurs :

1. **Erreurs de service** : Erreurs lors de l'appel à une API spécifique
2. **Erreurs globales** : Erreurs qui affectent tout le système
3. **Erreurs de validation** : Données invalides reçues

### Gestion gracieuse des erreurs

```typescript
try {
  const data = await service.fetchData({...});
  // Traitement des données
} catch (err) {
  console.error(`❌ Erreur lors de la récupération des données pour ${sourceCode}:`, err);
  // En cas d'erreur, on garde les données existantes
  // mais on retire la source du loading
} finally {
  // Retirer cette source de la liste des sources en cours
  setLoadingSources((prev) =>
    prev.filter((source) => source !== sourceCode)
  );
}
```

### Affichage des erreurs

```typescript
// Erreur globale
setError(
  err instanceof Error
    ? err.message
    : "Erreur lors de la récupération des données"
);

// Sources en cours de chargement (pour affichage progressif)
setLoadingSources(selectedSources);
```

---

## Bonnes pratiques

### 1. Gestion des dépendances

Le hook utilise `useCallback` pour mémoriser la fonction `fetchData` :

```typescript
const fetchData = useCallback(async () => {
  // ... logique de récupération
}, [
  selectedPollutant,
  selectedSources,
  selectedTimeStep,
  signalAirPeriod,
  mobileAirPeriod,
  selectedMobileAirSensor,
]);
```

**Pourquoi ?** Cela évite les re-renders inutiles et les appels API en boucle.

### 2. Nettoyage des intervalles

Toujours nettoyer les intervalles au démontage du composant :

```typescript
useEffect(() => {
  // ... logique de l'effet

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
}, [dependencies]);
```

### 3. Gestion des états de chargement

Le hook fournit un état de chargement global et par source :

```typescript
// Chargement global
if (loading) {
  return <div>Chargement...</div>;
}

// Chargement par source (pour affichage progressif)
{
  loadingSources.map((source) => (
    <div key={source}>Chargement {source}...</div>
  ));
}
```

### 4. Validation des données

Toujours valider les données reçues :

```typescript
data.forEach((item) => {
  if ("pollutant" in item && "value" in item && "unit" in item) {
    // Données valides pour un appareil de mesure
    measurementDevices.push(item as MeasurementDevice);
  }
});
```

### 5. Gestion des erreurs

Ne pas laisser les erreurs interrompre le fonctionnement global :

```typescript
try {
  const data = await service.fetchData({...});
  // Traitement des données
} catch (err) {
  console.error('Erreur pour cette source:', err);
  // Continuer avec les autres sources
} finally {
  // Nettoyer l'état de chargement pour cette source
  setLoadingSources(prev => prev.filter(s => s !== sourceCode));
}
```

---

## Dépannage

### Problèmes courants

#### 1. Boucles infinies d'appels API

**Symptôme :** Les appels API se répètent indéfiniment

**Cause :** Dépendances incorrectes dans `useCallback` ou `useEffect`

**Solution :** Vérifier les dépendances :

```typescript
// ❌ Incorrect - peut causer des boucles
const fetchData = useCallback(async () => {
  // ...
}, [selectedSources, selectedSources.length]); // selectedSources.length est redondant

// ✅ Correct
const fetchData = useCallback(async () => {
  // ...
}, [selectedPollutant, selectedSources, selectedTimeStep]);
```

#### 2. Données qui ne se mettent pas à jour

**Symptôme :** Les nouvelles sélections ne déclenchent pas de nouveaux appels

**Cause :** Dépendances manquantes dans `useCallback`

**Solution :** Ajouter toutes les dépendances nécessaires :

```typescript
const fetchData = useCallback(async () => {
  // ...
}, [
  selectedPollutant,
  selectedSources,
  selectedTimeStep,
  signalAirPeriod, // ← N'oubliez pas ces dépendances optionnelles
  mobileAirPeriod,
  selectedMobileAirSensor,
]);
```

#### 3. Fuites mémoire avec les intervalles

**Symptôme :** L'application devient lente ou plante

**Cause :** Intervalles non nettoyés

**Solution :** Toujours nettoyer les intervalles :

```typescript
useEffect(() => {
  const intervalId = setInterval(fetchData, interval);

  return () => {
    clearInterval(intervalId); // ← Toujours nettoyer
  };
}, [dependencies]);
```

#### 4. Erreurs de mapping des sources

**Symptôme :** Les sources communautaires ne fonctionnent pas

**Cause :** Mapping incorrect des sources

**Solution :** Vérifier le mapping :

```typescript
// Vérifier que le mapping est correct
const mappedSources = selectedSources.map((source) => {
  if (source.startsWith("communautaire.")) {
    return source.split(".")[1]; // 'nebuleair' de 'communautaire.nebuleair'
  }
  return source;
});

console.log("Sources mappées:", mappedSources);
```

#### 5. Données qui ne s'affichent pas

**Symptôme :** Les données sont récupérées mais ne s'affichent pas

**Cause :** Problème dans la séparation des données

**Solution :** Vérifier la logique de séparation :

```typescript
data.forEach((item) => {
  console.log("Item reçu:", item); // Debug

  if ("pollutant" in item && "value" in item && "unit" in item) {
    console.log("Appareil de mesure détecté:", item);
    measurementDevices.push(item as MeasurementDevice);
  } else if ("signalType" in item) {
    console.log("Signalement détecté:", item);
    signalReports.push(item as SignalAirReport);
  } else {
    console.warn("Type de données inconnu:", item);
  }
});
```

### Debug et logging

Le hook inclut des logs détaillés pour le debug :

```typescript
console.log("🔍 [HOOK] Mapping des sources:", {
  selectedSources,
  mappedSources,
});

console.log(
  "🔍 [HOOK] Services récupérés:",
  services.map((s) => s.constructor.name)
);
```

Activez ces logs en ouvrant la console du navigateur pour diagnostiquer les problèmes.

### Performance

#### Optimisations incluses

1. **Mémorisation des fonctions** : `useCallback` évite les re-renders
2. **Nettoyage intelligent** : Suppression des données obsolètes
3. **Chargement progressif** : Affichage des données au fur et à mesure
4. **Gestion des intervalles** : Nettoyage automatique des intervalles

#### Recommandations

1. **Éviter les re-renders fréquents** : Utiliser `React.memo` pour les composants enfants
2. **Limiter le nombre de sources** : Ne pas sélectionner toutes les sources simultanément
3. **Désactiver l'auto-refresh** : Si pas nécessaire pour économiser la bande passante
4. **Utiliser des pas de temps appropriés** : Éviter le mode "Scan" en production

---

## Conclusion

Le hook `useAirQualityData` est un composant central de l'application ReactOpenAirMap. Il encapsule toute la logique complexe de récupération et de gestion des données de qualité de l'air, permettant aux composants de se concentrer sur l'affichage.

### Points clés à retenir

1. **Séparation des responsabilités** : Le hook gère les données, les composants gèrent l'affichage
2. **Gestion d'état robuste** : États de chargement, erreurs, et données séparés
3. **Auto-refresh intelligent** : Mise à jour automatique selon le pas de temps
4. **Gestion des erreurs gracieuse** : Les erreurs d'une source n'affectent pas les autres
5. **Optimisations de performance** : Mémorisation et nettoyage automatique

### Ressources supplémentaires

- [Documentation React Hooks](https://reactjs.org/docs/hooks-intro.html)
- [Documentation useCallback](https://reactjs.org/docs/hooks-reference.html#usecallback)
- [Documentation useEffect](https://reactjs.org/docs/hooks-reference.html#useeffect)
- [Documentation technique ReactOpenAirMap](./DOCUMENTATION_TECHNIQUE.md)

---

_Cette documentation est maintenue à jour avec l'évolution du code. Pour toute question ou suggestion d'amélioration, consultez la documentation technique complète._
