# 📚 Documentation Technique - Mode Historique

## 🎯 Vue d'ensemble

Le **Mode Historique** permet aux utilisateurs de visualiser des données de qualité de l'air passées sur une période donnée, avec navigation temporelle interactive. Cette fonctionnalité transforme la carte statique en un lecteur vidéo temporel.

### 🆕 Nouvelles Fonctionnalités (v2.0)

- **Limitations de période dynamiques** selon le pas de temps sélectionné
- **Synchronisation automatique** du pas de temps avec l'interface principale
- **Amélioration des données AtmoMicro** pour l'agrégation quart-horaire
- **Messages informatifs** contextuels selon la configuration

### 🆕 Nouvelles Fonctionnalités (v2.1)

- **Panneau de lecture draggable** : Contrôles de lecture dans un panneau déplaçable
- **Panel de sélection rabattable** : Le panel de sélection se rabat automatiquement après le chargement
- **Isolation des side panels** : Fermeture automatique de tous les side panels en mode historique
- **Désactivation des interactions** : Les marqueurs ne peuvent plus ouvrir de side panels en mode historique
- **Indicateur de chargement** : Feedback visuel pendant le rechargement des données

## 🏗️ Architecture Générale

### Concepts React Expliqués

**React** est une bibliothèque JavaScript pour créer des interfaces utilisateur. Voici les concepts clés utilisés :

- **Composant** : Une fonction qui retourne du HTML et gère son état
- **Hook** : Une fonction qui permet de gérer l'état et les effets de bord
- **Props** : Des données passées d'un composant parent à un composant enfant
- **État** : Des variables qui, quand elles changent, font re-rendre le composant

## 📁 Structure des Fichiers

```
src/
├── types/index.ts                    # Définitions TypeScript
├── hooks/useTemporalVisualization.ts # Logique métier principale
├── services/
│   ├── AtmoMicroService.ts          # API AtmoMicro (capteurs mobiles)
│   └── AtmoRefService.ts            # API AtmoRef (stations fixes)
├── components/controls/              # Interface utilisateur
│   ├── HistoricalModeButton.tsx     # Bouton d'activation
│   ├── HistoricalControlPanel.tsx   # Panel de sélection de dates
│   ├── HistoricalPlaybackControl.tsx # Panneau de lecture draggable
│   ├── DateRangeSelector.tsx        # Sélection de dates
│   ├── TemporalTimeline.tsx         # Curseur temporel (déprécié dans panel)
│   └── TemporalPlaybackControls.tsx # Contrôles play/pause (déprécié dans panel)
└── App.tsx                          # Point d'entrée principal
```

## 🔧 Implémentation Technique

### 1. Types TypeScript (`src/types/index.ts`)

Les types définissent la structure des données :

```typescript
// État principal du mode historique
export interface TemporalVisualizationState {
  isActive: boolean; // Mode activé/désactivé
  startDate: string; // Date de début (ISO format)
  endDate: string; // Date de fin (ISO format)
  currentDate: string; // Date actuellement affichée
  isPlaying: boolean; // Lecture en cours
  playbackSpeed: number; // Vitesse (1x, 2x, 4x, 8x)
  timeStep: string; // Pas de temps (h, qh, d, etc.)
  data: TemporalDataPoint[]; // Données historiques
  loading: boolean; // Chargement en cours
  error: string | null; // Message d'erreur
}

// Un point temporel = un instant avec toutes ses données
export interface TemporalDataPoint {
  timestamp: string; // "2024-01-15T14:00:00Z"
  devices: MeasurementDevice[]; // Tous les capteurs à cet instant
  deviceCount: number; // Nombre de capteurs
  averageValue: number; // Valeur moyenne
  qualityLevels: Record<string, number>; // Répartition des niveaux
}
```

**Explication** : Ces interfaces garantissent que les données ont toujours la même structure, évitant les erreurs.

### 2. Hook Principal (`src/hooks/useTemporalVisualization.ts`)

Le hook encapsule toute la logique métier :

