# Intégration AtmoRef - Documentation

## 🎯 Vue d'ensemble

L'intégration AtmoRef permet de récupérer et d'afficher les données des stations de référence AtmoSud sur la carte interactive. Cette source utilise deux appels API en parallèle pour optimiser les performances.

## 📡 Architecture des appels API

### 1. Récupération des stations

**Endpoint :** `https://api.atmosud.org/observations/stations`
**Paramètres :**

- `format=json` : Format de réponse JSON
- `nom_polluant={nom}` : Nom du polluant (ex: pm2.5, pm10, o3, etc.)
- `station_en_service=true` : Seulement les stations actives
- `download=false` : Pas de téléchargement
- `metadata=true` : Inclure les métadonnées

**Exemple d'URL :** `https://api.atmosud.org/observations/stations?format=json&nom_polluant=pm2.5&station_en_service=true&download=false&metadata=true`

**Réponse :** Liste des stations avec leurs coordonnées et variables mesurées

### 2. Récupération des dernières mesures

**Endpoint :** `https://api.atmosud.org/observations/stations/mesures/derniere`
**Paramètres :**

- `format=json` : Format de réponse JSON
- `nom_polluant={nom}` : Nom du polluant
- `temporalite={pas}` : Pas de temps (horaire, journalier, etc.)
- `delais=64` : Délai de 64 minutes pour les données récentes
- `download=false` : Pas de téléchargement

**Exemple d'URL :** `https://api.atmosud.org/observations/stations/mesures/derniere?format=json&nom_polluant=pm2.5&temporalite=horaire&delais=64&download=false`

**Réponse :** Dernières mesures des stations avec valeurs et timestamps

## 🗺️ Affichage des marqueurs

### Marqueurs disponibles

Les marqueurs sont stockés dans `/public/markers/atmoRefMarkers/` :

- `refStationAtmoSud_bon.png` : Qualité bonne
- `refStationAtmoSud_moyen.png` : Qualité moyenne
- `refStationAtmoSud_degrade.png` : Qualité dégradée
- `refStationAtmoSud_mauvais.png` : Qualité mauvaise
- `refStationAtmoSud_tresMauvais.png` : Qualité très mauvaise
- `refStationAtmoSud_extrMauvais.png` : Qualité extrêmement mauvaise
- `refStationAtmoSud_default.png` : Marqueur par défaut (pas de données)

### Logique d'affichage

1. **Toutes les stations** sont affichées avec le marqueur par défaut
2. **Les stations avec données récentes** voient leur marqueur mis à jour selon la qualité de l'air
3. **Les stations sans données récentes** conservent le marqueur par défaut

## 🔧 Configuration

### Mapping des noms de polluants

```typescript
const pollutantNameMapping = {
  pm25: "pm2.5", // PM2.5
  pm10: "pm10", // PM10
  pm1: "pm1", // PM1
  no2: "no2", // NO2
  o3: "o3", // O3
  so2: "so2", // SO2
};
```

**Important :** L'API AtmoSud attend les noms de polluants (ex: `pm2.5`) et non les codes numériques (ex: `39`).

### Mapping des pas de temps

```typescript
const timeStepConfigs = {
  instantane: { temporalite: "quart-horaire", delais: 181 }, // Scan -> quart-horaire avec délai 181
  quartHeure: { temporalite: "quart-horaire", delais: 19 }, // 15 minutes -> quart-horaire avec délai 19
  heure: { temporalite: "horaire", delais: 64 }, // Heure -> horaire avec délai 64
  jour: { temporalite: "journaliere", delais: 1444 }, // Jour -> journalière avec délai 1444
};
```

**Pas de temps non supportés :**

- `deuxMin` (≤ 2 minutes) : Source de données non disponible à ce pas de temps

**URLs générées selon le pas de temps :**

- **Scan** : `temporalite=quart-horaire&delais=181`
- **15 minutes** : `temporalite=quart-horaire&delais=19`
- **Heure** : `temporalite=horaire&delais=64`
- **Jour** : `temporalite=journaliere&delais=1444`

## 📊 Seuils de qualité de l'air

Les seuils utilisés correspondent aux standards AtmoSud :

- **Bon** : 0-5 µg/m³ (PM2.5)
- **Moyen** : 6-15 µg/m³
- **Dégradé** : 16-50 µg/m³
- **Mauvais** : 51-90 µg/m³
- **Très mauvais** : 91-140 µg/m³
- **Extrêmement mauvais** : >140 µg/m³

## 🚀 Utilisation

### Activation de la source

La source AtmoRef est activée par défaut dans `src/constants/sources.ts` :

```typescript
atmoRef: {
  name: "Station de référence atmosud",
  code: "atmoRef",
  activated: true,
}
```

### Récupération des données

Le service est automatiquement utilisé par le hook `useAirQualityData` quand la source est sélectionnée.

## 🔍 Dépannage

### Problèmes courants

1. **Pas de marqueurs visibles** : Vérifier que la source AtmoRef est activée
2. **Erreurs CORS** : Les appels API sont directs, pas de proxy nécessaire
3. **Données manquantes** : Vérifier que le polluant sélectionné est supporté par AtmoRef
4. **URLs incorrectes** : L'API attend les noms de polluants (`pm2.5`) et non les codes (`39`)
5. **Pas de temps non supporté** : Le pas de temps "≤ 2 minutes" n'est pas supporté par AtmoRef
6. **Délais incorrects** : Chaque pas de temps a son propre délai spécifique

### Logs de débogage

Les erreurs sont loggées dans la console avec le préfixe "Erreur lors de la récupération des données AtmoRef:"

## 📈 Performance

- **Appels parallèles** : Les deux appels API sont effectués simultanément
- **Cache des services** : Les instances de service sont mises en cache
- **Optimisation des marqueurs** : Utilisation d'icônes Leaflet optimisées

## 🔄 Mise à jour automatique

Les données sont automatiquement mises à jour quand :

- Le polluant sélectionné change
- Le pas de temps change
- Les sources sélectionnées changent
