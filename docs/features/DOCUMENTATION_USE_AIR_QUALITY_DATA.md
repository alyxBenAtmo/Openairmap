# Le hook useAirQualityData

Ce document explique comment fonctionne le cœur métier de ReactOpenAirMap : le hook qui récupère et gère les données de qualité de l'air. On a voulu garder un ton accessible, même si tu débutes en React.

## Table des matières

1. [Introduction](#introduction)
2. [Qu'est-ce qu'un Hook React ?](#quest-ce-quun-hook-react-)
3. [Vue d'ensemble du hook useAirQualityData](#vue-densemble-du-hook-useairqualitydata)
4. [Interface et paramètres](#interface-et-paramètres)
5. [Fonctionnalités principales](#fonctionnalités-principales)
6. [Exemples d'utilisation](#exemples-dutilisation)
7. [Gestion des données](#gestion-des-données)
8. [Auto-refresh et intervalles](#auto-refresh-et-intervalles)
9. [Gestion des erreurs](#gestion-des-erreurs)
10. [Bonnes pratiques](#bonnes-pratiques)
11. [Dépannage](#dépannage)
12. [Résumé pour un développeur qui ne connaît pas React](#résumé-pour-un-développeur-qui-ne-connaît-pas-react)
13. [Conclusion](#conclusion)

---

## Introduction

`useAirQualityData` est le centre névralgique de l'app : c'est lui qui va chercher les données chez AtmoRef, AtmoMicro, NebuleAir, SignalAir, etc., les met en forme et les met à jour. Tout passe par ce hook. Si tu veux comprendre comment les données arrivent sur la carte, tu es au bon endroit.

---

## Qu'est-ce qu'un Hook React ? (en deux mots)

### L'idée

En React, un **hook** est une fonction un peu spéciale : elle te permet d'utiliser de l'état, des effets (appels API, timers…), et de réutiliser cette logique dans tes composants. En pratique, ça évite de tout mélanger dans un gros composant.

### Ce que useAirQualityData utilise sous le capot

```typescript
import { useState, useEffect, useCallback, useRef } from "react";
```

- **`useState`** — Pour stocker les données, le chargement, les erreurs. Dès que tu modifies cet état, React redessine le composant.
- **`useEffect`** — Pour tout ce qui doit se passer *en dehors* du simple affichage : appels API, mise en place d'un timer, etc. Tu lui dis « quand ces trucs changent, refais ça ».
- **`useCallback`** — Pour garder la même fonction d'un rendu à l'autre et éviter de relancer des appels en boucle ou de faire trembler tout l'arbre de composants.
- **`useRef`** — Pour garder une valeur (par ex. l'id d'un timer) sans que son changement déclenche un nouveau rendu.

**En résumé** : ton composant est une fonction qui retourne du JSX. Les hooks s'appellent toujours en haut de cette fonction (pas dans un `if` ni une boucle). À chaque fois que l'état ou les props changent, la fonction est réexécutée — c'est le fameux « re-render ».

---

## À quoi sert ce hook, concrètement ?

Il fait cinq choses :

1. **Aller chercher les données** — Il appelle les APIs (AtmoRef, AtmoMicro, etc.) avec les bons paramètres.
2. **Tenir à jour l'état** — Données, chargement, erreurs : tout est centralisé.
3. **Rafraîchir tout seul** — Selon le pas de temps choisi (scan, 15 min, heure, jour), il relance des requêtes à intervalle régulier.
4. **Uniformiser les réponses** — Chaque source a son format ; le hook s'occupe de mettre tout ça dans une forme commune.
5. **Ne pas tout casser si une source plante** — Si une API répond mal, les autres continuent et l'utilisateur garde ce qui a déjà été chargé.

### Vue d'ensemble (schéma)

```
useAirQualityData
├── État local (useState)
│ ├── devices: MeasurementDevice[]
│ ├── reports: SignalAirReport[]
│ ├── loading: boolean
│ ├── error: string | null
│ ├── loadingSources: string[]
│ └── lastRefresh: Date | null
├── Logique métier (useCallback)
│ └── fetchData()
└── Effets (useEffect)
├── Auto-refresh
└── Chargement initial
```

---

## Ce qu'on lui passe (les paramètres)

### L'interface en TypeScript

```typescript
interface UseAirQualityDataProps {
selectedPollutant: string; // Polluant sélectionné (pm25, pm10, o3, etc.)
selectedSources: string[]; // Sources sélectionnées
selectedTimeStep: string; // Pas de temps (instantane, heure, jour, etc.)
signalAirPeriod?: { startDate: string; endDate: string };
mobileAirPeriod?: { startDate: string; endDate: string };
selectedMobileAirSensor?: string | null; // Capteur MobileAir sélectionné
signalAirOptions?: {
// Optionnel : chargement SignalAir sur demande (bouton « Charger »)
selectedTypes: string[];
loadTrigger: number; // Incrémenté pour déclencher un chargement
isSourceSelected?: boolean;
};
autoRefreshEnabled?: boolean; // Activation du rafraîchissement automatique (défaut: true)
}
```

**Petit détail important :** SignalAir et MobileAir ne se rafraîchissent pas seuls comme les autres. SignalAir se charge quand tu incrémentes `loadTrigger` (par ex. au clic sur « Charger »). MobileAir se charge quand un capteur est choisi (`selectedMobileAirSensor`). Pour le reste (AtmoRef, AtmoMicro, NebuleAir…), un simple changement de polluant, source ou pas de temps suffit à relancer les appels.

### Ce qu'il te rend

```typescript
return {
devices: MeasurementDevice[]; // Appareils de mesure
reports: SignalAirReport[]; // Signalements SignalAir
loading: boolean; // État de chargement global
error: string | null; // Message d'erreur
loadingSources: string[]; // Sources en cours de chargement
lastRefresh: Date | null; // Timestamp du dernier rafraîchissement
};
```

---

## Comment ça marche à l'intérieur

### 1. La récupération des données (fetchData)

Toute la magie se passe dans `fetchData`. En gros, elle fait ceci :

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

// 4. Filtrer SignalAir et MobileAir (gérés séparément) puis mapping des sources
const filteredSources = selectedSources.filter(
(s) => s !== "signalair" && s !== "communautaire.mobileair"
);
const mappedSources = filteredSources.map((source) => {
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
signalAirSelectedTypes: signalAirOptions?.selectedTypes,
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
signalAirOptions,
]);
```

### 2. Les sources « communautaires »

Dans l'interface, les sources sont nommées avec un préfixe (ex. `communautaire.nebuleair`). Le hook transforme ça pour les services qui attendent juste `nebuleair` :

```typescript
// Sources dans l'interface utilisateur
selectedSources = ["communautaire.nebuleair", "communautaire.mobileair"];

// Sources mappées pour les services
mappedSources = ["nebuleair", "mobileair"];
```

### 3. Nettoyage des données

Dès qu'une source est décochée, les données qui viennent d'elle sont retirées. Pas besoin de s'en occuper à la main :

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

## Exemples d'utilisation

### Cas simple : un composant qui affiche la carte

Tu appelles le hook tout en haut de ton composant, tu lui donnes la sélection de l'utilisateur, et il te renvoie les données + l'état de chargement. C'est tout :

```tsx
function CarteQualiteAir() {
const [selectedPollutant, setSelectedPollutant] = useState("pm25");
const [selectedSources, setSelectedSources] = useState(["atmoRef", "communautaire.nebuleair"]);
const [selectedTimeStep, setSelectedTimeStep] = useState("heure");

const { devices, reports, loading, error, lastRefresh } = useAirQualityData({
selectedPollutant,
selectedSources,
selectedTimeStep,
autoRefreshEnabled: true,
});

if (loading && devices.length === 0) return <div>Chargement...</div>;
if (error) return <div>Erreur : {error}</div>;

return (
<div>
<Carte devices={devices} />
<ListeSignalements reports={reports} />
</div>
);
}
```

Dès que l'utilisateur change le polluant, les sources ou le pas de temps (via les menus), le hook refait les appels tout seul et met à jour `devices` et `reports`. Pas besoin de bouton « Rafraîchir » pour ça.

### Cas un peu plus riche : SignalAir et MobileAir

Si tu as un bouton « Charger » pour SignalAir ou un sélecteur de capteur MobileAir, tu passes en plus les options suivantes :

```tsx
const [signalAirLoadTrigger, setSignalAirLoadTrigger] = useState(0);

const { devices, reports, loading } = useAirQualityData({
selectedPollutant,
selectedSources,
selectedTimeStep,
signalAirPeriod: { startDate: "2025-01-01", endDate: "2025-01-31" },
signalAirOptions: {
selectedTypes: ["odeur", "bruit"],
loadTrigger: signalAirLoadTrigger,
isSourceSelected: selectedSources.includes("signalair"),
},
selectedMobileAirSensor: selectedSensorId,
mobileAirPeriod: { startDate: "...", endDate: "..." },
});

// Déclencher le chargement SignalAir au clic sur « Charger »
const handleLoadSignalAir = () => {
setSignalAirLoadTrigger((prev) => prev + 1);
};
```

---

## Les données que tu reçois

### Les types en jeu

#### MeasurementDevice (un appareil de mesure)

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

#### SignalAirReport (un signalement SignalAir)

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

### Comment le hook distingue les deux

Les APIs peuvent renvoyer un mélange d'appareils et de signalements. Le hook regarde la forme de chaque élément et les trie tout seul :

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

## Auto-refresh : à quelle fréquence ça se met à jour ?

### Les intervalles selon le pas de temps

En fonction du pas de temps choisi (scan, 15 min, heure, jour), le hook décide toutes les combien de secondes (ou minutes) il relance les requêtes :

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

## Et quand ça plante ?

### Les différents cas

Une source peut échouer sans que tout s'arrête : le hook distingue les erreurs par service, les erreurs globales, et les réponses invalides. L'idée, c'est de garder ce qui a déjà été chargé et d'afficher un message plutôt que un écran blanc.

### Ce qui se passe dans le code

```typescript
try {
const data = await service.fetchData({...});
// Traitement des données
} catch (err) {
console.error(` Erreur lors de la récupération des données pour ${sourceCode}:`, err);
// En cas d'erreur, on garde les données existantes
// mais on retire la source du loading
} finally {
// Retirer cette source de la liste des sources en cours
setLoadingSources((prev) =>
prev.filter((source) => source !== sourceCode)
);
}
```

Pour afficher une erreur à l'utilisateur, le hook met à jour `error`. Les sources en cours de chargement sont dans `loadingSources`, ce qui permet d'afficher un indicateur par source si tu veux.

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

## Quelques bonnes pratiques

### 1. Bien lister les dépendances

`fetchData` est mémorisée avec `useCallback` et une liste de dépendances. Si tu oublies un paramètre utilisé dans la fonction, tu auras soit des appels en boucle, soit des données qui ne se mettent pas à jour. Vérifier cette liste en premier en cas de souci :

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
signalAirOptions,
]);
```

### 2. Penser au nettoyage des timers

Quand le composant disparaît (navigation, fermeture…), il faut arrêter les intervalles. Sinon tu te retrouves avec des timers orphelins et des comportements bizarres. Le hook s'en charge déjà ; si tu écris un effet similaire ailleurs, n'oublie pas le `return () => { clearInterval(...) }` :

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

### 3. Afficher le chargement

Tu disposes de `loading` (tout le monde) et de `loadingSources` (quelle source est en train de charger). Tu peux afficher un spinner global ou un indicateur par source, selon le niveau de détail que tu veux :

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

### 4. Valider ce qui revient des APIs

Le hook s'appuie sur la forme des objets (présence de `pollutant`, `value`, `unit` ou de `signalType`) pour séparer appareils et signalements. Si une API change son format, il faudra adapter cette logique.

```typescript
data.forEach((item) => {
if ("pollutant" in item && "value" in item && "unit" in item) {
// Données valides pour un appareil de mesure
measurementDevices.push(item as MeasurementDevice);
}
});
```

### 5. Ne pas tout casser à la première erreur

En cas d'erreur sur une source, on log, on retire la source de `loadingSources`, et on continue. Les autres sources gardent leurs données.

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

## Dépannage : quand ça ne se comporte pas comme prévu

### Cas fréquents

#### 1. Les appels API partent en boucle

**Ce que tu vois :** Les requêtes se répètent sans arrêt (regarde l’onglet Réseau du navigateur).

**Pourquoi :** La liste des dépendances de `useCallback` ou `useEffect` n’est pas bonne (objet recréé à chaque render, dépendance inutile, etc.).

**À faire :** Vérifier que tu ne mets que les vraies dépendances, et pas des dérivés (ex. `selectedSources.length`) :

```typescript
// Incorrect - peut causer des boucles
const fetchData = useCallback(async () => {
// ...
}, [selectedSources, selectedSources.length]); // selectedSources.length est redondant

// Correct
const fetchData = useCallback(async () => {
// ...
}, [selectedPollutant, selectedSources, selectedTimeStep]);
```

#### 2. Tu changes la sélection mais les données ne bougent pas

**Ce que tu vois :** Tu changes le polluant ou les sources, mais la carte (ou les listes) ne se met pas à jour.

**Pourquoi :** Un paramètre utilisé dans `fetchData` n’est pas dans la liste des dépendances de `useCallback`, donc la fonction ne se recrée pas et garde les anciennes valeurs.

**À faire :** Mettre *tous* les paramètres dont dépend le chargement dans le tableau de dépendances :

```typescript
const fetchData = useCallback(async () => {
// ...
}, [
selectedPollutant,
selectedSources,
selectedTimeStep,
signalAirPeriod,
mobileAirPeriod,
selectedMobileAirSensor,
signalAirOptions,
]);
```

#### 3. L’app devient lente ou rame après un moment

**Ce que tu vois :** Après avoir changé de page ou ouvert/fermé des panneaux, l’app ralentit ou consomme beaucoup de mémoire.

**Pourquoi :** Des `setInterval` ont été créés mais pas arrêtés au démontage du composant (timers orphelins).

**À faire :** Dans tout `useEffect` qui crée un intervalle, prévoir un cleanup qui appelle `clearInterval` :

```typescript
useEffect(() => {
const intervalId = setInterval(fetchData, interval);

return () => {
clearInterval(intervalId); // ← Toujours nettoyer
};
}, [dependencies]);
```

#### 4. Les sources « communautaires » ne remontent rien

**Ce que tu vois :** Tu coches NebuleAir (ou une autre source communautaire) mais aucun marqueur n’apparaît.

**Pourquoi :** Le code qui transforme `communautaire.nebuleair` en clé attendue par le service peut être incorrect, ou la source n’est pas mappée.

**À faire :** Vérifier que le mapping correspond bien à ce que le hook attend :

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

#### 5. Les données arrivent (onglet Réseau) mais rien ne s’affiche

**Ce que tu vois :** Les réponses API sont bien là, mais `devices` ou `reports` restent vides.

**Pourquoi :** La séparation entre « appareil de mesure » et « signalement » se fait selon la forme des objets ; si l’API a changé de format, rien ne matche.

**À faire :** Regarder la forme des objets reçus et adapter les conditions (présence de `pollutant`/`value`/`unit` vs `signalType`) :

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

### Un peu de debug

Le hook log déjà pas mal de choses (mapping des sources, services utilisés, etc.). Ouvre la console du navigateur (F12) pour voir ces messages et comprendre ce qui part en requête. Si tu ajoutes des `console.log` dans ton composant, tu peux inspecter `devices`, `reports`, `loadingSources` et `error` à chaque render.

### Côté performance

Le hook fait déjà pas mal le job : mémorisation des callbacks, nettoyage des intervalles, chargement progressif. Pour ne pas alourdir l’app :

- Utilise `React.memo` sur les composants enfants qui affichent les marqueurs ou les listes si tu as des re-renders en trop.
- Évite de tout cocher (toutes les sources en même temps) ; ça multiplie les appels.
- Désactive l’auto-refresh si tu n’en as pas besoin (économie de bande passante).
- En prod, privilégie un pas de temps plus large (heure/jour) plutôt que « Scan » ou 15 min si tu n’as pas besoin du temps réel.

---

## Résumé pour quelqu'un qui ne fait pas (ou peu) de React

Si tu viens d'un autre langage ou framework, voici l'essentiel sans le jargon :

1. **Ce que fait le hook** : Il centralise tout : appeler plusieurs APIs de qualité de l'air, mettre les données au même format, gérer chargement et erreurs, et optionnellement rafraîchir tout seul avec un timer selon le pas de temps.
2. **Comment on s'en sert** : Dans un composant React, tu appelles une fois `useAirQualityData({ ... })` avec la sélection de l'utilisateur (polluant, sources, pas de temps). Le hook te rend `devices`, `reports`, `loading`, `error`, etc. Dès qu'un de ces paramètres change, React réexécute le composant, le hook voit les nouvelles valeurs et relance les appels tout seul.
3. **Pas besoin de bouton « Rafraîchir » pour le cas standard** : Les sources « classiques » se rechargent dès que tu changes polluant, sources ou pas de temps. Pour SignalAir, c'est volontairement sur demande : tu incrémentes `loadTrigger` (par ex. au clic sur « Charger ») pour déclencher un rechargement.
4. **Cycle de vie** : À l'affichage du composant, le hook fait un premier chargement. Ensuite, à chaque changement de paramètres, un nouveau chargement. Si l'auto-refresh est activé, un timer relance le chargement périodiquement. Quand le composant disparaît, les timers sont nettoyés.

En bref : **tu donnes** la sélection (polluant, sources, pas de temps, options SignalAir/MobileAir) ; **tu reçois** les listes `devices` et `reports`, plus les indicateurs `loading`, `error`, `lastRefresh`. Tout le reste (appels API, fusion, intervalles) reste caché dans le hook.

---

## En conclusion

Le hook `useAirQualityData` est le cœur métier de ReactOpenAirMap : il s’occupe de toute la récupération et de la mise en forme des données, pour que tes composants n’aient qu’à afficher.

À retenir : le hook gère les données (et le chargement / les erreurs), tes composants gèrent l’UI ; l’auto-refresh suit le pas de temps ; une source en erreur ne bloque pas les autres ; et le code est pensé pour limiter les re-renders et bien nettoyer les timers.

Pour aller plus loin : doc React sur les [Hooks](https://reactjs.org/docs/hooks-intro.html), [useCallback](https://reactjs.org/docs/hooks-reference.html#usecallback) et [useEffect](https://reactjs.org/docs/hooks-reference.html#useeffect), et la [documentation technique](./DOCUMENTATION_TECHNIQUE.md) du projet.

---

_Cette doc est mise à jour avec le code. Pour le détail d’architecture et les conventions, voir la documentation technique._
