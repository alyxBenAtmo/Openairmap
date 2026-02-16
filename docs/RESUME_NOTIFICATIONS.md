# Résumé - Système de Notifications

Document **index** du système de notifications (compatibilité source / pas de temps). Pour les détails, voir les deux autres documents listés ci-dessous.

## État d'implémentation

- **Toast (Proposition 1)** : En place dans l'app. `SourceDropdown` dans `App.tsx` utilise `onToast` ; `useToast` et `ToastContainer` gèrent les notifications.
- **Inline + contextuelle (Propositions 2 & 3)** : Implémentées dans `SourceDropdownWithNotifications`.
- **Hybride (Proposition 4)** : Possible en remplaçant `SourceDropdown` par `SourceDropdownWithNotifications` dans `App.tsx`.

---

## Fichiers concernés

| Rôle | Fichier |
|------|---------|
| Utilitaires | `src/utils/sourceCompatibility.ts` |
| Composant Toast | `src/components/ui/toast.tsx` |
| Hook | `src/hooks/useToast.ts` |
| Dropdown avec toasts | `src/components/controls/SourceDropdown.tsx` (utilisé dans App) |
| Dropdown hybride (badges + bandeau) | `src/components/controls/SourceDropdownWithNotifications.tsx` |

---

## Documentation

- **`docs/PROPOSITIONS_NOTIFICATIONS.md`** : Les 4 propositions (Toast, Inline, Contextuelle, Hybride), design et comparaison.
- **`docs/EXEMPLE_INTEGRATION_NOTIFICATIONS.md`** : Guide d’intégration pas à pas, exemples de code, personnalisation et dépannage.

---

## Intégration rapide

- **Garder le comportement actuel** : rien à faire (toasts déjà gérés par `SourceDropdown` dans `App.tsx`).
- **Passer au système hybride** : dans **`App.tsx`**, remplacer `SourceDropdown` par `SourceDropdownWithNotifications` avec les mêmes props (`selectedSources`, `selectedTimeStep`, `onSourceChange`, `onTimeStepChange`, `onToast`). Détails et code complet dans `EXEMPLE_INTEGRATION_NOTIFICATIONS.md`.

---

## Personnalisation rapide

- **Couleurs** : classes Tailwind dans `toast.tsx` (`bg-amber-50`, `text-amber-900`, etc.).
- **Position** : conteneur dans `toast.tsx` (`fixed bottom-4 right-4` ; z-index `z-[9999]`).
- **Durée** : `duration` dans l’appel à `addToast()` (ex. dans `SourceDropdown` / `SourceDropdownWithNotifications`), ou défaut 5000 ms dans `toast.tsx`.

---

## En bref

- Limiter à 3–4 toasts simultanés.
- Messages courts et actionnables.
- En cas de souci : vérifier imports, Tailwind, z-index ; consulter `EXEMPLE_INTEGRATION_NOTIFICATIONS.md`.