```typescript
export const useTemporalVisualization = ({
  selectedPollutant,
  selectedSources,
  timeStep,
}) => {
  // État local du hook
  const [state, setState] = useState<TemporalVisualizationState>({
    isActive: false,
    startDate: "",
    endDate: "",
    // ... autres propriétés
  });

  // 🆕 Synchronisation automatique du timeStep avec les props
  useEffect(() => {
    setState((prev) => {
      // Si des données sont déjà chargées et que le timeStep change, les réinitialiser
      if (prev.data.length > 0 && prev.timeStep !== timeStep) {
        console.log(
          `⚠️ [HOOK] Changement du pas de temps de "${prev.timeStep}" à "${timeStep}". Réinitialisation des données.`
        );
        return {
          ...prev,
          timeStep: timeStep,
          data: [],
          currentDate: "",
          isPlaying: false,
          error: null,
        };
      }
      return {
        ...prev,
        timeStep: timeStep,
      };
    });
  }, [timeStep]);

  // Fonction pour activer/désactiver le mode
  const toggleHistoricalMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: !prev.isActive,
      data: !prev.isActive ? prev.data : [], // Reset si désactivation
    }));
  }, []);

  // Fonction pour charger les données historiques
  const loadHistoricalData = useCallback(async () => {
    if (!state.startDate || !state.endDate) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const temporalData = await atmoMicroService.current.fetchTemporalData({
        pollutant: selectedPollutant,
        timeStep: state.timeStep,
        startDate: state.startDate,
        endDate: state.endDate,
      });

      setState((prev) => ({
        ...prev,
        data: temporalData,
        currentDate: temporalData[0]?.timestamp || prev.startDate,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    }
  }, [state.startDate, state.endDate, selectedPollutant]);

  // Navigation temporelle
  const seekToDate = useCallback(
    (targetDate: string) => {
      if (state.data.length === 0) return;

      // Trouver le point le plus proche de la date cible
      const targetTime = new Date(targetDate).getTime();
      let closestPoint = state.data[0];
      let minDiff = Math.abs(
        new Date(closestPoint.timestamp).getTime() - targetTime
      );

      for (const point of state.data) {
        const diff = Math.abs(new Date(point.timestamp).getTime() - targetTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestPoint = point;
        }
      }

      setState((prev) => ({
        ...prev,
        currentDate: closestPoint.timestamp,
      }));
    },
    [state.data]
  );

  // Lecture automatique avec setInterval
  useEffect(() => {
    if (state.isPlaying && state.data.length > 0) {
      const interval = setInterval(() => {
        setState((prev) => {
          const currentIndex = prev.data.findIndex(
            (point) => point.timestamp === prev.currentDate
          );

          if (currentIndex >= prev.data.length - 1) {
            // Fin des données, arrêter
            return { ...prev, isPlaying: false };
          }

          return {
            ...prev,
            currentDate: prev.data[currentIndex + 1].timestamp,
          };
        });
      }, 1000 / state.playbackSpeed);

      return () => clearInterval(interval);
    }
  }, [state.isPlaying, state.data, state.playbackSpeed]);

  // Retourner l'état et les fonctions de contrôle
  return {
    state,
    controls: {
      startDate: state.startDate,
      endDate: state.endDate,
      currentDate: state.currentDate,
      isPlaying: state.isPlaying,
      playbackSpeed: state.playbackSpeed,
      timeStep: state.timeStep,
      onStartDateChange: (date) =>
        setState((prev) => ({ ...prev, startDate: date })),
      onEndDateChange: (date) =>
        setState((prev) => ({ ...prev, endDate: date })),
      onCurrentDateChange: (date) =>
        setState((prev) => ({ ...prev, currentDate: date })),
      onPlayPause: () =>
        setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying })),
      onSpeedChange: (speed) =>
        setState((prev) => ({ ...prev, playbackSpeed: speed })),
      onTimeStepChange: (timeStep) =>
        setState((prev) => ({ ...prev, timeStep })),
      onReset: () =>
        setState((prev) => ({ ...prev, data: [], currentDate: "" })),
    },
    toggleHistoricalMode,
    loadHistoricalData,
    seekToDate,
    goToPrevious: () => {
      /* logique navigation précédent */
    },
    goToNext: () => {
      /* logique navigation suivant */
    },
    getCurrentDevices: () => {
      const currentPoint = state.data.find(
        (p) => p.timestamp === state.currentDate
      );
      return currentPoint ? currentPoint.devices : [];
    },
  };
};
```

**Explication** :

- **useState** : Gère l'état local du composant
- **useCallback** : Mémorise les fonctions pour éviter les re-renders inutiles
- **useEffect** : Gère les effets de bord (lecture automatique, nettoyage)
- **setInterval** : Crée un timer pour la lecture automatique

### 3. Service de Données (`src/services/AtmoMicroService.ts`)

Le service gère la récupération et transformation des données :

