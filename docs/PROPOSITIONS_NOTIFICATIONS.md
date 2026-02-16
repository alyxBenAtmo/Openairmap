# Propositions de Système de Notifications

## Contexte

L'utilisateur active une source qui n'est pas disponible au pas de temps actuel. Il faut l'informer de manière claire et esthétique pour éviter toute confusion.

## État d'implémentation

- **Proposition 1 (Toast)** : Implémentée. `useToast`, `ToastContainer` et `SourceDropdown` avec `onToast` affichent des toasts (warning, action « Changer le pas de temps »). Voir `src/components/ui/toast.tsx`, `src/hooks/useToast.ts`, `src/App.tsx`.
- **Propositions 2 et 3 (Inline + contextuelle)** : Implémentées dans `SourceDropdownWithNotifications` (badges sur les sources incompatibles, bandeau d'alerte dans le dropdown avec bouton d'action). Voir `src/components/controls/SourceDropdownWithNotifications.tsx`.
- **Proposition 4 (Hybride)** : Disponible en utilisant `SourceDropdownWithNotifications` à la place de `SourceDropdown` dans `App.tsx` (toasts restent gérés par `onToast`). L'application utilise actuellement `SourceDropdown` (toast seul).

---

## Proposition 1 : Toast Notifications (Recommandée)

### Concept
Notifications toast modernes qui apparaissent en bas à droite de l'écran avec animation fluide.

### Avantages
- Non-intrusif, ne bloque pas l'interface
- Peut afficher plusieurs notifications en pile
- Style moderne et professionnel
- Auto-dismiss après quelques secondes
- Compatible avec tous les écrans

### Design
```
┌─────────────────────────────────────────┐
│ PurpleAir non disponible │
│ │
│ Cette source n'est disponible qu'aux │
│ pas de temps "Scan" et "≤ 2 min". │
│ │
│ [Changer le pas de temps] [Fermer] │
└─────────────────────────────────────────┘
```

### Implémentation
- Composant `Toast` réutilisable
- Hook `useToast` pour gérer l'état
- Animation d'entrée/sortie (slide + fade)
- Queue de notifications
- Actions contextuelles (bouton pour changer le pas de temps)

---

## Proposition 2 : Indicateurs Visuels Inline

### Concept
Badges et icônes directement dans le dropdown pour indiquer les incompatibilités.

### Avantages
- Feedback immédiat avant sélection
- Prévention plutôt que correction
- Visuellement intégré au design existant
- Pas de notification séparée

### Design
```
┌─────────────────────────────────────┐
│ Station de référence atmosud │
│ Microcapteurs qualifiés │
│ [ ] PurpleAir (attention) │
│ └─ Disponible uniquement en │
│ "Scan" et "≤ 2 min" │
└─────────────────────────────────────┘
```

### Implémentation
- Badge d'avertissement sur les sources incompatibles
- Tooltip au survol avec explication
- Désactivation visuelle (opacité réduite)
- Message contextuel sous la source

---

## Proposition 3 : Notification Contextuelle dans le Dropdown

### Concept
Bandeau d'information qui apparaît dans le dropdown après sélection d'une source incompatible.

### Avantages
- Feedback immédiat dans le contexte
- Pas besoin de chercher ailleurs
- Peut suggérer une action (changer le pas de temps)

### Design
```
┌─────────────────────────────────────┐
│ PurpleAir │
│ │
│ ┌─────────────────────────────────┐ │
│ │ Attention - Source non disponible │ │
│ │ │ │
│ │ PurpleAir n'est disponible │ │
│ │ qu'aux pas de temps "Scan" et │ │
│ │ "≤ 2 min". │ │
│ │ │ │
│ │ [Changer vers "Scan"] [OK] │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Implémentation
- Bandeau d'alerte dans le dropdown
- Animation d'apparition
- Bouton d'action rapide
- Auto-fermeture après action

---

## Proposition 4 : Système Hybride (Meilleure UX)

### Concept
Combinaison des propositions 1, 2 et 3 pour une expérience optimale.

### Fonctionnalités
1. **Prévention** : Indicateurs visuels dans le dropdown (badge + tooltip)
2. **Feedback immédiat** : Notification contextuelle dans le dropdown
3. **Rappel** : Toast notification si l'utilisateur ignore l'avertissement

### Flux utilisateur
```
1. Utilisateur ouvre le dropdown
→ Voir les badges d'avertissement sur les sources incompatibles

2. Utilisateur clique sur une source incompatible
→ Bandeau d'alerte apparaît dans le dropdown
→ Toast notification apparaît en bas à droite

3. Utilisateur peut :
- Changer le pas de temps (bouton dans le toast)
- Désélectionner la source
- Ignorer (toast disparaît après 5s)
```

### Avantages
- Prévention + Feedback + Rappel
- Multiples points de contact
- Actions rapides disponibles
- Expérience utilisateur complète

---

## Détails de Design

### Couleurs
- **Avertissement** : `#F59E0B` (amber-500)
- **Fond** : `#FFFBEB` (amber-50)
- **Texte** : `#92400E` (amber-800)
- **Bordure** : `#FCD34D` (amber-300)

### Typographie
- **Titre** : Font-medium, text-sm
- **Description** : Font-normal, text-xs
- **Actions** : Font-medium, text-xs

### Animations
- **Entrée** : Slide up + fade in (300ms)
- **Sortie** : Slide down + fade out (200ms)
- **Hover** : Scale 1.02 (100ms)

### Responsive
- Mobile : Toast en bas, pleine largeur
- Desktop : Toast en bas à droite, largeur fixe (400px)

---

## Comparaison des Propositions

| Critère | Toast | Inline | Contextuelle | Hybride |
|---------|-------|--------|--------------|---------|
| **Visibilité** | | | | |
| **Prévention** | | | | |
| **Feedback** | | | | |
| **Intégration** | | | | |
| **Complexité** | | | | |

---

## Recommandation

**Proposition 4 (Hybride)** est recommandée car elle offre :
- La meilleure expérience utilisateur
- Plusieurs niveaux de feedback
- Actions rapides disponibles
- Prévention des erreurs

**Alternative rapide** : Si vous voulez une solution plus simple, **Proposition 1 (Toast)** est un excellent compromis.



