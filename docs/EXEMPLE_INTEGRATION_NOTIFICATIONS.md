# Exemple d'Intégration du Système de Notifications

## Contexte

L'application utilise déjà **useToast**, **ToastContainer** et **SourceDropdown** avec `onToast` dans `App.tsx` : les toasts de compatibilité source / pas de temps sont donc déjà en place. **SourceDropdownWithNotifications** est une variante optionnelle qui ajoute des indicateurs visuels (badges d'avertissement) dans le menu des sources. Ce document sert de guide si vous souhaitez basculer sur cette variante ou réutiliser le pattern ailleurs.

## Intégration dans App.tsx

Voici comment intégrer (ou remplacer par) le système avec notifications :

### 1. Importer les composants nécessaires

Les chemins ci-dessous sont relatifs à la racine `src/` (ex. depuis `App.tsx`).

```typescript
import { useToast } from "./hooks/useToast";
import { ToastContainer } from "./components/ui/toast";
import SourceDropdownWithNotifications from "./components/controls/SourceDropdownWithNotifications";
```

### 2. Ajouter le hook useToast dans le composant App

```typescript
const App: React.FC = () => {
// ... autres hooks
const { toasts, addToast, removeToast } = useToast();

// ... reste du code
};
```

### 3. Remplacer SourceDropdown par SourceDropdownWithNotifications

```typescript
// Avant
<SourceDropdown
selectedSources={selectedSources}
onSourceChange={setSelectedSources}
/>

// Après
<SourceDropdownWithNotifications
selectedSources={selectedSources}
selectedTimeStep={selectedTimeStep}
onSourceChange={setSelectedSources}
onTimeStepChange={setSelectedTimeStep}
onToast={addToast}
/>
```

### 4. Ajouter le ToastContainer dans le JSX

```typescript
return (
<div>
{/* ... reste de votre JSX */}

{/* Ajouter le conteneur de toasts */}
<ToastContainer toasts={toasts} onClose={removeToast} />
</div>
);
```

---

## Exemple Complet

```typescript
import React, { useState, useMemo } from "react";
import { useToast } from "./hooks/useToast";
import { ToastContainer } from "./components/ui/toast";
import SourceDropdownWithNotifications from "./components/controls/SourceDropdownWithNotifications";
// ... autres imports

const App: React.FC = () => {
const [selectedSources, setSelectedSources] = useState<string[]>([]);
const [selectedTimeStep, setSelectedTimeStep] = useState<string>("heure");

// Hook pour les notifications
const { toasts, addToast, removeToast } = useToast();

return (
<div className="app">
{/* Vos autres composants */}

<SourceDropdownWithNotifications
selectedSources={selectedSources}
selectedTimeStep={selectedTimeStep}
onSourceChange={setSelectedSources}
onTimeStepChange={setSelectedTimeStep}
onToast={addToast}
/>

{/* Conteneur de toasts */}
<ToastContainer toasts={toasts} onClose={removeToast} />
</div>
);
};
```

---

## Personnalisation

### Changer la durée d'affichage

```typescript
onToast({
title: "Titre",
description: "Description",
duration: 10000, // 10 secondes au lieu de 5
});
```

### Désactiver l'auto-dismiss

```typescript
onToast({
title: "Titre",
description: "Description",
duration: 0, // Ne disparaît jamais automatiquement
});
```

### Ajouter une action personnalisée

```typescript
onToast({
title: "PurpleAir non disponible",
description: "Cette source n'est disponible qu'aux pas de temps 'Scan' et '≤ 2 min'.",
variant: "warning",
action: {
label: "Changer le pas de temps",
onClick: () => {
setSelectedTimeStep("instantane");
},
},
});
```

---

## Utilisation Avancée

### Vérifier la compatibilité manuellement

```typescript
import {
isSourceCompatibleWithTimeStep,
getSourceDisplayName,
} from "./utils/sourceCompatibility";

const handleSourceChange = (sources: string[]) => {
setSelectedSources(sources);

// Vérifier les incompatibilités
const incompatible = sources.filter(
(source) => !isSourceCompatibleWithTimeStep(source, selectedTimeStep)
);

if (incompatible.length > 0) {
incompatible.forEach((source) => {
addToast({
title: `${getSourceDisplayName(source)} non disponible`,
description: "Cette source n'est pas compatible avec le pas de temps actuel.",
variant: "warning",
});
});
}
};
```

---

## Responsive

Le système de toast est automatiquement responsive :
- **Mobile** : Les toasts s'adaptent à la largeur de l'écran
- **Desktop** : Les toasts apparaissent en bas à droite avec une largeur fixe

---

## Bonnes Pratiques

1. **Ne pas surcharger** : Limitez le nombre de toasts simultanés (max 3-4)
2. **Messages clairs** : Utilisez des messages courts et actionnables
3. **Actions contextuelles** : Proposez toujours une action si possible
4. **Variantes appropriées** : Utilisez `warning` pour les incompatibilités, `error` pour les erreurs, etc.

---

## Dépannage

### Les toasts n'apparaissent pas
- Vérifiez que `ToastContainer` est bien dans le JSX
- Vérifiez que le z-index est suffisant (9999 par défaut)

### Les animations ne fonctionnent pas
- Vérifiez que Tailwind CSS est bien configuré
- Vérifiez que les classes de transition sont présentes

### Les actions ne fonctionnent pas
- Vérifiez que les callbacks sont bien passés
- Vérifiez que les fonctions sont bien définies