```typescript
export class AtmoMicroService {
  // Récupération optimisée des données historiques
  async fetchTemporalData({
    pollutant,
    timeStep,
    startDate,
    endDate,
  }): Promise<TemporalDataPoint[]> {
    const temporalDataPoints: TemporalDataPoint[] = [];

    // Diviser la période en chunks de 30 jours
    const start = new Date(startDate);
    const end = new Date(endDate);
    const chunkSize = 30 * 24 * 60 * 60 * 1000; // 30 jours en ms

    for (
      let current = start;
      current < end;
      current = new Date(current.getTime() + chunkSize)
    ) {
      const chunkEnd = new Date(
        Math.min(current.getTime() + chunkSize, end.getTime())
      );

      const url =
        `https://api.atmosud.org/observations/capteurs/mesures?` +
        `debut=${current.toISOString()}&` +
        `fin=${chunkEnd.toISOString()}&` +
        `format=json&download=false&nb_dec=0&` +
        `variable=${pollutant}&valeur_brute=false&` +
        `aggregation=${timeStep}&type_capteur=false`;

      const response = await fetch(url);
      const data = await response.json();

      // Grouper par timestamp
      const measuresByTimestamp = new Map<string, AtmoMicroMeasure[]>();

      data.mesures.forEach((measure: AtmoMicroMeasure) => {
        const timestamp = measure.time;
        if (!measuresByTimestamp.has(timestamp)) {
          measuresByTimestamp.set(timestamp, []);
        }
        measuresByTimestamp.get(timestamp)!.push(measure);
      });

      // Créer les TemporalDataPoint
      for (const [timestamp, measures] of measuresByTimestamp) {
        const devices: MeasurementDevice[] = measures.map((measure) => ({
          id: measure.id_site.toString(),
          name: measure.nom_site,
          latitude: measure.lat,
          longitude: measure.lon,
          value: measure.valeur || 0,
          timestamp: measure.time,
          source: "atmoMicro",
          pollutant: pollutant,
          unit: "µg/m³",
          status: "active" as const,
          qualityLevel: this.calculateQualityLevel(measure.valeur, pollutant),
        }));

        temporalDataPoints.push({
          timestamp,
          devices,
          deviceCount: devices.length,
          averageValue: this.calculateAverage(devices),
          qualityLevels: this.calculateQualityLevels(devices),
        });
      }
    }

    return temporalDataPoints.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }
}
```

**Explication** :

- **Chunking** : Divise les requêtes pour éviter les timeouts
- **Grouping** : Regroupe les mesures par timestamp
- **Transformation** : Convertit les données API en format interne
- **Tri** : Ordonne chronologiquement les points temporels

### 4. Composant Principal (`src/App.tsx`)

Le composant principal orchestre tout :

```typescript
const App: React.FC = () => {
  // État des contrôles de base
  const [selectedPollutant, setSelectedPollutant] = useState("pm25");
  const [selectedSources, setSelectedSources] = useState(["atmoMicro"]);

  // Hook du mode historique
  const {
    state: temporalState,
    controls: temporalControls,
    toggleHistoricalMode,
    loadHistoricalData,
    getCurrentDevices,
    isHistoricalModeActive,
    seekToDate,
    goToPrevious,
    goToNext,
  } = useTemporalVisualization({
    selectedPollutant,
    selectedSources,
    timeStep: selectedTimeStep,
  });

  // Hook des données normales (temps réel)
  const { devices: normalDevices, loading } = useAirQualityData({
    selectedPollutant,
    selectedSources,
    selectedTimeStep,
    autoRefreshEnabled: autoRefreshEnabled && !isHistoricalModeActive, // Désactiver en mode historique
  });

  // Déterminer quelles données afficher
  const devices = isHistoricalModeActive ? getCurrentDevices() : normalDevices;

  return (
    <div className="h-screen flex flex-col">
      {/* En-tête avec contrôles */}
      <header className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h1>OpenAirMap</h1>

          <div className="flex items-center space-x-4">
            {/* Contrôles normaux */}
            <PollutantDropdown
              selectedPollutant={selectedPollutant}
              onPollutantChange={setSelectedPollutant}
            />

            {/* Bouton mode historique */}
            <HistoricalModeButton
              isActive={isHistoricalModeActive}
              onToggle={toggleHistoricalMode}
            />
          </div>
        </div>
      </header>

      {/* Carte */}
      <main className="flex-1 relative">
        <AirQualityMap
          devices={devices}
          center={[43.7102, 7.262]}
          zoom={9}
          selectedPollutant={selectedPollutant}
          selectedSources={selectedSources}
          loading={loading || temporalState.loading}
        />

        {/* Panel de contrôle historique */}
        <HistoricalControlPanel
          isVisible={isHistoricalModeActive}
          onClose={() => {}} // Ne pas fermer le mode
          onToggleHistoricalMode={toggleHistoricalMode}
          state={temporalState}
          controls={temporalControls}
          onLoadData={loadHistoricalData}
          onSeekToDate={seekToDate}
          onGoToPrevious={goToPrevious}
          onGoToNext={goToNext}
        />
      </main>
    </div>
  );
};
```

**Explication** :

- **Conditional Rendering** : Affiche différentes données selon le mode
- **Props Passing** : Passe les fonctions et l'état aux composants enfants
- **State Management** : Coordonne l'état entre plusieurs hooks

### 5. Composants UI

#### Bouton d'Activation (`HistoricalModeButton.tsx`)

```typescript
const HistoricalModeButton: React.FC<HistoricalModeButtonProps> = ({
  isActive,
  onToggle,
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        relative flex items-center space-x-2 px-4 py-2 rounded-lg
        transition-all duration-200
        ${
          isActive
            ? "bg-blue-600 text-white border-2 border-blue-600"
            : "bg-white text-gray-700 border-2 border-gray-300"
        }
      `}
      title={
        isActive
          ? "Désactiver le mode historique"
          : "Activer le mode historique"
      }
    >
      <svg className="w-5 h-5" /* icône horloge */ />
      <span>Mode Historique</span>
      {isActive && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full" />
      )}
    </button>
  );
};
```

#### Panel de Sélection de Dates (`HistoricalControlPanel.tsx`)

🆕 **v2.1** : Le panel de sélection se rabat automatiquement après le chargement des données et ne contient plus les contrôles de lecture.

```typescript
const HistoricalControlPanel: React.FC<HistoricalControlPanelProps> = ({
  isVisible,
  state,
  controls,
  onLoadData,
  onPanelVisibilityChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const userManuallyOpenedRef = useRef(false);

  // Rabattre le panel après le chargement des données
  useEffect(() => {
    if (
      state.data.length > 0 &&
      !state.loading &&
      isExpanded &&
      !userManuallyOpenedRef.current
    ) {
      setIsExpanded(false);
    }
  }, [state.data.length, state.loading, isExpanded]);

  // Rabattre le panel en cliquant à l'extérieur (au lieu de le fermer)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        isExpanded
      ) {
        setIsExpanded(false);
      }
    };

    if (isVisible && isPanelVisible && isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible, isPanelVisible, isExpanded]);

  if (!isVisible) return null;

  return (
    <>
      {/* Panel principal - toujours visible, peut être rabattu */}
      {isPanelVisible && (
        <div
          ref={panelRef}
          className={`fixed top-[60px] right-4 z-[2000] bg-white border border-gray-300 rounded-lg shadow-xl max-w-md w-full transition-all duration-300 ${
            isExpanded ? "max-h-[90vh]" : "h-auto"
          }`}
        >
          {/* Header avec boutons de contrôle */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <h3>Mode Historique</h3>
            <div className="flex space-x-2">
              <button onClick={() => {
                setIsExpanded(!isExpanded);
                if (!isExpanded) {
                  userManuallyOpenedRef.current = true;
                }
              }}>
                {/* Icône réduction/développement */}
              </button>
              <button onClick={() => setIsExpanded(false)}>
                {/* Icône rabattre */}
              </button>
            </div>
          </div>

          {/* Contenu du panel */}
          {isExpanded ? (
            <div className="p-4 space-y-4 max-h-[calc(90vh-80px)] overflow-y-auto">
              {/* Sélecteur de dates */}
              <DateRangeSelector
                startDate={state.startDate}
                endDate={state.endDate}
                onStartDateChange={controls.onStartDateChange}
                onEndDateChange={controls.onEndDateChange}
                maxDateRange={maxDateRange}
                disabled={state.loading}
              />

              {/* Bouton de chargement */}
              <button
                onClick={onLoadData}
                disabled={!state.startDate || !state.endDate || state.loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300"
              >
                {state.loading ? "Chargement..." : "Charger les données"}
              </button>

              {/* Note: Les contrôles de lecture ont été déplacés dans HistoricalPlaybackControl */}
            </div>
          ) : (
            <div className="p-2 text-center text-sm text-gray-500">
              Panel réduit - Cliquez sur le bouton pour développer
            </div>
          )}
        </div>
      )}
    </>
  );
};
```

#### Panneau de Lecture Draggable (`HistoricalPlaybackControl.tsx`)

🆕 **v2.1** : Nouveau composant draggable contenant tous les contrôles de lecture.

```typescript
const HistoricalPlaybackControl: React.FC<HistoricalPlaybackControlProps> = ({
  state,
  controls,
  onToggleHistoricalMode,
  onOpenDatePanel,
  onSeekToDate,
  onGoToPrevious,
  onGoToNext,
}) => {
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 300 });
  const [isDragging, setIsDragging] = useState(false);

  // Gestion du drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current || state.loading) return;
    // ... logique de drag
  };

  return (
    <div
      ref={containerRef}
      className={`fixed z-[2000] bg-white border border-gray-300 rounded-lg shadow-xl p-4 min-w-[280px] max-w-[320px] ${
        state.loading ? "opacity-75" : ""
      }`}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      {/* Header draggable */}
      <div
        className={`flex items-center justify-between mb-3 pb-2 border-b ${
          state.loading ? "cursor-not-allowed" : "cursor-grab"
        }`}
        onMouseDown={state.loading ? undefined : handleMouseDown}
      >
        <h4>Contrôles de lecture</h4>
        <div className="flex space-x-1">
          <button onClick={onOpenDatePanel} disabled={state.loading}>
            {/* Icône calendrier */}
          </button>
          <button onClick={onToggleHistoricalMode} disabled={state.loading}>
            {/* Icône fermeture */}
          </button>
        </div>
      </div>

      {/* Indicateur de chargement */}
      {state.loading && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-center space-x-2">
            <svg className="animate-spin w-4 h-4 text-blue-600" /* spinner */ />
            <span>Chargement des données en cours...</span>
          </div>
        </div>
      )}

      {/* Date actuelle */}
      <div className={`mb-3 text-center ${state.loading ? "opacity-50" : ""}`}>
        <div className="text-xs text-gray-500 mb-1">Date actuelle</div>
        <div className="text-sm font-medium">{formatDate(state.currentDate)}</div>
      </div>

      {/* Barre de progression */}
      {hasData && !state.loading && (
        <div className="mb-3">
          {/* Barre de progression */}
        </div>
      )}

      {/* Contrôles de lecture - masqués pendant le chargement */}
      {hasData && !state.loading && (
        <div className="flex items-center justify-center space-x-2 mb-3">
          <button onClick={onGoToPrevious} disabled={state.loading}>
            {/* Précédent */}
          </button>
          <button onClick={controls.onPlayPause} disabled={state.loading}>
            {/* Play/Pause */}
          </button>
          <button onClick={onGoToNext} disabled={state.loading}>
            {/* Suivant */}
          </button>
        </div>
      )}

      {/* Vitesse de lecture - masquée pendant le chargement */}
      {hasData && !state.loading && (
        <div className="flex items-center justify-between mb-2">
          <span>Vitesse :</span>
          <div className="flex space-x-1">
            {[0.5, 1, 2, 4, 8].map((speed) => (
              <button
                key={speed}
                onClick={() => controls.onSpeedChange(speed)}
                disabled={state.loading}
                className={state.playbackSpeed === speed ? "bg-blue-600 text-white" : ""}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      )}

      {/* État */}
      <div className={`flex items-center justify-between text-xs ${state.loading ? "opacity-50" : ""}`}>
        {state.loading ? (
          <>
            <svg className="animate-spin w-3 h-3" /* spinner */ />
            <span>Chargement...</span>
          </>
        ) : (
          <>
            <div className={`w-2 h-2 rounded-full ${state.isPlaying ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
            <span>{state.isPlaying ? "Lecture" : "Pause"}</span>
          </>
        )}
        {hasData && !state.loading && (
          <span>{state.data.length} points</span>
        )}
      </div>
    </div>
  );
};
```

## 🔄 Flux de Données

### 1. Activation du Mode

```
Utilisateur clique sur "Mode Historique"
    ↓
