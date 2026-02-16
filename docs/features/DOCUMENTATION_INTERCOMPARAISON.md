# Documentation Technique - Fonctionnalité d'Intercomparaison

**Version** : 1.2
**Date** : 16 février 2026
**Auteur** : Équipe ReactOpenAirMap

---

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture technique](#architecture-technique)
3. [Composants principaux](#composants-principaux)
- AirQualityMap
- ComparisonSidePanel
- HistoricalChart
4. [Flux de données](#flux-de-données)
- Activation du mode comparaison
- Ajout d'une station
- Changement de polluant
5. [Services et APIs](#services-et-apis)
- AtmoRef Service
- AtmoMicro Service
- Différences entre les sources
- Requêtes HTTP complètes
6. [Récapitulatif : API vs Code](#récapitulatif--api-vs-code)
7. [Gestion des états](#gestion-des-états)
- StationInfo
- ComparisonState
8. [Transformation des données](#transformation-des-données)
- Normalisation timestamps
- Normalisation unités
- Structure chartData
9. [Cas particuliers](#cas-particuliers)
- Mode Scan
- connectNulls
- Limite de 10 stations
10. [Bugs corrigés](#bugs-corrigés)
11. [Guide de maintenance](#guide-de-maintenance)
12. [Résumé visuel](#résumé-visuel-du-fonctionnement)
13. [FAQ et Troubleshooting](#faq-et-troubleshooting)
14. [Annexes](#annexes)

---

## Vue d'ensemble

### Objectif

La fonctionnalité d'intercomparaison permet de **comparer les mesures de plusieurs stations de qualité de l'air sur un même graphique temporel**. Elle supporte la comparaison entre :

- **Stations AtmoRef** (stations de référence AtmoSud)
- **Sites AtmoMicro** (microcapteurs AtmoSud)
- **NebuleAir** (capteurs communautaires)
- **Mixte** : Comparaison entre ces sources (ex. AtmoRef + AtmoMicro + NebuleAir)

### Fonctionnalités clés

- Sélection multi-stations (maximum 10)
- Détection automatique des polluants communs
- Graphique temporel avec courbes superposées
- Gestion des résolutions temporelles différentes
- Contrôles de période et pas de temps
- Interface responsive avec redimensionnement

### Limitations

- Maximum **10 stations** comparables simultanément
- Comparaison d'**un seul polluant** à la fois (celui disponible dans toutes les stations)
- Supporte **AtmoRef**, **AtmoMicro** et **NebuleAir** (capteurs communautaires)

---

## Architecture technique

### Schéma global

```
┌─────────────────────────────────────────────────────────────┐
│ AirQualityMap │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ État de comparaison (ComparisonState) │ │
│ │ - isComparisonMode │ │
│ │ - comparedStations[] │ │
│ │ - comparisonData │ │
│ │ - selectedPollutant, timeRange, timeStep │ │
│ └──────────────────────────────────────────────────────┘ │
│ │ │
│ ▼ │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Handlers de comparaison │ │
│ │ - handleComparisonModeToggle() │ │
│ │ - handleAddStationToComparison() │ │
│ │ - handleRemoveStationFromComparison() │ │
│ │ - handleLoadComparisonData() │ │
│ └──────────────────────────────────────────────────────┘ │
│ │ │
│ ▼ │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ ComparisonSidePanel │ │
│ │ - Liste des stations │ │
│ │ - Sélecteur de polluant │ │
│ │ - Graphique (HistoricalChart) │ │
│ │ - Contrôles temporels │ │
│ └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
│
▼
┌────────────────────────┐
│ HistoricalChart │
│ - Transformation │
│ - Normalisation │
│ - Rendu Recharts │
└────────────────────────┘
```

### Stack technologique

- **React 18** : Composants fonctionnels avec hooks
- **TypeScript** : Typage complet
- **Recharts** : Bibliothèque de graphiques
- **Tailwind CSS** : Styling et responsive

---

## Composants principaux

### 1. AirQualityMap (Orchestrateur)

**Fichier** : `src/components/map/AirQualityMap.tsx`

**Responsabilités** :

- Gestion de l'état global de comparaison
- Activation/désactivation du mode comparaison
- Ajout/suppression de stations
- Chargement des données historiques
- Coordination entre la carte et le panel

**État géré** : L’état de comparaison est exposé via `sidePanels.comparisonState` et mis à jour via `sidePanels.setComparisonState` (hook / état parent).

```typescript
interface ComparisonState {
isComparisonMode: boolean; // Mode actif/inactif
comparedStations: StationInfo[]; // Stations sélectionnées (max 10)
comparisonData: Record<string, Record<string, HistoricalDataPoint[]>>;
selectedPollutant: string; // Polluant affiché
timeRange: TimeRange; // Période temporelle
timeStep: string; // Pas de temps (scan, 15min, 1h, 1j)
loading: boolean;
error: string | null;
}
```

**Fonctions clés** :

```typescript
// Activation du mode comparaison (ligne 714-724)
const handleComparisonModeToggle = () => {
setComparisonState((prev) => ({
...prev,
isComparisonMode: !prev.isComparisonMode,
comparedStations:
!prev.isComparisonMode && selectedStation
? [selectedStation] // Ajoute la station actuelle comme première
: prev.comparedStations,
}));
};

// Ajout d'une station à la comparaison (AirQualityMap.tsx, ~ligne 433)
// Comportement : si la station est déjà dans la liste, elle est retirée (toggle).
const handleAddStationToComparison = async (device: MeasurementDevice) => {
// 1. Si déjà ajoutée → retirer (désélection)
const isAlreadyAdded = comparisonState.comparedStations.some(
(station) => station.id === device.id
);
if (isAlreadyAdded) {
handleRemoveStationFromComparison(device.id);
return;
}

// 2. Vérifier limite (MAX_COMPARISON_STATIONS = 10)
if (comparisonState.comparedStations.length >= MAX_COMPARISON_STATIONS) return;

// 3. Récupérer les variables disponibles via API
let variables = {};
let sensorModel: string | undefined;
let lastSeenSec: number | undefined;
if (device.source === "atmoRef") {
variables = await atmoRefService.fetchStationVariables(device.id);
} else if (device.source === "atmoMicro") {
const siteInfo = await atmoMicroService.fetchSiteVariables(device.id);
variables = siteInfo.variables;
sensorModel = siteInfo.sensorModel;
} else if (device.source === "nebuleair") {
const siteInfo = await nebuleAirService.fetchSiteInfo(device.id);
variables = siteInfo.variables;
lastSeenSec = siteInfo.lastSeenSec;
}

// 4. Créer StationInfo et ajouter à l'état
const stationInfo: StationInfo = {
id: device.id,
name: device.name,
address: device.address || "",
departmentId: device.departmentId || "",
source: device.source,
variables,
...(sensorModel !== undefined && { sensorModel }),
...(lastSeenSec !== undefined && { lastSeenSec }),
};

setComparisonState((prev) => ({
...prev,
comparedStations: [...prev.comparedStations, stationInfo],
}));
};

// Chargement des données de comparaison
// Implémentation dans src/components/map/handlers/comparisonHandlers.ts
// (createLoadComparisonDataHandler). Supporte atmoRef, atmoMicro et nebuleair.
const handleLoadComparisonData = async (
stations: StationInfo[],
pollutant: string,
timeRange: TimeRange,
timeStep: string
) => {
setComparisonState((prev) => ({ ...prev, loading: true, error: null }));

try {
const { startDate, endDate } = getDateRange(timeRange);
const newComparisonData = {};

for (const station of stations) {
let stationData = [];
if (station.source === "atmoRef") {
stationData = await atmoRefService.fetchHistoricalData({ ... });
} else if (station.source === "atmoMicro") {
stationData = await atmoMicroService.fetchHistoricalData({ ... });
} else if (station.source === "nebuleair") {
stationData = await nebuleAirService.fetchHistoricalData({
sensorId: station.id,
pollutant,
timeStep,
startDate,
endDate,
});
}
if (!newComparisonData[pollutant]) newComparisonData[pollutant] = {};
newComparisonData[pollutant][station.id] = stationData;
}

setComparisonState((prev) => ({
...prev,
comparisonData: newComparisonData,
selectedPollutant: pollutant,
timeRange,
timeStep,
loading: false,
}));
} catch (error) {
setComparisonState((prev) => ({
...prev,
loading: false,
error: "Erreur lors du chargement des données",
}));
}
};
```

### 2. ComparisonSidePanel (Interface)

**Fichier** : `src/components/panels/ComparisonSidePanel.tsx`

**Responsabilités** :

- Affichage de l'interface de comparaison
- Liste des stations comparées avec suppression
- Sélection du polluant commun
- Affichage du graphique
- Contrôles de période et pas de temps

**Fonctions clés** :

```typescript
// Détection des polluants disponibles dans TOUTES les stations (ligne 54-81)
const isPollutantAvailableInAllStations = (pollutantCode: string): boolean => {
return comparisonState.comparedStations.every((station) => {
return Object.entries(station.variables || {}).some(([code, variable]) => {
let mappedCode = code;

// Mapping AtmoRef : codes numériques → codes normalisés
if (station.source === "atmoRef") {
const atmoRefMapping = {
"01": "so2",
"03": "no2",
"08": "o3",
"24": "pm10",
"39": "pm25",
"68": "pm1",
};
mappedCode = atmoRefMapping[code] || code;
}
// AtmoMicro : déjà normalisés ("pm25", "pm10", etc.)

return mappedCode === pollutantCode && variable.en_service;
});
});
};

// Obtenir la liste des polluants communs (ligne 89-98)
const getAvailablePollutants = (): string[] => {
if (comparisonState.comparedStations.length === 0) return [];

return Object.entries(pollutants)
.filter(([pollutantCode]) => {
return isPollutantAvailableInAllStations(pollutantCode);
})
.map(([pollutantCode]) => pollutantCode);
};
```

**Interface utilisateur** :

1. **Header** : Titre + nombre de stations + boutons de contrôle
2. **Stations sélectionnées** : Liste avec bouton de suppression
3. **Sélecteur de polluant** : Dropdown avec polluants communs uniquement
4. **Graphique** : HistoricalChart en mode "comparison"
5. **Note mode Scan** : Bandeau informatif (si timeStep === "instantane")
6. **Contrôles temporels** : Période + Pas de temps

### 3. HistoricalChart (Visualisation)

**Fichier** : `src/components/charts/HistoricalChart.tsx`

**Responsabilités** :

- Transformation des données pour Recharts
- Normalisation des timestamps
- Groupement par unité
- Rendu du graphique avec Recharts

**Modes de fonctionnement** :

```typescript
// Props du composant
interface HistoricalChartProps {
data: Record<string, HistoricalDataPoint[]>;
selectedPollutants: string[];
source: string; // "comparison" | "atmoRef" | "atmoMicro" | ...
onHasCorrectedDataChange?: (hasCorrectedData: boolean) => void;
stations?: StationInfo[]; // Requis en mode "comparison"
}
```

**Transformation des données - Mode comparaison** :

```typescript
// Mode comparaison : données par station (ligne 114-173)
if (source === "comparison" && stations.length > 0) {
const allTimestamps = new Map<number, string>(); // Timestamps normalisés
const pollutant = selectedPollutants[0];

// 1. Collecter tous les timestamps uniques (en millisecondes)
stations.forEach((station) => {
if (data[station.id]) {
data[station.id].forEach((point) => {
const timestampMs = new Date(point.timestamp).getTime();
if (!allTimestamps.has(timestampMs)) {
allTimestamps.set(timestampMs, point.timestamp);
}
});
}
});

// 2. Trier les timestamps
const sortedTimestamps = Array.from(allTimestamps.entries()).sort(
(a, b) => a[0] - b[0]
);

// 3. Créer les points de données
const transformedData = sortedTimestamps.map(([timestampMs, _]) => {
const point: any = {
timestamp: new Date(timestampMs).toLocaleString("fr-FR", {...}),
rawTimestamp: timestampMs,
};

// Ajouter les valeurs pour chaque station
stations.forEach((station) => {
if (data[station.id]) {
const dataPoint = data[station.id].find(
(p) => new Date(p.timestamp).getTime() === timestampMs
);
if (dataPoint) {
point[station.id] = dataPoint.value; // Clé = ID station
point[`${station.id}_unit`] = dataPoint.unit;
}
}
});

return point;
});

return transformedData;
}
```

**Rendu du graphique** :

```typescript
// Une ligne par station en mode comparaison (ligne 420-444)
{source === "comparison" && stations.length > 0
? stations.map((station, index) => {
const pollutant = selectedPollutants[0];
const stationColor = fallbackColors[index % fallbackColors.length];
const pollutantName = pollutants[pollutant]?.name || pollutant;

return (
<Line
key={station.id}
type="monotone"
dataKey={station.id} // Clé = ID station
yAxisId="left"
stroke={stationColor} // Couleur unique par station
strokeWidth={2}
strokeDasharray="0"
dot={{ r: 3 }}
activeDot={{ r: 5 }}
name={`${station.name} - ${pollutantName}`}
connectNulls={true} // Important : relier malgré les gaps
/>
);
})
: /* Mode normal */
}
```

## Services et APIs

### AtmoRef Service

**Fichier** : `src/services/AtmoRefService.ts`

**Méthode clé pour la comparaison** :

```typescript
// Récupération des variables disponibles (ligne 234-260)
async fetchStationVariables(stationId: string): Promise<
Record<string, { label: string; code_iso: string; en_service: boolean }>
> {
const url = `https://api.atmosud.org/observations/stations?format=json&station_en_service=true&download=false&metadata=true`;
const response = await this.makeRequest(url);

const station = response.stations.find(
(s: AtmoRefStation) => s.id_station === stationId
);

return station.variables; // Format : { "01": {...}, "03": {...}, ... }
}
```

**Requête HTTP complète** :

```
GET https://api.atmosud.org/observations/stations?format=json&station_en_service=true&download=false&metadata=true
```

**Paramètres** :

- `format=json` : Format de réponse JSON
- `station_en_service=true` : Uniquement les stations actives
- `download=false` : Pas de téléchargement de fichier
- `metadata=true` : **CRUCIAL** - Inclure les métadonnées dont les variables

**Attention :** Sans `metadata=true`, le champ `variables` n'est pas retourné par l'API !**

**Format de réponse API brut** :

```json
{
"stations": [
{
"id_station": "FR00008",
"nom_station": "Marseille Place Verneuil",
"departement_id": "13",
"adresse": "Place Henri Verneuil",
"latitude": 43.30885,
"longitude": 5.36788,
"en_service": true,
"date_debut_mesure": "2018-10-16T15:00:00+00:00",
"date_fin_mesure": null,
"variables": {
"01": {
"label": "SO2",
"code_iso": "01",
"date_fin": null,
"date_debut": "2019-03-08T12:00:00+00:00",
"en_service": true
},
"03": {
"label": "NO2",
"code_iso": "03",
"date_fin": null,
"date_debut": "2019-03-08T12:00:00+00:00",
"en_service": true
},
"24": {
"label": "PM10",
"code_iso": "24",
"date_fin": "2023-03-27T14:30:00+00:00",
"date_debut": "2018-10-16T15:00:00+00:00",
"en_service": false
},
"39": {
"label": "PM2.5",
"code_iso": "39",
"date_fin": null,
"date_debut": "2021-12-10T00:00:00+00:00",
"en_service": true
},
"68": {
"label": "PM1",
"code_iso": "68",
"date_fin": "2023-03-28T00:00:00+00:00",
"date_debut": "2021-04-28T00:00:00+00:00",
"en_service": false
}
}
}
]
}
```

**Format retourné par `fetchStationVariables()`** :

```json
{
"01": {
"label": "SO2",
"code_iso": "01",
"date_fin": null,
"date_debut": "2019-03-08T12:00:00+00:00",
"en_service": true
},
"03": {
"label": "NO2",
"code_iso": "03",
"date_fin": null,
"date_debut": "2019-03-08T12:00:00+00:00",
"en_service": true
},
"39": {
"label": "PM2.5",
"code_iso": "39",
"date_fin": null,
"date_debut": "2021-12-10T00:00:00+00:00",
"en_service": true
}
}
```

**Note importante** : Le champ `en_service` dans les variables indique si cette mesure est actuellement active. Une variable avec `date_fin` non-null et `en_service: false` n'est plus mesurée.

**Mapping des codes** :

```typescript
// Défini dans src/types/index.ts
export const ATMOREF_POLLUTANT_MAPPING: Record<string, string> = {
"01": "so2", // SO2
"03": "no2", // NO2
"08": "o3", // O3
"24": "pm10", // PM10
"39": "pm25", // PM2.5
"68": "pm1", // PM1
};
```

### AtmoMicro Service

**Fichier** : `src/services/AtmoMicroService.ts`

**Méthode clé pour la comparaison** : Retourne un objet `{ variables, sensorModel? }`. L’appelant utilise `siteInfo.variables` pour construire la `StationInfo`.

```typescript
// Récupération des variables disponibles (AtmoMicroService.ts)
async fetchSiteVariables(siteId: string): Promise<{
variables: Record<string, { label: string; code_iso: string; en_service: boolean }>;
sensorModel?: string;
}> {
const allSites = await this.getCachedAllSites();
const site = allSites.find((s) => s.id_site.toString() === siteId);
if (!site) return { variables: {} };

const variablesString = site.variables;
const availableVariables = {};

const variableList = variablesString.split(",").map((v) => v.trim());
for (const variable of variableList) {
const pollutantCode = ATMOMICRO_POLLUTANT_MAPPING[variable];
if (pollutantCode && pollutants[pollutantCode]) {
availableVariables[pollutantCode] = {
label: pollutants[pollutantCode].name,
code_iso: variable,
en_service: true,
};
}
}

const sensorModel = site.modele_capteur || undefined;
return { variables: availableVariables, sensorModel };
}
```

**Requête HTTP complète** :

```
GET https://api.atmosud.org/observations/capteurs/sites?format=json&actifs=2880
```

**Paramètres** :

- `format=json` : Format de réponse JSON
- `actifs=2880` : Sites actifs dans les dernières 2880 minutes (48 heures)

**Note** : Contrairement à AtmoRef, il n'y a **pas de paramètre `metadata`**. Le champ `variables` est toujours retourné.

**Format de réponse API brut** :

```json
[
{
"id_site": 1175,
"nom_site": "Aix-en-Provence Centre",
"type_site": "Fixe",
"influence": "urbain",
"lon": 5.4454,
"lat": 43.5263,
"code_station_commun": "FR27001",
"date_debut_site": "2020-01-15T00:00:00",
"date_fin_site": "2099-12-31T23:59:59",
"alti_mer": 150,
"alti_sol": 3,
"id_campagne": 42,
"nom_campagne": "Réseau urbain Aix",
"id_capteur": 234,
"marque_capteur": "Sensirion",
"modele_capteur": "SPS30",
"variables": "PM10, PM2.5, Air Pres., Air Temp., Air Hum., PM1"
},
{
"id_site": 1232,
"nom_site": "Marseille Prado",
"variables": "PM10, PM2.5, NO2, O3"
}
]
```

**Important** : Le champ `variables` dans l'API est une **chaîne de caractères** (string), **PAS un objet JSON**.

**Exemple de réponse API réelle** :

```json
{
"id_site": 1175,
"nom_site": "Aix-en-Provence Centre",
"variables": "PM10, PM2.5, Air Pres., Air Temp., Air Hum., PM1" // ← STRING !
}
```

**Format retourné par `fetchSiteVariables()`** (objet créé par notre code) :

```json
{
"pm25": {
"label": "PM₂.₅",
"code_iso": "PM2.5",
"en_service": true
},
"pm10": {
"label": "PM₁₀",
"code_iso": "PM10",
"en_service": true
},
"pm1": {
"label": "PM₁",
"code_iso": "PM1",
"en_service": true
}
}
```

**Attention :** Les champs `label`, `code_iso` et `en_service` sont créés par NOTRE code** (ligne 268-272 de AtmoMicroService.ts), **ils ne viennent PAS directement de l'API**.

**Processus de transformation détaillé** :

```typescript
// 1. API retourne
site.variables = "PM10, PM2.5, Air Pres., Air Temp., Air Hum., PM1"

// 2. Split par virgule et trim
variableList = ["PM10", "PM2.5", "Air Pres.", "Air Temp.", "Air Hum.", "PM1"]

// 3. Pour chaque variable, mapper via ATMOMICRO_POLLUTANT_MAPPING
"PM2.5" → pollutantCode = "pm25"
"PM10" → pollutantCode = "pm10"
"PM1" → pollutantCode = "pm1"
"Air Pres." → pollutantCode = undefined (ignoré, pas un polluant)

// 4. Filtrage : Garder uniquement les variables qui sont des polluants
if (pollutantCode && pollutants[pollutantCode]) {
// Air Pres., Air Temp., Air Hum. sont ignorés
}

// 5. Construction de l'objet de retour (CRÉÉ par notre code)
availableVariables[pollutantCode] = {
label: pollutants[pollutantCode].name, // "PM₂.₅" depuis nos constantes
code_iso: variable, // "PM2.5" original de l'API
en_service: true // Supposé true si listé
};
```

**Résultat final** : Objet compatible avec le format AtmoRef pour faciliter la comparaison.

**Mapping des codes** :

```typescript
// Défini dans src/types/index.ts
export const ATMOMICRO_POLLUTANT_MAPPING: Record<string, string> = {
"PM2.5": "pm25",
PM10: "pm10",
PM1: "pm1",
NO2: "no2",
O3: "o3",
SO2: "so2",
};
```

### Différences importantes entre les sources

| Aspect | AtmoRef | AtmoMicro |
| --------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| **Format variables API** | Objet JSON structuré | Chaîne de caractères (string) |
| **Codes dans l'API** | Codes numériques (`"01"`, `"03"`, `"24"`) | Codes texte (`"PM2.5"`, `"PM10"`, `"NO2"`) |
| **Clés retournées** | Codes bruts (`"01"`, `"39"`) | **Normalisées** (`"pm25"`, `"pm10"`) |
| **Transformation** | Aucune (données brutes) | Oui (parsing + construction d'objet) |
| **Mapping nécessaire** | Oui (`"01" → "so2"`) | Non (déjà `"pm25"`) |
| **Champs API** | `label`, `code_iso`, `date_debut`, `date_fin`, `en_service` | Uniquement `variables` (string) |
| **Champs créés par code** | Aucun (tout vient de l'API) | `label`, `code_iso`, `en_service` (objet entier construit) |
| **Variables non-polluants** | Uniquement polluants | Inclut Air Pres., Air Temp., Air Hum. (filtrés par notre code) |

**Différence clé** à comprendre** :

**AtmoRef** :

- L'API retourne **directement** un objet structuré avec tous les champs
- **Pas de transformation**, on utilise `station.variables` tel quel
- Les **clés** sont les codes numériques de l'API (`"01"`, `"03"`, `"39"`)

**AtmoMicro** :

- L'API retourne seulement une **string** : `"PM10, PM2.5, Air Pres., ..."`
- **Transformation complète** : parsing + filtrage + construction d'objet
- Les **clés** sont normalisées par notre code (`"pm25"`, `"pm10"`, `"pm1"`)
- Le champ `code_iso` stocke le texte original (`"PM2.5"`) pour référence

**Conséquence pour la comparaison** :

- Dans `ComparisonSidePanel`, les clés AtmoRef (`"01"`) **doivent être mappées** vers `"so2"`
- Les clés AtmoMicro (`"pm25"`) sont **déjà normalisées**, pas de mapping nécessaire

---

## Récapitulatif : API vs Code

Pour clarifier ce qui vient directement de l'API et ce qui est créé/transformé par notre code :

### AtmoRef : Données brutes de l'API

| Champ | Source | Valeur exemple | Transformation |
| ------------------ | ------ | ----------------------------- | -------------- |
| **Clé de l'objet** | API | `"01"`, `"03"`, `"39"` | Aucune |
| `label` | API | `"SO2"`, `"NO2"`, `"PM2.5"` | Aucune |
| `code_iso` | API | `"01"`, `"03"`, `"39"` | Aucune |
| `date_debut` | API | `"2019-03-08T12:00:00+00:00"` | Aucune |
| `date_fin` | API | `null` ou `"2025-08-12..."` | Aucune |
| `en_service` | API | `true` ou `false` | Aucune |

**Résumé AtmoRef** : `return station.variables` → **Aucune transformation**, données brutes de l'API.

### AtmoMicro : Données transformées par notre code

| Champ | Source | Valeur exemple | Transformation |
| ------------------ | ------- | ---------------------------- | --------------------------------------- |
| **Clé de l'objet** | Code | `"pm25"`, `"pm10"`, `"pm1"` | Mapping `"PM2.5" → "pm25"` |
| `label` | Code | `"PM₂.₅"`, `"PM₁₀"`, `"PM₁"` | Pris depuis `pollutants[].name` |
| `code_iso` | API | `"PM2.5"`, `"PM10"`, `"PM1"` | String originale conservée |
| `en_service` | Code | `true` | Toujours `true` (si présent = actif) |

**Résumé AtmoMicro** : L'API retourne `variables: "PM10, PM2.5, ..."` (string) → **Transformation complète** pour créer un objet compatible avec AtmoRef.

### Pourquoi cette différence ?

**AtmoRef** : L'API est bien structurée et retourne déjà un objet JSON avec tous les champs nécessaires.

**AtmoMicro** : L'API retourne seulement une liste de noms séparés par virgules → Notre code doit :

1. Parser la string
2. Filtrer les polluants (ignorer Air Pres., Air Temp., etc.)
3. Normaliser les clés (`"PM2.5" → "pm25"`)
4. Construire un objet compatible avec le format AtmoRef
5. Ajouter les champs manquants (`label`, `en_service`)

**Objectif final** : Avoir le **même format de `variables`** pour les deux sources afin de faciliter le traitement unifié dans `ComparisonSidePanel`.

### Pourquoi créer des champs non utilisés ?

**Question** : Pourquoi créer `label` et `code_iso` pour AtmoMicro alors qu'ils ne sont jamais utilisés dans le code ?

**Analyse de l'utilisation réelle** :

| Champ | Créé pour AtmoMicro | Utilisé dans le code | Nécessité |
| ------------ | ------------------- | -------------------- | ---------------- |
| `label` | Oui | **JAMAIS** | Non utilisé |
| `code_iso` | Oui | **JAMAIS** | Non utilisé |
| `en_service` | Oui | **OUI** (partout) | **ESSENTIEL** |

**Seul `en_service` est réellement utilisé** :

```typescript
// Vérifié dans tous les side panels
return mappedCode === pollutantCode && variable.en_service;
```

**Pourquoi les créer quand même ?**

**Raison #1 - Interface TypeScript commune** :

```typescript
// Type unifié pour les deux sources
interface StationVariable {
label: string; // ← Requis par le type
code_iso: string; // ← Requis par le type
en_service: boolean;
}

// Sans ces champs, erreur TypeScript :
// Type '{ en_service: boolean }' is not assignable to type
// '{ label: string; code_iso: string; en_service: boolean }'
```

**Raison #2 - Cohérence et simplicité** :

- Même structure pour AtmoRef et AtmoMicro
- Pas besoin de types conditionnels complexes
- Code plus simple et maintenable

**Raison #3 - Évolutivité** :
Ces champs pourraient être utilisés à l'avenir pour :

- Afficher le label original de l'API dans un tooltip
- Debugging : Tracer la correspondance API ↔ Code normalisé
- Mapping inverse si besoin de requêtes API supplémentaires

**Raison #4 - Performance négligeable** :
Créer 2 strings supplémentaires par polluant n'a aucun impact sur les performances (< 1ms).

**Alternative envisagée mais rejetée** :

```typescript
// Option : Types différents par source
type AtmoRefVariable = { label: string; code_iso: string; en_service: boolean; ... };
type AtmoMicroVariable = { en_service: boolean }; // Minimal

// Problème : Complexifie le code avec des guards de type partout
if (station.source === "atmoRef" && "label" in variable) {
// ...
}
```

**Décision de design** : **Garder les champs inutilisés** pour privilégier la simplicité et la cohérence du code, au détriment d'une micro-optimisation négligeable.

### Requêtes pour les données historiques

#### AtmoRef - Données historiques

**Requête HTTP** (exemple pour PM2.5, 1h, dernières 24h) :

```
GET https://api.atmosud.org/observations/stations/mesures?format=json&station_id=FR24039&nom_polluant=pm2.5&temporalite=horaire&download=false&metadata=true&date_debut=2025-10-08T10:00:00Z&date_fin=2025-10-09T10:00:00Z
```

**Paramètres** :

- `station_id` : ID de la station (ex: `FR24039`)
- `nom_polluant` : Nom du polluant (ex: `pm2.5`, `pm10`, `no2`)
- `temporalite` : Granularité (`quart-horaire`, `horaire`, `journalière`)
- `date_debut` / `date_fin` : Période au format ISO 8601

**Réponse** :

```json
{
"mesures": [
{
"id_station": "FR24039",
"nom_station": "Marseille Place Verneuil",
"date_debut": "2025-10-09T07:00:00+00:00",
"valeur": 4.8,
"unite": "µg-m3",
"validation": "validée"
},
{
"id_station": "FR24039",
"date_debut": "2025-10-09T08:00:00+00:00",
"valeur": 4.7,
"unite": "µg-m3",
"validation": "validée"
}
]
}
```

#### AtmoMicro - Données historiques

**Requête HTTP** (exemple pour PM2.5, brute, dernières 3h) :

```
GET https://api.atmosud.org/observations/capteurs/mesures?id_site=1175&format=json&download=false&nb_dec=1&valeur_brute=true&variable=pm2.5&type_capteur=true&aggregation=brute&debut=2025-10-09T07:00:00Z&fin=2025-10-09T10:00:00Z
```

**Paramètres** :

- `id_site` : ID du site (ex: `1175`)
- `variable` : Variable mesurée (ex: `pm2.5`, `pm10`)
- `aggregation` : Type d'agrégation (`brute`, `quart-horaire`, `horaire`)
- `valeur_brute=true` : Inclure les valeurs brutes
- `debut` / `fin` : Période au format ISO 8601

**Réponse** :

```json
[
{
"id_site": 1175,
"nom_site": "Aix-en-Provence Centre",
"variable": "PM2.5",
"time": "2025-10-09T07:04:07Z",
"lat": 43.5263,
"lon": 5.4454,
"valeur": null,
"valeur_ref": null,
"valeur_brute": 2,
"unite": "µg/m3",
"marque_capteur": "Sensirion",
"modele_capteur": "SPS30"
},
{
"id_site": 1175,
"time": "2025-10-09T07:06:19Z",
"valeur": null,
"valeur_ref": null,
"valeur_brute": 2,
"unite": "µg/m3"
}
]
```

**Champs importants** :

- `valeur` : Valeur corrigée (peut être `null`)
- `valeur_ref` : Valeur de référence corrigée (peut être `null`)
- `valeur_brute` : Valeur brute du capteur (toujours présent)
- `has_correction` : Calculé par notre code (si `valeur !== valeur_brute`)

---

## Gestion des états

### Structure StationInfo

```typescript
export interface StationInfo {
id: string; // ID unique de la station
name: string; // Nom de la station
address: string; // Adresse complète
departmentId: string; // ID du département
source: string; // "atmoRef" | "atmoMicro" | "nebuleair"
variables: Record<string, StationVariable>; // Variables disponibles
sensorModel?: string; // Modèle du capteur (AtmoMicro)
lastSeenSec?: number; // Dernière émission en secondes (NebuleAir)
}

interface StationVariable {
label: string; // Nom complet du polluant
code_iso: string; // Code ISO original de l'API
en_service: boolean; // Si la variable est actuellement active
// Champs supplémentaires pour AtmoRef :
date_debut?: string; // Date de début de mesure (AtmoRef uniquement)
date_fin?: string | null; // Date de fin de mesure (AtmoRef uniquement)
}
```

**Exemples de variables selon la source** :

**AtmoRef** (format retourné directement par l'API) :

```json
{
"01": {
"label": "SO2",
"code_iso": "01",
"date_debut": "2019-03-08T12:00:00+00:00",
"date_fin": null,
"en_service": true
},
"03": {
"label": "NO2",
"code_iso": "03",
"date_debut": "2019-03-08T12:00:00+00:00",
"date_fin": null,
"en_service": true
},
"39": {
"label": "PM2.5",
"code_iso": "39",
"date_debut": "2021-12-10T00:00:00+00:00",
"date_fin": null,
"en_service": true
},
"24": {
"label": "PM10",
"code_iso": "24",
"date_debut": "2018-10-16T15:00:00+00:00",
"date_fin": "2023-03-27T14:30:00+00:00",
"en_service": false
}
}
```

** Tous ces champs viennent directement de l'API** - Aucune transformation appliquée.

**Code source** (AtmoRefService.ts ligne 252) :

```typescript
return station.variables; // Retourné tel quel depuis l'API
```

**AtmoMicro** (objet créé par `fetchSiteVariables()`) :

```json
{
"pm25": {
"label": "PM₂.₅",
"code_iso": "PM2.5",
"en_service": true
},
"pm10": {
"label": "PM₁₀",
"code_iso": "PM10",
"en_service": true
}
}
```

**Important** : Pour AtmoMicro, cet objet est **entièrement construit par notre code** :

- `label` : Pris depuis `pollutants[pollutantCode].name` (nos constantes)
- `code_iso` : Variable originale de l'API (`"PM2.5"`, `"PM10"`) stockée pour référence
- `en_service` : Toujours `true` car si la variable est dans la string, on suppose qu'elle est active

**Code source** (AtmoMicroService.ts ligne 268-272) :

```typescript
availableVariables[pollutantCode] = {
label: pollutants[pollutantCode].name, // "PM₂.₅" depuis constants/pollutants.ts
code_iso: variable, // "PM2.5" original de l'API
en_service: true, // Supposé actif si présent dans la liste
};
```

**Objectif** : Créer le même format que AtmoRef pour permettre un traitement unifié dans `ComparisonSidePanel`.

### Structure ComparisonState

```typescript
export interface ComparisonState {
isComparisonMode: boolean;
comparedStations: StationInfo[]; // Max 10 stations
comparisonData: Record<string, Record<string, HistoricalDataPoint[]>>;
selectedPollutant: string;
timeRange: TimeRange;
timeStep: string;
loading: boolean;
error: string | null;
}
```

**Structure détaillée de `comparisonData`** :

```typescript
// Exemple avec 2 stations comparant PM2.5
comparisonData = {
pm25: {
// Clé = polluant
FR24039: [
// Clé = ID station AtmoRef
{
timestamp: "2025-10-09T07:00:00+00:00",
value: 4.8,
unit: "µg-m3",
},
{
timestamp: "2025-10-09T07:15:00+00:00",
value: 4.8,
unit: "µg-m3",
},
// ... 13 points au total (tous les 15min)
],
"1175": [
// Clé = ID site AtmoMicro
{
timestamp: "2025-10-09T07:04:07Z",
value: 2,
unit: "µg/m3",
corrected_value: undefined,
raw_value: 2,
has_correction: false,
},
{
timestamp: "2025-10-09T07:06:19Z",
value: 2,
unit: "µg/m3",
corrected_value: undefined,
raw_value: 2,
has_correction: false,
},
// ... 81 points au total (tous les ~2min)
],
},
};
```

**Points clés** :

- Niveau 1 : Polluant (`"pm25"`, `"pm10"`, etc.)
- Niveau 2 : ID de station (`"FR24039"`, `"1175"`, etc.)
- Niveau 3 : Array de points de données historiques
- Les timestamps sont **différents** entre les sources (résolutions variables)

### Initialisation

```typescript
// Dans AirQualityMap.tsx (ligne 101-112)
const [comparisonState, setComparisonState] = useState<ComparisonState>({
isComparisonMode: false,
comparedStations: [],
comparisonData: {},
selectedPollutant: selectedPollutant, // Hérite du polluant global
timeRange: {
type: "preset",
preset: "24h",
},
timeStep: "heure",
loading: false,
error: null,
});
```

---

## Transformation des données

### Problématique des timestamps

**Challenge** : Les deux sources utilisent des formats de timestamps différents :

- **AtmoRef** : `"2025-10-09T07:00:00+00:00"` (timezone explicite +00:00)
- **AtmoMicro** : `"2025-10-09T07:04:07Z"` (format Zulu = UTC, équivalent à +00:00)

**Problème critique** : La comparaison stricte `===` échoue même pour le **même instant** :

```javascript
// Ces deux timestamps représentent LE MÊME INSTANT (07:00:00 UTC)
const timestamp1 = "2025-10-09T07:00:00+00:00"; // AtmoRef
const timestamp2 = "2025-10-09T07:00:00Z"; // AtmoMicro

timestamp1 === timestamp2; // false ! (formats différents)

// Conséquence du bug : Les données ne sont jamais matchées
const dataPoint = data[station.id].find(
(p) => p.timestamp === timestamp // Jamais de match
);
// Résultat : dataPoint = undefined → Pas de valeur dans le point du graphique
```

**Solution** : Normalisation via **timestamps numériques** (millisecondes depuis epoch Unix)

#### Conversion en millisecondes

JavaScript fournit `Date.getTime()` qui convertit **n'importe quel format ISO 8601** en nombre :

```javascript
const date1 = new Date("2025-10-09T07:00:00+00:00");
const date2 = new Date("2025-10-09T07:00:00Z");

console.log(date1.getTime()); // 1759993200000
console.log(date2.getTime()); // 1759993200000 ← IDENTIQUE !

date1.getTime() === date2.getTime(); // true !
```

**Magie** : `getTime()` retourne le **nombre de millisecondes depuis le 1er janvier 1970 00:00:00 UTC** (timestamp Unix), indépendamment du format de la string.

#### Implémentation dans le code

**Étape 1 : Collection des timestamps normalisés**

```typescript
// Structure : Map<millisecondes, string originale>
const allTimestamps = new Map<number, string>();

stations.forEach((station) => {
if (data[station.id]) {
data[station.id].forEach((point) => {
// Convertir en millisecondes
const timestampMs = new Date(point.timestamp).getTime();

// Utiliser les millisecondes comme clé (détection automatique des doublons)
if (!allTimestamps.has(timestampMs)) {
allTimestamps.set(timestampMs, point.timestamp);
}
});
}
});

// Résultat : Map avec clés numériques uniques
// Map {
// 1759993200000 => "2025-10-09T07:00:00+00:00",
// 1759993447000 => "2025-10-09T07:04:07Z",
// 1759993579000 => "2025-10-09T07:06:19Z",
// ...
// }
```

**Étape 2 : Tri chronologique**

```typescript
// Convertir en array et trier numériquement
const sortedTimestamps = Array.from(allTimestamps.entries()).sort(
(a, b) => a[0] - b[0] // Tri sur les millisecondes (a[0])
);

// Résultat : Array trié chronologiquement
// [
// [1759993200000, "2025-10-09T07:00:00+00:00"],
// [1759993447000, "2025-10-09T07:04:07Z"],
// ...
// ]
```

**Étape 3 : Recherche des valeurs par comparaison numérique**

```typescript
// Pour chaque timestamp normalisé, chercher les valeurs de chaque station
const transformedData = sortedTimestamps.map(([timestampMs, originalTimestamp]) => {
const point: any = {
timestamp: new Date(timestampMs).toLocaleString("fr-FR", {...}),
rawTimestamp: timestampMs,
};

stations.forEach((station) => {
if (data[station.id]) {
// Comparaison numérique au lieu de strings
const dataPoint = data[station.id].find(
(p) => new Date(p.timestamp).getTime() === timestampMs
);

if (dataPoint) {
point[station.id] = dataPoint.value; // Valeur trouvée
point[`${station.id}_unit`] = dataPoint.unit;
}
// Sinon : point[station.id] reste undefined
}
});

return point;
});
```

#### Exemple avec vos données réelles

**Recherche du timestamp 1759993200000 (07:00:00 UTC)** :

```javascript
// AtmoRef
const dataPoint = data["FR24039"].find(
p => new Date(p.timestamp).getTime() === 1759993200000
);
// new Date("2025-10-09T07:00:00+00:00").getTime() = 1759993200000
// MATCH ! Retourne { timestamp: "...", value: 4.8, unit: "µg-m3" }

// AtmoMicro
const dataPoint = data["1175"].find(
p => new Date(p.timestamp).getTime() === 1759993200000
);
// Aucun point à exactement 07:00:00, le premier est à 07:04:07
// new Date("2025-10-09T07:04:07Z").getTime() = 1759993447000
// 1759993447000 !== 1759993200000
// Retourne undefined

// Point du graphique généré
{
timestamp: "09 oct., 09:00",
rawTimestamp: 1759993200000,
FR24039: 4.8, // Valeur trouvée
1175: undefined // Pas de mesure à cet instant précis
}
```

#### Avantages de cette approche

**Compatible tous formats ISO 8601** :

- `"2025-10-09T07:00:00Z"` (Zulu)
- `"2025-10-09T07:00:00+00:00"` (timezone explicite)
- `"2025-10-09T07:00:00.000Z"` (avec millisecondes)
- `"2025-10-09T09:00:00+02:00"` (autre timezone)

**Fusion automatique** : Si deux stations mesurent exactement au même instant (même milliseconde), un seul point est créé avec les deux valeurs.

**Tri chronologique fiable** : Tri numérique garanti, pas de problème d'ordre alphabétique.

**Précision maximale** : Aucune approximation, précision à la milliseconde.

#### Cas particulier : Tolérance temporelle

**Question** : Et si on voulait fusionner les timestamps proches (ex: ±30 secondes) ?

```typescript
// Exemple non implémenté : Tolérance de 30 secondes
const tolerance = 30000; // 30 secondes en ms
const dataPoint = data[station.id].find(
(p) => Math.abs(new Date(p.timestamp).getTime() - timestampMs) <= tolerance
);
```

**Décision actuelle** : **Tolérance zéro** pour garantir la fidélité aux données réelles. Pas d'interpolation ou d'approximation.

### Normalisation des unités

**Challenge** : Formats d'unités différents entre sources :

- **AtmoMicro** : `"µg/m3"`
- **AtmoRef** : `"µg-m3"`

**Solution** : Fonction `encodeUnit()` pour normaliser

```typescript
const encodeUnit = (unit: string): string => {
const unitMap: Record<string, string> = {
"µg-m3": "µg/m³",
"µg-m³": "μg/m³",
"µg/m3": "µg/m³",
"µg/m³": "µg/m³",
"mg/m³": "mg/m³",
ppm: "ppm",
ppb: "ppb",
};
return unitMap[unit] || unit;
};
```

### Groupement par unité (Mode comparaison)

```typescript
// Mode comparaison spécifique (ligne 75-108)
const groupPollutantsByUnit = () => {
const unitGroups: Record<string, string[]> = {};

if (source === "comparison" && stations.length > 0) {
const pollutant = selectedPollutants[0];

// Trouver la première station avec des données
for (const station of stations) {
if (data[station.id] && data[station.id].length > 0) {
const unit = encodeUnit(data[station.id][0].unit);
if (!unitGroups[unit]) {
unitGroups[unit] = [];
}
if (!unitGroups[unit].includes(pollutant)) {
unitGroups[unit].push(pollutant);
}
break; // Une seule unité en mode comparaison
}
}
}

return unitGroups;
};
```

### Structure des données transformées

**Entrée** (comparisonData) - Données reçues des APIs :

```javascript
{
"pm25": { // Clé = polluant sélectionné
"FR24039": [ // Clé = ID station AtmoRef
{
timestamp: "2025-10-09T07:00:00+00:00",
value: 4.8,
unit: "µg-m3"
},
{
timestamp: "2025-10-09T07:15:00+00:00",
value: 4.8,
unit: "µg-m3"
},
{
timestamp: "2025-10-09T07:30:00+00:00",
value: 5.1,
unit: "µg-m3"
}
// ... 13 points au total (tous les 15min en mode Scan)
],
"1175": [ // Clé = ID site AtmoMicro
{
timestamp: "2025-10-09T07:04:07Z",
value: 2,
unit: "µg/m3",
corrected_value: undefined,
raw_value: 2,
has_correction: false
},
{
timestamp: "2025-10-09T07:06:19Z",
value: 2,
unit: "µg/m3",
corrected_value: undefined,
raw_value: 2,
has_correction: false
},
{
timestamp: "2025-10-09T07:08:31Z",
value: 2.2,
unit: "µg/m3",
corrected_value: undefined,
raw_value: 2.2,
has_correction: false
}
// ... 81 points au total (tous les ~2min en mode Scan)
]
}
}
```

**Sortie** (chartData pour Recharts) - Après transformation :

```javascript
[
{
timestamp: "09 oct., 09:00",
rawTimestamp: 1759993200000,
FR24039: 4.8,
FR24039_unit: "µg/m³",
1175: undefined // ← AtmoMicro n'a pas de donnée à ce timestamp exact
},
{
timestamp: "09 oct., 09:04",
rawTimestamp: 1759993447000,
FR24039: undefined, // ← AtmoRef n'a pas de donnée à ce timestamp exact
1175: 2,
1175_unit: "µg/m³"
},
{
timestamp: "09 oct., 09:06",
rawTimestamp: 1759993579000,
FR24039: undefined,
1175: 2,
1175_unit: "µg/m³"
},
{
timestamp: "09 oct., 09:08",
rawTimestamp: 1759993711000,
FR24039: undefined,
1175: 2.2,
1175_unit: "µg/m³"
},
// ... 94 points au total (union de tous les timestamps des 2 stations)
]
```

**Caractéristiques importantes** :

1. **Timestamps uniques collectés** : Le graphique collecte tous les timestamps uniques des deux sources (94 points = 13 + 81)
2. **Valeurs par station** : Chaque point n'a généralement qu'**une seule station avec une valeur** (l'autre est `undefined`)
3. **Normalisation** : Les timestamps sont convertis en millisecondes pour la comparaison
4. **Unités normalisées** : `"µg-m3"` et `"µg/m3"` → `"µg/m³"`
5. **`connectNulls={true}`** : Essentiel pour relier les points malgré les `undefined`

---

## Cas particuliers

### Mode Scan - Résolutions temporelles variables

#### Spécificité

En mode **"Scan"** (pas de temps le plus fin), les sources ont des résolutions différentes :

- **AtmoRef** : `"quart-horaire"` = **15 minutes fixes**
- **AtmoMicro** : `"brute"` = **Variable** (1min, 2min, ou 5min selon le capteur)

#### Configuration

```typescript
// AtmoRefService.ts (ligne 169)
instantane: { temporalite: "quart-horaire", delais: 181 }

// AtmoMicroService.ts (ligne 226)
instantane: { aggregation: "brute", delais: 181 }
```

#### Comportement du graphique

**Collection des timestamps** (exemple réel basé sur vos logs) :

```javascript
// Map<number, string> avec 94 timestamps uniques au total
allTimestamps = [
[1759993200000, "2025-10-09T07:00:00+00:00"], // AtmoRef
[1759993447000, "2025-10-09T07:04:07Z"], // AtmoMicro seul
[1759993579000, "2025-10-09T07:06:19Z"], // AtmoMicro seul
[1759993711000, "2025-10-09T07:08:31Z"], // AtmoMicro seul
[1759993842000, "2025-10-09T07:10:42Z"], // AtmoMicro seul
[1759993974000, "2025-10-09T07:12:54Z"], // AtmoMicro seul
[1759994107000, "2025-10-09T07:15:07Z"], // AtmoMicro proche de 07:15
[1759994100000, "2025-10-09T07:15:00+00:00"], // AtmoRef
// ... 94 points au total (13 AtmoRef + 81 AtmoMicro)
];
```

**Rendu visuel** :

- **AtmoMicro (1175)** : Ligne **continue et dense** avec 81 points (mesure tous les ~2min)
- **AtmoRef (FR24039)** : Ligne **continue mais espacée** avec 13 points (mesure tous les 15min)
- Les deux lignes se superposent sur le même graphique avec des couleurs différentes

**Note informative** : Un bandeau bleu s'affiche pour expliquer cette différence :

```tsx
{
comparisonState.timeStep === "instantane" && (
<div className="mb-3 sm:mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
<p className="text-sm text-blue-800 font-medium">
Mode Scan - Résolutions temporelles variables
</p>
<p className="text-xs text-blue-700 mt-1">
En mode Scan, chaque source affiche sa résolution réelle : AtmoRef
mesure toutes les 15 minutes, AtmoMicro entre 1 et 5 minutes selon le
capteur. Les différences de densité des points sont normales.
</p>
</div>
);
}
```

### Gestion des valeurs null/undefined

#### Propriété `connectNulls`

**Valeur** : `true` en mode comparaison

**Raison** : Les timestamps des deux sources ne correspondent jamais exactement, donc chaque point n'a généralement qu'une station avec une valeur. Sans `connectNulls={true}`, les lignes ne se traceraient pas.

**Exemple** :

```javascript
// Point 1: AtmoRef a une valeur, AtmoMicro = undefined
{ timestamp: "09:00", FR24039: 4.8, 1175: undefined }

// Point 2: AtmoMicro a une valeur, AtmoRef = undefined
{ timestamp: "09:04", FR24039: undefined, 1175: 2 }

// Sans connectNulls=true : Pas de ligne tracée (points isolés)
// Avec connectNulls=true : Ligne continue pour chaque station
```

### Limite de 10 stations

**Raison** : Performance et lisibilité

La limite est définie par la constante `MAX_COMPARISON_STATIONS` (fichier `src/constants/comparison.ts`). Valeur par défaut : **10**.

```typescript
// Vérification dans AirQualityMap.tsx (handleAddStationToComparison)
if (sidePanels.comparisonState.comparedStations.length >= MAX_COMPARISON_STATIONS) {
console.warn(`Maximum ${MAX_COMPARISON_STATIONS} stations autorisées en comparaison`);
return;
}
```

**Impact** :

- Au-delà de 10 stations, le graphique peut devenir moins lisible
- Dix couleurs distinctes sont prévues dans `fallbackColors` (historicalChartUtils.ts)
- Performance du navigateur à prendre en compte au-delà de 10 stations

---

## Bugs corrigés

### Bug #1 : Polluants communs non détectés

**Date** : 9 octobre 2025
**Fichier** : `ComparisonSidePanel.tsx`

**Problème** :

- AtmoMicro retourne des clés déjà normalisées (`"pm25"`, `"pm10"`)
- Le code essayait de mapper `"PM2.5" → "pm25"` sur des clés déjà normalisées
- Résultat : Aucun polluant commun détecté

**Solution** :

- Suppression du mapping redondant pour AtmoMicro
- Seul AtmoRef nécessite un mapping (`"01" → "so2"`, etc.)

**Code corrigé** :

```typescript
if (station.source === "atmoRef") {
const atmoRefMapping = { "01": "so2", "03": "no2", ... };
mappedCode = atmoRefMapping[code] || code;
}
// Pour AtmoMicro : pas de mapping, les clés sont déjà normalisées
```

### Bug #2 : Graphique vide (unitGroups)

**Date** : 9 octobre 2025
**Fichier** : `HistoricalChart.tsx`

**Problème** :

- `groupPollutantsByUnit()` cherchait `data[pollutant]` en mode comparaison
- En mode comparaison, les clés sont les IDs des stations (`data[stationId]`)
- Résultat : `unitGroups = {}`, `unitKeys = []`, graphique vide

**Solution** :

- Ajout d'une branche spécifique pour le mode comparaison
- Utiliser `data[station.id]` au lieu de `data[pollutant]`

**Code corrigé** :

```typescript
if (source === "comparison" && stations.length > 0) {
const pollutant = selectedPollutants[0];

for (const station of stations) {
if (data[station.id] && data[station.id].length > 0) {
const unit = encodeUnit(data[station.id][0].unit);
// ...
break;
}
}
}
```

### Bug #3 : Points non reliés (timestamps)

**Date** : 9 octobre 2025
**Fichier** : `HistoricalChart.tsx`

**Problème** :

- Formats de timestamps différents : `'...Z'` vs `'...+00:00'`
- Comparaison stricte `===` échouait toujours
- Résultat : Timestamps jamais matchés, pas de valeurs dans les points

**Solution** :

- Normalisation via timestamps numériques (millisecondes)
- Comparaison avec `getTime()` au lieu de strings

**Code corrigé** :

```typescript
// Avant
allTimestamps.add(point.timestamp); // Set<string>
const dataPoint = data[station.id].find((p) => p.timestamp === timestamp);

// Après
const timestampMs = new Date(point.timestamp).getTime();
allTimestamps.set(timestampMs, point.timestamp); // Map<number, string>
const dataPoint = data[station.id].find(
(p) => new Date(p.timestamp).getTime() === timestampMs
);
```

### Bug #4 : Lignes non tracées (connectNulls)

**Date** : 9 octobre 2025
**Fichier** : `HistoricalChart.tsx`

**Problème** :

- `connectNulls={false}` par défaut
- Chaque point n'a qu'une station avec une valeur (l'autre = `undefined`)
- Recharts ne reliait pas les points

**Solution** :

- Changement de `connectNulls={false}` en `connectNulls={true}`
- Permet à Recharts de relier les points malgré les gaps

**Code corrigé** :

```typescript
<Line
key={station.id}
dataKey={station.id}
connectNulls={true} // ← Modification critique
// ...
/>
```

---

## Guide de maintenance

### Ajout d'une nouvelle source de données

Pour ajouter une nouvelle source (ex: NebuleAir) à la comparaison :

1. **Vérifier le format des variables** :

```typescript
// Le service doit retourner un format cohérent
async fetchSiteVariables(siteId: string): Promise<
Record<string, { label: string; code_iso: string; en_service: boolean }>
>
```

2. **Ajouter le mapping si nécessaire** :

```typescript
// Dans ComparisonSidePanel.tsx
else if (station.source === "nebuleair") {
const nebuleAirMapping = { ... };
mappedCode = nebuleAirMapping[code] || code;
}
```

3. **Ajouter le support dans AirQualityMap** :

```typescript
// Dans handleAddStationToComparison
else if (device.source === "nebuleair") {
const nebuleAirService = new NebuleAirService();
variables = await nebuleAirService.fetchSiteVariables(device.id);
}

// Dans handleLoadComparisonData
else if (station.source === "nebuleair") {
stationData = await nebuleAirService.fetchHistoricalData({...});
}
```

4. **Mettre à jour les labels** :
```typescript
// Dans ComparisonSidePanel.tsx
{
station.source === "atmoRef"
? "Station de référence"
: station.source === "atmoMicro"
? "Microcapteur"
: "Capteur communautaire";
}
```

### Modification des limites

**Changer le nombre maximum de stations** :

Modifier la constante dans `src/constants/comparison.ts` :

```typescript
/** Nombre maximum de capteurs/stations pouvant être comparés simultanément */
export const MAX_COMPARISON_STATIONS = 10; // ← Modifier ici
```

La vérification dans `AirQualityMap.tsx` utilise cette constante. Aucune modification supplémentaire n’est nécessaire dans le composant.

**Attention** : Si vous augmentez au-delà de 10, prévoir :

- Plus de couleurs dans `fallbackColors` (historicalChartUtils.ts)
- Tests de performance
- Ajustements UX (lisibilité)

### Modification des couleurs des courbes

```typescript
// historicalChartUtils.ts - fallbackColors
export const fallbackColors = [
"#3B82F6", // Bleu
"#EF4444", // Rouge
"#10B981", // Vert
"#F59E0B", // Orange
"#8B5CF6", // Violet
"#EC4899", // Rose
"#06B6D4", // Cyan
"#84CC16", // Lime
"#F97316", // Orange vif
"#6366F1", // Indigo
// Ajouter plus de couleurs si MAX_COMPARISON_STATIONS > 10
];
```

### Ajout de nouveaux pas de temps

1. **Vérifier le support dans les APIs** :

```typescript
// AtmoRefService.ts
const timeStepConfigs = {
// ... existants
"nouveau": { temporalite: "...", delais: ... }
};
```

2. **Ajouter dans ComparisonSidePanel** :
```tsx
{[
{ key: "instantane", label: "Scan" },
// ...
{ key: "nouveau", label: "Nouveau" },
].map(({ key, label }) => (...))}
```

### Tests recommandés

Après toute modification, tester :

1. **Comparaison AtmoRef + AtmoRef** (même source)
2. **Comparaison AtmoMicro + AtmoMicro** (même source)
3. **Comparaison AtmoRef + AtmoMicro** (sources mixtes)
4. **Mode Scan** (résolutions différentes)
5. **10 stations maximum** (limite, constante `MAX_COMPARISON_STATIONS`)
6. **Changement de polluant** (rechargement)
7. **Changement de période** (rechargement)
8. **Suppression de station** (mise à jour graphique)

### Logging et débogage

**Logs utiles déjà présents** :

```typescript
// Données reçues
console.log(" [HistoricalChart] Props reçues:", { data, selectedPollutants });

// Données transformées
console.log("[HistoricalChart] Données transformées:", {
chartDataLength,
unitGroups,
unitKeys,
chartData: chartData.slice(0, 3),
});

// Mode comparaison spécifique
console.log(" [HistoricalChart] Mode comparaison - Analyse:", {
totalPoints,
stations: stations.map((s) => s.id),
sampleData: chartData.slice(0, 5),
stationDataCount,
});
```

**Ajouter des logs si nécessaire** :

- Vérifier les timestamps normalisés
- Vérifier les valeurs des stations
- Tracer le chargement des données

---

## Résumé visuel du fonctionnement

### Exemple complet : Comparaison FR24039 (AtmoRef) + 1175 (AtmoMicro)

#### 1. Données brutes reçues

**FR24039 (AtmoRef - Station de référence)** :

- 13 points de mesure (tous les 15 minutes)
- Format : `"2025-10-09T07:00:00+00:00"`
- Unité : `"µg-m3"`

**1175 (AtmoMicro - Microcapteur)** :

- 81 points de mesure (tous les ~2 minutes)
- Format : `"2025-10-09T07:04:07Z"`
- Unité : `"µg/m3"`

#### 2. Transformation appliquée

```
Normalisation timestamps :
"2025-10-09T07:00:00+00:00" → 1759993200000 (ms)
"2025-10-09T07:04:07Z" → 1759993447000 (ms)

Union des timestamps :
94 timestamps uniques (13 + 81)

Normalisation unités :
"µg-m3" → "µg/m³"
"µg/m3" → "µg/m³"

Structure chartData :
Point 1: { timestamp: "09 oct., 09:00", FR24039: 4.8, 1175: undefined }
Point 2: { timestamp: "09 oct., 09:04", FR24039: undefined, 1175: 2 }
Point 3: { timestamp: "09 oct., 09:06", FR24039: undefined, 1175: 2 }
...
Point 94: { timestamp: "...", FR24039: ..., 1175: ... }
```

#### 3. Rendu Recharts

```
Ligne 1 (Bleue) - "Marseille Place Verneuil - PM₂.₅" :
• 13 points reliés par connectNulls={true}
• Points espacés régulièrement (15min)

Ligne 2 (Rouge) - "Aix-en-Provence Centre - PM₂.₅" :
• 81 points reliés par connectNulls={true}
• Points rapprochés (2min)

Axe X : Timestamps formatés ("09 oct., 09:00", etc.)
Axe Y : "Concentration (µg/m³)"
Légende : Noms des stations + polluant
```

#### 4. Résultat visuel

```
┌─────────────────────────────────────────────────────────────┐
│ Concentration (µg/m³) │
│ 6 │ │
│ │ ● │
│ 5 │ ●─────●─────● │
│ │ ●────●────● │
│ 4 │ ○○○○○○○○○○○○○○○○○○○○ │
│ │ ○○○○○○ ○○○○○○○○ │
│ 3 │ ○○○ ○○○○○○ │
│ │ │
│ 2 │ │
│ 0 └────────────────────────────────────────────────────── │
│ 07:00 07:15 07:30 07:45 08:00 08:15 08:30 ... │
│ │
│ Légende : │
│ ● Ligne bleue : Marseille Place Verneuil - PM₂.₅ │
│ ○ Ligne rouge : Aix-en-Provence Centre - PM₂.₅ │
└─────────────────────────────────────────────────────────────┘
```

**Observation** :

- La ligne bleue (AtmoRef) a moins de points mais ils sont **espacés régulièrement**
- La ligne rouge (AtmoMicro) est **dense** avec beaucoup de points
- Les deux lignes se **superposent visuellement** pour la comparaison

---

## Annexes

### Diagramme de flux complet

```
Activation mode comparaison
↓
Clic sur marqueur (en mode comparaison)
↓
Vérifications (limite, doublons)
↓
Récupération variables via API
↓
Création StationInfo
↓
Ajout à comparedStations
↓
Calcul polluants communs
↓
Chargement données historiques (si polluant change)
↓
Transformation des données
↓
Normalisation timestamps (ms)
↓
Création chartData
↓
Groupement par unité
↓
Rendu Recharts
↓
Affichage graphique
```

---

## FAQ et Troubleshooting

### Problème : "Aucun polluant disponible" dans le dropdown

**Symptôme** : Le dropdown du polluant est vide ou grisé.

**Causes possibles** :

1. **Aucun polluant commun** entre les stations sélectionnées

- Exemple : Station A mesure SO2, NO2, O3 / Station B mesure PM10, PM2.5
- Solution : Sélectionner des stations qui mesurent au moins un polluant commun

2. **Toutes les variables sont `en_service: false`**
- Vérifier dans les logs : ` [HistoricalChart] Props reçues`
- Solution : Choisir des stations avec des mesures actives

**Vérification** : Console logs

```javascript
// Développer station.variables dans les logs
variables: {
"39": { label: "PM2.5", en_service: false } // Pas actif
}
```

### Problème : Le graphique affiche "Aucune donnée disponible"

**Symptôme** : `[HistoricalChart] Aucune donnée disponible pour le graphique`

**Causes possibles** :

1. **`unitGroups` vide** → Bug #2 (voir section Bugs corrigés)
2. **Aucune donnée historique** pour la période sélectionnée
3. **Erreur API** lors du chargement

**Vérification** : Console logs

```javascript
[HistoricalChart] Données transformées: {
chartDataLength: 0, // Problème
unitGroups: {}, // Problème
unitKeys: []
}
```

**Solutions** :

- Vérifier les logs d'erreur réseau (onglet Network)
- Essayer une autre période temporelle
- Vérifier que les APIs sont accessibles

### Problème : Les points s'affichent mais ne sont pas reliés

**Symptôme** : Points isolés sur le graphique, pas de lignes continues.

**Cause** : `connectNulls={false}` (bug #4)

**Solution** : Vérifier que `connectNulls={true}` dans HistoricalChart.tsx ligne 442

```typescript
<Line
dataKey={station.id}
connectNulls={true} // DOIT être true en mode comparaison
/>
```

### Problème : Une seule station s'affiche, l'autre est manquante

**Symptôme** : `stations: Array(2)` mais une seule courbe visible.

**Causes possibles** :

1. **Timestamps ne correspondent pas** → Bug #3
2. **Toutes les valeurs sont `undefined`** pour une station

**Vérification** : Console logs

```javascript
[HistoricalChart] Mode comparaison - Analyse des données: {
stationDataCount: {
"FR24039": 13, // OK
"1175": 0 // Problème : aucun point avec valeur
}
}
```

**Solutions** :

- Vérifier que les timestamps sont bien normalisés en millisecondes
- Vérifier que les données sont bien chargées dans `comparisonData`

### Problème : Erreur "Maximum 10 stations autorisées"

**Symptôme** : Impossible d'ajouter une 11ème station.

**Cause** : Limite définie par `MAX_COMPARISON_STATIONS` (10 par défaut) pour la performance et la lisibilité.

**Solution** : Si vous devez vraiment comparer plus de 10 stations :

1. Modifier la constante dans `src/constants/comparison.ts`
2. Ajouter plus de couleurs dans `fallbackColors` (historicalChartUtils.ts)
3. Tester la performance avec le nombre souhaité

**À considérer** : Au-delà de 10, le graphique peut devenir difficile à lire.

### Problème : Erreur "Station déjà ajoutée"

**Symptôme** : Impossible d'ajouter une station qui semble nouvelle.

**Cause** : La station est déjà dans `comparedStations`.

**Solution** : Vérifier la liste des stations sélectionnées dans le panel, supprimer la station si nécessaire, puis la rajouter.

### Problème : Les unités ne correspondent pas

**Symptôme** : Une station affiche "µg-m3" au lieu de "µg/m³".

**Cause** : `encodeUnit()` ne reconnaît pas le format.

**Solution** : Ajouter le format dans la fonction `encodeUnit()` :

```typescript
const unitMap = {
"µg-m3": "µg/m³",
"nouveau-format": "µg/m³", // ← Ajouter ici
// ...
};
```

---

## Références

### Références externes

- **Recharts Documentation** : https://recharts.org/
- **API AtmoSud** : https://api.atmosud.org/doc/
- **TypeScript** : https://www.typescriptlang.org/
- **React Hooks** : https://react.dev/reference/react

### Documentation connexe

- **README.md** : Documentation utilisateur et installation
- **DOCUMENTATION_TECHNIQUE.md** : Architecture globale de l'application
- **DOCUMENTATION_USE_AIR_QUALITY_DATA.md** : Hook useAirQualityData
- **Tests E2E** : `docs/test/`

### Fichiers clés du code

- `src/components/map/AirQualityMap.tsx` : Orchestrateur principal
- `src/components/map/handlers/comparisonHandlers.ts` : `createLoadComparisonDataHandler`, chargement des données (atmoRef, atmoMicro, nebuleair)
- `src/components/panels/ComparisonSidePanel.tsx` : Interface de comparaison
- `src/components/charts/` : HistoricalChart et utilitaires (visualisation graphique)
- `src/constants/comparison.ts` : Constante `MAX_COMPARISON_STATIONS` (limite de capteurs)
- `src/components/charts/utils/historicalChartUtils.ts` : Couleurs de fallback pour les courbes
- `src/services/AtmoRefService.ts` : Service AtmoRef
- `src/services/AtmoMicroService.ts` : Service AtmoMicro
- `src/services/NebuleAirService.ts` : Service NebuleAir (comparaison)
- `src/types/index.ts` : Types TypeScript et mappings

---

**Fin de la documentation technique**

_Dernière mise à jour : 16 février 2026_
_Version : 1.2 - Support NebuleAir en comparaison ; toggle ajout/retrait station ; fetchSiteVariables AtmoMicro retourne { variables, sensorModel } ; état comparaison via sidePanels_
