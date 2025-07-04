# Fonctionnalité Auto-Refresh des Données

## 🎯 Vue d'ensemble

La fonctionnalité d'auto-refresh permet de rafraîchir automatiquement les données affichées sur la carte selon le pas de temps sélectionné. L'utilisateur peut activer ou désactiver cette fonctionnalité selon ses besoins.

## ⏰ Intervalles de Rafraîchissement

| Pas de temps    | Intervalle de rafraîchissement | Description                                              |
| --------------- | ------------------------------ | -------------------------------------------------------- |
| **Scan**        | 60 secondes                    | Données instantanées rafraîchies toutes les minutes      |
| **≤ 2 minutes** | 60 secondes                    | Données sur 2 minutes rafraîchies toutes les minutes     |
| **15 minutes**  | 15 minutes                     | Données sur 15 minutes rafraîchies toutes les 15 minutes |
| **Heure**       | 60 minutes                     | Données horaires rafraîchies toutes les heures           |
| **Jour**        | 24 heures                      | Données journalières rafraîchies toutes les 24 heures    |

## 🎛️ Contrôle Utilisateur

### Interface Simple

- **Bouton toggle** : Active/désactive l'auto-refresh
- **Indicateur de statut** : Point vert (actif), gris (inactif), bleu (chargement)
- **Période de données** : Affichage de la période actuellement affichée sur la carte
- **Dernier rafraîchissement** : Horodatage du dernier chargement de données

### Comportement

- **Activé par défaut** : L'auto-refresh est activé au démarrage
- **Contrôle manuel** : L'utilisateur peut l'activer/désactiver à tout moment
- **Pause automatique** : Se met en pause si aucune source n'est sélectionnée

## 🔧 Implémentation Technique

### Hook `useAirQualityData`

Le hook principal a été modifié pour inclure la gestion de l'auto-refresh :

```typescript
interface UseAirQualityDataProps {
  // ... autres propriétés
  autoRefreshEnabled?: boolean; // Nouveau paramètre
}

// Correction : utiliser le code réel du pas de temps
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

### Gestion des Intervalles

- **useRef** : Stocke la référence de l'intervalle pour pouvoir le nettoyer
- **useEffect** : Configure et nettoie les intervalles selon le pas de temps
- **Nettoyage automatique** : Les intervalles sont automatiquement nettoyés lors du changement de pas de temps ou du démontage du composant
- **Correction de mapping** : Conversion automatique des clés vers les codes de pas de temps

### États Ajoutés

```typescript
const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
```

## 🎨 Interface Utilisateur

### Composant `AutoRefreshControl`

Le composant affiche dans l'en-tête :

- **Bouton toggle** : Switch on/off pour activer/désactiver
- **Label** : "Auto-refresh"
- **Indicateur de statut** : Point coloré selon l'état
- **Période de données** : Affichage de la période actuellement affichée sur la carte
- **Dernier rafraîchissement** : Horodatage du dernier chargement

### Affichage de la Période de Données

Le composant calcule et affiche la période selon le pas de temps :

- **Jour** : Date de la veille (ex: "15/12/2024")
- **Heure** : Plage horaire précédente (ex: "14h-15h")
- **15 minutes** : Quart d'heure précédent (ex: "14h45-15h00")
- **Scan** : Heure actuelle (ex: "15:30")
- **≤2 minutes** : Période de 2 minutes précédente (ex: "14h28-14h30")

### Indicateurs Visuels

- **Point vert** : Auto-refresh actif
- **Point gris** : Auto-refresh inactif
- **Point bleu animé** : Chargement en cours
- **Horodatage** : Format "HH:MM" pour le dernier rafraîchissement

## 🔄 Logique de Fonctionnement

### Déclenchement Initial

1. **Chargement initial** : Les données sont chargées immédiatement
2. **Configuration de l'intervalle** : Selon le pas de temps sélectionné
3. **Démarrage de l'auto-refresh** : Si activé, l'intervalle se met en place

### Gestion des Changements

1. **Changement de pas de temps** : L'ancien intervalle est nettoyé, un nouveau est configuré
2. **Activation/désactivation** : L'intervalle est créé ou supprimé selon l'état
3. **Changement de sources** : L'auto-refresh se met en pause si aucune source n'est sélectionnée

### Nettoyage

- **Démontage du composant** : L'intervalle est automatiquement nettoyé
- **Changement de paramètres** : L'ancien intervalle est nettoyé avant d'en créer un nouveau

## 🐛 Corrections Apportées

### Bug d'Intervalle Incorrect

**Problème** : L'auto-refresh se déclenchait toutes les minutes au lieu de respecter l'intervalle du pas de temps sélectionné.

**Cause** : Le hook `useAirQualityData` recevait les clés de l'objet `pasDeTemps` (`quartHeure`, `deuxMin`, etc.) mais comparait avec les codes (`qh`, `2min`, etc.).

**Solution** : Ajout d'une conversion automatique dans `getRefreshInterval` :

```typescript
const code = pasDeTemps[timeStep]?.code || timeStep;
```

**Résultat** : Les intervalles sont maintenant corrects pour tous les pas de temps.

## 🛡️ Gestion des Erreurs

### Robustesse

- **Erreurs d'API** : L'auto-refresh continue même en cas d'erreur sur une source
- **Données existantes** : Les données précédentes sont conservées en cas d'erreur
- **Logs détaillés** : Console pour le debugging des problèmes

### Fallback

- **Intervalle par défaut** : 60 secondes si le pas de temps n'est pas reconnu
- **Pas de sources** : L'auto-refresh se met en pause automatiquement

## 🚀 Optimisations

### Performance

- **Nettoyage mémoire** : Les intervalles sont correctement nettoyés
- **Rendu optimisé** : Seules les informations nécessaires sont mises à jour
- **Interface légère** : Composant simple et efficace

### Expérience Utilisateur

- **Contrôle simple** : Un seul bouton pour activer/désactiver
- **Feedback visuel** : L'utilisateur sait toujours l'état de l'auto-refresh
- **Transparence** : Affichage clair du dernier rafraîchissement et de la période affichée

## 🔧 Configuration

### Variables d'Environnement

Aucune variable d'environnement supplémentaire n'est requise. La fonctionnalité utilise les mêmes APIs que le chargement manuel.

### Personnalisation

Les intervalles peuvent être modifiés dans la fonction `getRefreshInterval` du hook `useAirQualityData`.

## 📝 Logs et Debugging

### Console

```javascript
// Configuration de l'auto-refresh
⏰ Auto-refresh configuré: 900 secondes

// Déclenchement automatique
🔄 Auto-refresh déclenché pour le pas de temps: quartHeure

// Appels API
🔄 Appel API - Polluant: PM2.5, Sources: atmoRef, atmoMicro, Pas de temps: quartHeure
```

### Monitoring

- **Dernier rafraîchissement** : Horodatage disponible dans l'interface
- **Période affichée** : Indication claire de la période de données affichée
- **Statut des sources** : Indication des sources en cours de chargement

## 🎯 Avantages

1. **Simplicité** : Interface claire avec un seul bouton de contrôle
2. **Données à jour** : Les utilisateurs voient toujours les données les plus récentes
3. **Contrôle utilisateur** : Possibilité d'activer/désactiver selon les besoins
4. **Transparence** : Affichage du dernier rafraîchissement et de la période affichée
5. **Performance** : Optimisé pour éviter les surcharges serveur
6. **Fiabilité** : Correction du bug d'intervalle pour un comportement correct