toggleHistoricalMode() appelé
    ↓
state.isActive = true
    ↓
Tous les side panels existants se ferment complètement
    ↓
Les clics sur les marqueurs sont désactivés
    ↓
HistoricalControlPanel rendu (développé)
    ↓
Utilisateur sélectionne dates
    ↓
onLoadData() appelé
```

### 2. Chargement des Données

```
loadHistoricalData() appelé
    ↓
state.loading = true
    ↓
HistoricalPlaybackControl affiche l'indicateur de chargement
    ↓
Tous les contrôles de lecture désactivés
    ↓
AtmoMicroService.fetchTemporalData() + AtmoRefService.fetchTemporalData()
    ↓
Requêtes API en chunks de 30 jours (en parallèle)
    ↓
Données groupées par timestamp avec fusion intelligente
    ↓
TemporalDataPoint[] créés
    ↓
state.data mis à jour
    ↓
state.loading = false
    ↓
HistoricalControlPanel se rabat automatiquement
    ↓
HistoricalPlaybackControl apparaît avec les contrôles activés
    ↓
Carte affiche les données du premier point
```

### 3. Navigation Temporelle

```
Utilisateur bouge le curseur
    ↓
onSeek() appelé avec nouvelle date
    ↓
seekToDate() trouve le point le plus proche
    ↓
state.currentDate mis à jour
    ↓
getCurrentDevices() retourne les devices du point
    ↓
Carte re-rend avec nouvelles données
```

### 4. Lecture Automatique

```
Utilisateur clique sur "Play"
    ↓
state.isPlaying = true
    ↓
useEffect détecte le changement
    ↓
setInterval créé (1000ms / vitesse)
    ↓
À chaque tick : currentDate = point suivant
    ↓
Carte re-rend automatiquement
    ↓
Si fin atteinte : isPlaying = false, interval cleared
```

## 🎨 Gestion de l'État

### États Locaux vs Globaux

**États Locaux** (dans chaque composant) :

- `isExpanded` : Panel réduit/développé
- `isPanelVisible` : Panel masqué/visible
- `isPlaying` : Lecture en cours/pause

**État Global** (dans le hook) :

- `isActive` : Mode historique activé/désactivé
- `data` : Données historiques chargées
- `currentDate` : Date actuellement affichée
- `loading` : État de chargement

### Synchronisation

```typescript
// Dans App.tsx
const devices = isHistoricalModeActive ? getCurrentDevices() : normalDevices;

// Dans useTemporalVisualization.ts
const getCurrentDevices = useCallback(() => {
  const currentPoint = state.data.find(
    (p) => p.timestamp === state.currentDate
  );
  return currentPoint ? currentPoint.devices : [];
}, [state.currentDate, state.data]);
```

## 🔧 Points Techniques Importants

### 1. Performance

- **Chunking** : Évite les timeouts sur de longues périodes
- **useCallback** : Évite les re-renders inutiles
- **useMemo** : Cache les calculs coûteux
- **Debouncing** : Limite les appels API

### 2. 🆕 Limitations de Période Dynamiques

Le mode historique applique des limitations de période selon le pas de temps sélectionné :

| Pas de temps | Code | Période maximale | Justification                    |
| ------------ | ---- | ---------------- | -------------------------------- |
| 15 minutes   | `qh` | **7 jours**      | 4x plus de données que l'horaire |
| Heure        | `h`  | **30 jours**     | Équilibre performance/utilité    |
| Autres       | -    | **365 jours**    | Pas de limitation spécifique     |

**Implémentation** :

```typescript
// Dans HistoricalControlPanel.tsx
const getMaxDateRange = () => {
  if (state.timeStep === "qh") return 7; // 15 minutes
  if (state.timeStep === "h") return 30; // Heure
  return 365; // Autres
};
```

### 3. 🆕 Amélioration des Données AtmoMicro

Pour l'agrégation **quart-horaire** (15 minutes), le service utilise maintenant `valeur_ref` au lieu de `valeur` :

```typescript
// Logique de sélection de valeur
if (aggregation === "quart-horaire") {
  // valeur_ref = meilleure valeur (corrigée si existe, sinon brute)
  displayValue =
    measure.valeur_ref ?? measure.valeur_brute ?? measure.valeur ?? 0;
} else {
  // Pour horaire et autres : logique existante
  displayValue = measure.valeur ?? measure.valeur_brute;
}
```

**Avantages** :

- ✅ Plus de valeurs à 0 inappropriées
- ✅ Meilleure qualité des données affichées
- ✅ Utilisation optimale des données corrigées

### 4. Gestion d'Erreurs

```typescript
try {
  const data = await fetch(url);
  if (!data.ok) throw new Error(`HTTP ${data.status}`);
  return await data.json();
} catch (error) {
  setState((prev) => ({ ...prev, error: error.message, loading: false }));
}
```

### 3. Nettoyage des Ressources

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    /* ... */
  }, 1000);
  return () => clearInterval(interval); // Nettoyage obligatoire
}, [dependencies]);
```

### 4. Gestion des Clics Extérieurs

```typescript
useEffect(() => {
  const handleClickOutside = (event) => {
    if (ref.current && !ref.current.contains(event.target)) {
      // Action de fermeture
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);
```

## 🚀 Extensions Possibles

### 1. Multi-Sources

- Étendre aux autres services (AtmoRef, NebuleAir)
- Fusionner les données de différentes sources
- Gérer les formats de données différents

### 2. 🆕 Messages Informatifs Contextuels

L'interface affiche des messages informatifs selon la configuration :

```typescript
// Messages selon le pas de temps
{
  state.timeStep === "qh" && (
    <p className="text-blue-700 mt-1 italic">
      ⏱️ Période maximale limitée à 7 jours pour le pas de temps 15 minutes
    </p>
  );
}
{
  state.timeStep === "h" && (
    <p className="text-blue-700 mt-1 italic">
      ⏱️ Période maximale limitée à 30 jours pour le pas de temps horaire
    </p>
  );
}
```

### 3. 🆕 Isolation du Mode Historique

**v2.1** : Quand le mode historique est activé, tous les side panels existants se ferment automatiquement et les interactions avec les marqueurs sont désactivées.

```typescript
// Dans AirQualityMap.tsx
useEffect(() => {
  if (isHistoricalModeActive) {
    // Fermer complètement tous les side panels
    sidePanels.handleCloseSidePanel();
    signalAir.handleCloseSignalAirPanel();
    signalAir.handleCloseSignalAirDetailPanel();
    mobileAir.handleCloseMobileAirSelectionPanel();
    mobileAir.handleCloseMobileAirDetailPanel();
  }
}, [isHistoricalModeActive]);

// Désactiver les clics sur les marqueurs
const handleMarkerClick = async (device: MeasurementDevice) => {
  if (isHistoricalModeActive) {
    return; // Ne rien faire en mode historique
  }
  // ... logique normale
};
```

**Avantages** :
- ✅ Interface épurée, focus sur la visualisation temporelle
- ✅ Évite les conflits entre les modes
- ✅ Expérience utilisateur cohérente

### 4. 🆕 Panneau de Lecture Draggable

**v2.1** : Les contrôles de lecture sont maintenant dans un panneau draggable séparé qui apparaît après le chargement des données.

**Caractéristiques** :
- **Position initiale** : Bas à gauche de l'écran
- **Drag & Drop** : Déplaçable n'importe où sur la carte
- **Limites** : Reste dans les limites de la fenêtre
- **Indicateur de chargement** : Affiche un spinner et désactive tous les contrôles pendant le rechargement
- **Contrôles complets** : Play/Pause, Précédent/Suivant, Vitesse, Date actuelle, Progression

### 5. Fonctionnalités Avancées

- **Export** : Sauvegarder les données visualisées
- **Comparaison** : Superposer plusieurs périodes
- **Alertes** : Notifications sur dépassements de seuils
- **Statistiques** : Graphiques et moyennes

### 4. Optimisations

- **Cache** : Stocker les données déjà chargées
- **Lazy Loading** : Charger les données à la demande
- **Web Workers** : Traitement des données en arrière-plan
- **IndexedDB** : Stockage local des données

## 📋 Résumé pour un Développeur Non-React

Cette fonctionnalité utilise React pour créer une interface interactive qui :

1. **Gère l'état** : Mémorise les dates, les données, l'état de lecture
2. **Gère les effets** : Lecture automatique, clics extérieurs, nettoyage
3. **Compose l'UI** : Assemble des composants réutilisables
4. **Synchronise** : Met à jour la carte quand l'état change

L'architecture sépare clairement :

- **Logique métier** (hook)
- **Récupération de données** (service)
- **Interface utilisateur** (composants)
- **Types de données** (interfaces TypeScript)

---

## 🔄 Améliorations et Corrections (Octobre 2025)

### Support Multi-Sources

Le mode historique prend désormais en charge **AtmoRef ET AtmoMicro simultanément** :

#### 1. Extension du Service AtmoRef

Le service `AtmoRefService` a été étendu avec la méthode `fetchTemporalData` pour récupérer les données historiques :

```typescript
// src/services/AtmoRefService.ts
async fetchTemporalData(params: {
  pollutant: string;
  timeStep: string;
  startDate: string;
  endDate: string;
}): Promise<TemporalDataPoint[]> {
  // Récupération des stations pour avoir les coordonnées
  const stationsResponse = await this.fetchStations(pollutantName);
  const stationsMap = new Map<string, AtmoRefStation>();
  stationsResponse.stations.forEach((station) => {
    stationsMap.set(station.id_station, station);
  });

  // Division en chunks de 30 jours pour éviter les timeouts
  const chunkSize = 30; // jours
  const chunks = Math.ceil(totalDays / chunkSize);

  // Traitement de chaque chunk
  for (let i = 0; i < chunks; i++) {
    const chunkData = await this.fetchTemporalDataChunk(
      pollutantName,
      temporalite,
      chunkStart.toISOString(),
      chunkEnd.toISOString(),
      stationsMap,
      params.pollutant
    );
    temporalData.push(...chunkData);
  }

  return temporalData.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}
```

**Points clés** :

- Division en chunks de 30 jours (comme AtmoMicro)
- Récupération préalable des stations pour les coordonnées
- Tri final par timestamp
- Logs détaillés pour le debugging

#### 2. Fusion Intelligente des Données Multi-Sources

Le hook `useTemporalVisualization` a été amélioré pour fusionner les données de plusieurs sources :

```typescript
// src/hooks/useTemporalVisualization.ts
const loadHistoricalData = useCallback(async () => {
  // Charger les données de toutes les sources en parallèle
  const promises: Promise<TemporalDataPoint[]>[] = [];

  if (selectedSources.includes("atmoMicro")) {
    promises.push(
      atmoMicroService.current.fetchTemporalData({
        pollutant: selectedPollutant,
        timeStep: state.timeStep,
        startDate: state.startDate,
        endDate: state.endDate,
      })
    );
  }

  if (selectedSources.includes("atmoRef")) {
    promises.push(
      atmoRefService.current.fetchTemporalData({
        pollutant: selectedPollutant,
        timeStep: state.timeStep,
        startDate: state.startDate,
        endDate: state.endDate,
      })
    );
  }

  const results = await Promise.all(promises);

  // Fusion intelligente par timestamp avec tolérance
  const temporalDataMap = new Map<string, TemporalDataPoint>();

  // Fonction pour trouver un timestamp proche (tolérance de 5 min)
  const findNearbyTimestamp = (target: string): string | null => {
    const targetTime = new Date(target).getTime();
    const tolerance = 5 * 60 * 1000; // 5 minutes

    for (const [timestamp] of temporalDataMap) {
      const diff = Math.abs(new Date(timestamp).getTime() - targetTime);
      if (diff <= tolerance) return timestamp;
    }
    return null;
  };

  // Fusionner les résultats
  results.forEach((temporalData) => {
    temporalData.forEach((point) => {
      const nearbyTimestamp = findNearbyTimestamp(point.timestamp);
      const existingPoint = nearbyTimestamp
        ? temporalDataMap.get(nearbyTimestamp)
        : null;

      if (existingPoint) {
        // Fusionner les devices
        existingPoint.devices.push(...point.devices);
        existingPoint.deviceCount += point.deviceCount;

        // Fusionner les niveaux de qualité
        Object.keys(point.qualityLevels).forEach((level) => {
          existingPoint.qualityLevels[level] =
            (existingPoint.qualityLevels[level] || 0) +
            point.qualityLevels[level];
        });

        // Recalculer la moyenne
        const totalValue = existingPoint.devices.reduce(
          (sum, device) => sum + (device.value || 0),
          0
        );
        existingPoint.averageValue = totalValue / existingPoint.devices.length;
      } else {
        // Nouveau point temporel
        temporalDataMap.set(point.timestamp, { ...point });
      }
    });
  });

  // Convertir en tableau et trier
  const allTemporalData = Array.from(temporalDataMap.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  setState((prev) => ({
    ...prev,
    data: allTemporalData,
    currentDate: allTemporalData[0]?.timestamp || prev.startDate,
    loading: false,
  }));
}, [state.startDate, state.endDate, selectedPollutant, selectedSources]);
```

**Avantages de cette approche** :

1. **Tolérance temporelle** : Les timestamps proches (5 minutes) sont fusionnés
2. **Cohabitation des sources** : Les marqueurs AtmoRef et AtmoMicro s'affichent ensemble
3. **Statistiques consolidées** : Les moyennes et niveaux de qualité sont recalculés
4. **Performance** : Chargement en parallèle avec `Promise.all`

#### 3. Différences entre AtmoRef et AtmoMicro

| Aspect                | AtmoRef                             | AtmoMicro                        |
| --------------------- | ----------------------------------- | -------------------------------- |
| **Type de capteurs**  | Stations fixes de référence         | Capteurs mobiles                 |
| **Endpoint API**      | `/observations/stations/mesures`    | `/observations/capteurs/mesures` |
| **Structure réponse** | `{ mesures: [...] }`                | `[...]` (tableau direct)         |
| **Identifiant**       | `id_station` (string)               | `id_site` (number)               |
| **Coordonnées**       | Dans `stations` séparé              | Dans chaque mesure               |
| **Temporalités**      | quart-horaire, horaire, journalière | brute, quart-horaire, horaire    |
| **Données corrigées** | Non                                 | Oui (`valeur` vs `valeur_brute`) |

### Problèmes Résolus

#### Problème 1 : Logique de chunks incorrecte (AtmoRef)

**Avant** :

```typescript
const chunkSize = 30 * 24 * 60 * 60 * 1000; // millisecondes
for (
  let chunkStart = startTime;
  chunkStart < endTime;
  chunkStart += chunkSize
) {
  // Calculs incorrects avec des millisecondes
}
```

**Après** :

```typescript
const chunkSize = 30; // jours
for (let i = 0; i < chunks; i++) {
  const chunkStart = new Date(start);
  chunkStart.setDate(chunkStart.getDate() + i * chunkSize);
  // Calculs corrects avec des dates
}
```

#### Problème 2 : Marqueurs non simultanés

**Cause** : Les données de chaque source créaient leurs propres `TemporalDataPoint` sans fusion

**Solution** : Fusion intelligente avec tolérance temporelle de 5 minutes

**Résultat** : Les marqueurs AtmoRef et AtmoMicro s'affichent maintenant simultanément

#### Problème 3 : Transformation des données incohérente

**Avant** : Utilisation de `getPollutantFromAtmoRefName()` pour mapper les labels

**Après** : Utilisation directe du paramètre `pollutant` passé en entrée

**Avantage** : Simplification et cohérence avec AtmoMicro

### Logs de Debug

Pour faciliter le diagnostic, des logs détaillés ont été ajoutés :

```
🕒 [AtmoRef] Récupération des données temporelles
📊 [AtmoRef] Division en X tranches de 30 jours
📅 [AtmoRef] Traitement tranche 1/X: YYYY-MM-DD à YYYY-MM-DD
🔍 [AtmoRef] URL de requête: ...
✅ [AtmoRef] Requête réussie, traitement des données...
✅ [AtmoRef] Tranche traitée: X timestamps
✅ [AtmoRef] X points temporels récupérés

🔄 [HOOK] Traitement des données de la source 1
➕ [HOOK] Nouveau point temporel créé
🔗 [HOOK] Fusion avec timestamp existant
🔍 [HOOK] Détails de la fusion
✅ [HOOK] X points temporels chargés
```

### Tests Recommandés

Pour valider les corrections :

1. **Test sources multiples** :

   - Sélectionner AtmoRef + AtmoMicro
   - Période : 7 jours, Polluant : PM2.5
   - Vérifier l'affichage simultané des marqueurs

2. **Test tolérance temporelle** :

   - Observer les logs de fusion
   - Vérifier que les timestamps proches sont bien fusionnés

3. **Test performance** :

   - Période : 3 mois
   - Vérifier que les chunks sont traités correctement
   - Temps de chargement acceptable

4. **🆕 Test limitations de période** :

   - Pas de temps 15 min : Vérifier limitation à 7 jours
   - Pas de temps Heure : Vérifier limitation à 30 jours
   - Messages informatifs affichés correctement

5. **🆕 Test synchronisation timeStep** :

   - Changer le pas de temps en mode historique
   - Vérifier que les données sont réinitialisées
   - Vérifier que les nouvelles requêtes utilisent le bon pas de temps

6. **🆕 Test données AtmoMicro quart-horaire** :
   - Pas de temps 15 min : Vérifier utilisation de `valeur_ref`
   - Comparer avec pas de temps horaire
   - Vérifier réduction des valeurs à 0

### Configuration des Pas de Temps

| Pas de temps   | AtmoRef (temporalite)     | AtmoMicro (aggregation)  |
| -------------- | ------------------------- | ------------------------ |
| **instantane** | quart-horaire (délai 181) | brute (délai 181)        |
| **deuxMin**    | ❌ Non supporté           | brute (délai 181)        |
| **quartHeure** | quart-horaire (délai 19)  | quart-horaire (délai 19) |
| **heure**      | horaire (délai 64)        | horaire (délai 64)       |
| **jour**       | journalière (délai 1444)  | ❌ Non supporté          |

Cette approche rend le code maintenable, testable et extensible.

## 📝 Changelog

### Version 2.1 (Janvier 2025) 🆕

#### Nouvelles Fonctionnalités

- **Panneau de lecture draggable** : Contrôles de lecture dans un panneau déplaçable sur la carte
- **Panel de sélection rabattable** : Le panel de sélection se rabat automatiquement après le chargement des données
- **Isolation des side panels** : Fermeture automatique de tous les side panels (stations, SignalAir, MobileAir) en mode historique
- **Désactivation des interactions** : Les marqueurs ne peuvent plus ouvrir de side panels en mode historique
- **Indicateur de chargement** : Feedback visuel complet pendant le rechargement des données avec désactivation des contrôles

#### Améliorations Techniques

- Séparation des responsabilités : Panel de sélection pour les dates, Panneau draggable pour les contrôles
- Gestion d'état améliorée : Suivi de l'ouverture manuelle du panel pour éviter les rabattements intempestifs
- UX améliorée : Le panel reste visible mais rabattu, permettant un accès rapide
- Feedback visuel : Indicateurs de chargement, états disabled appropriés, transitions fluides

#### Corrections

- Résolution du problème de réouverture du panel qui se refermait instantanément
- Amélioration de la gestion du drag pendant le chargement
- Meilleure cohérence visuelle entre les différents états

### Version 2.0 (Décembre 2024)

#### Nouvelles Fonctionnalités

- **Limitations de période dynamiques** selon le pas de temps
- **Synchronisation automatique** du pas de temps avec l'interface principale
- **Amélioration des données AtmoMicro** pour l'agrégation quart-horaire
- **Messages informatifs contextuels** selon la configuration

#### Améliorations Techniques

- Utilisation de `valeur_ref` pour AtmoMicro en mode quart-horaire
- Réinitialisation intelligente des données lors du changement de pas de temps
- Validation des périodes avec messages d'erreur appropriés
- Interface utilisateur plus informative

#### Corrections

- Résolution du problème des valeurs à 0 pour les microcapteurs
- Synchronisation correcte du timeStep entre composants
- Amélioration de la qualité des données affichées

### Version 1.0 (Initiale)

- Mode historique de base
- Support AtmoMicro et AtmoRef
- Navigation temporelle interactive
- Contrôles de lecture (play/pause/vitesse)
