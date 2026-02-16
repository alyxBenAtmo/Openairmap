# Tests de Performance - 1000 Marqueurs

## Vue d'ensemble

Ce document décrit les **procédures de test** et les **objectifs** pour évaluer les performances de l'application OpenAirMap avec un grand nombre de marqueurs (1000+) sur la carte. Ces tests permettent d'identifier les goulots d'étranglement et d'optimiser le rendu des marqueurs.

### État d'implémentation et de réalisation

- **Mode test dédié** : Le mode test (raccourci clavier, panneau de contrôle, moniteur FPS) n'est pas encore implémenté dans l'application.
- **Tests non réalisés** : Les scénarios et métriques décrits ci-dessous n'ont pas encore été exécutés ; les objectifs et tableaux de résultats sont des **cibles à valider** lors d'une future campagne de tests.

Ce document sert de **spécification** et de **guide pour de futurs tests manuels** : les scénarios pourront être suivis en utilisant les données réelles (plusieurs sources activées, zone chargée) ou un futur mode test. Les métriques (FPS, Frame Time, etc.) pourront être observées via les **outils du navigateur** (Chrome DevTools → Performance, Memory).

## Activation du mode test (prévu)

> Les éléments ci-dessous décrivent le comportement **souhaité** pour un futur mode test. Ils ne sont pas encore disponibles dans le code.

### Méthode 1 : Raccourci clavier (à implémenter)
Appuyez sur **Ctrl+Shift+T** pour activer/désactiver rapidement le mode test.

### Méthode 2 : Panneau de contrôle (à implémenter)
Un panneau de contrôle est prévu en haut à droite de l'écran lorsque le mode test est activé. Il permettrait de :
- Activer/désactiver le mode test
- Ajuster le nombre de marqueurs (100 à 5000)
- Activer/désactiver le monitoring de performance
- Utiliser des presets rapides (100, 500, 1000, 2000, 5000 marqueurs)

## Métriques mesurées (objectifs du moniteur à venir)

Le moniteur de performance, une fois implémenté, afficherait en temps réel :
- **FPS** (Frames Per Second) : Nombre d'images par seconde
- > 50 FPS : Excellent
- 30-50 FPS : Acceptable
- < 30 FPS : Problème de performance
- **Frame Time** : Temps de traitement d'une frame (ms)
- **Render Time** : Temps de rendu des marqueurs (ms)
- **Memory** : Utilisation mémoire (MB) - Disponible uniquement dans Chrome
- **Markers** : Nombre total de marqueurs affichés

## Scénarios de test

En l'absence du mode test dédié, vous pouvez reproduire ces scénarios en activant plusieurs sources de données, en chargeant une zone dense, puis en utilisant Chrome DevTools (Performance, Memory) pour mesurer FPS et mémoire. Le clustering et le spiderfying se règlent via les contrôles de la carte (en bas à gauche).

### 1. Marqueurs simples (sans clustering, sans spiderfying)

**Configuration :**
- Clustering : **OFF**
- Spiderfying : **OFF**
- Nombre de marqueurs : 1000

**Actions à effectuer :**
1. Activer le mode test avec 1000 marqueurs
2. Activer le monitoring de performance
3. Observer les métriques au chargement initial
4. Déplacer la carte (pan)
5. Zoomer/dézoomer plusieurs fois

**Métriques attendues :**
- Temps de rendu initial : < 100ms
- FPS moyen : > 30 FPS
- FPS pendant le pan : > 30 FPS
- FPS pendant le zoom : > 30 FPS

**Points à vérifier :**
- [ ] Pas de freeze au chargement
- [ ] Rendu fluide lors du déplacement
- [ ] Pas de latence lors des interactions (clic, hover)

---

### 2. Avec clustering

**Configuration :**
- Clustering : **ON**
- Spiderfying : **OFF**
- Nombre de marqueurs : 1000

**Actions à effectuer :**
1. Activer le mode test avec 1000 marqueurs
2. Activer le clustering dans les contrôles de la carte
3. Activer le monitoring de performance
4. Observer le temps de création des clusters
5. Zoomer progressivement pour voir les clusters se diviser
6. Dézoomer pour voir les clusters se regrouper

**Métriques attendues :**
- Temps de création des clusters : < 200ms
- FPS moyen : > 50 FPS
- FPS pendant le zoom : > 40 FPS
- FPS pendant le pan : > 50 FPS

**Points à vérifier :**
- [ ] Les clusters se créent rapidement
- [ ] Les clusters se divisent/regroupent de manière fluide
- [ ] Pas de freeze lors de la division des clusters
- [ ] Les animations de clustering sont fluides

---

### 3. Avec spiderfying

**Configuration :**
- Clustering : **OFF**
- Spiderfying : **ON**
- Nombre de marqueurs : 1000

**Actions à effectuer :**
1. Activer le mode test avec 1000 marqueurs
2. Activer le spiderfying dans les contrôles de la carte
3. Activer le monitoring de performance
4. Zoomer jusqu'au niveau où les marqueurs se chevauchent
5. Observer le temps de spiderfying
6. Déplacer la carte pour voir les marqueurs se réorganiser

**Métriques attendues :**
- Temps de spiderfying : < 150ms
- FPS moyen : > 40 FPS
- FPS pendant le spiderfying : > 30 FPS

**Points à vérifier :**
- [ ] Les marqueurs s'éclatent rapidement quand ils se chevauchent
- [ ] Les lignes de connexion sont visibles
- [ ] Pas de freeze lors de l'éclatement
- [ ] Les marqueurs reviennent à leur position initiale au dézoom

---

### 4. Test de zoom/dézoom progressif

**Configuration :**
- Clustering : **ON** (recommandé)
- Nombre de marqueurs : 1000

**Actions à effectuer :**
1. Activer le mode test avec 1000 marqueurs
2. Activer le monitoring de performance
3. Zoomer progressivement du niveau 1 au niveau 18
4. Observer les FPS à chaque niveau de zoom
5. Dézoomer progressivement du niveau 18 au niveau 1

**Métriques attendues :**
- FPS stable à tous les niveaux de zoom : > 30 FPS
- Pas de freeze pendant le zoom
- Temps de transition entre niveaux : < 100ms

**Points à vérifier :**
- [ ] Pas de freeze pendant le zoom
- [ ] FPS stable à tous les niveaux
- [ ] Les marqueurs/clusters s'affichent correctement à chaque niveau

---

### 5. Test de pan (déplacement de carte)

**Configuration :**
- Clustering : **ON** (recommandé)
- Nombre de marqueurs : 1000

**Actions à effectuer :**
1. Activer le mode test avec 1000 marqueurs
2. Activer le monitoring de performance
3. Déplacer la carte rapidement dans toutes les directions
4. Observer les FPS pendant le pan
5. Arrêter le pan et observer la stabilisation

**Métriques attendues :**
- FPS pendant le pan : > 30 FPS
- Latence de réponse : < 50ms
- Pas de freeze pendant le déplacement

**Points à vérifier :**
- [ ] Déplacement fluide sans saccades
- [ ] Pas de latence visible
- [ ] Les marqueurs se chargent rapidement dans la nouvelle zone

---

### 6. Test de chargement progressif

**Configuration :**
- Clustering : **ON**
- Nombre de marqueurs : Variable (100, 500, 1000, 2000, 5000)

**Actions à effectuer :**
1. Activer le mode test
2. Activer le monitoring de performance
3. Tester avec 100 marqueurs, noter les métriques
4. Augmenter progressivement : 500, 1000, 2000, 5000
5. Noter les métriques à chaque étape

**Métriques à noter :**
- Temps de rendu initial
- FPS moyen
- Utilisation mémoire
- Point de rupture (quand FPS < 30)

**Tableau de résultats attendu :**

| Marqueurs | Temps rendu (ms) | FPS moyen | Mémoire (MB) | Statut |
|-----------|------------------|-----------|--------------|--------|
| 100 | < 50 | > 55 | < 50 | |
| 500 | < 80 | > 50 | < 100 | |
| 1000 | < 150 | > 40 | < 150 | |
| 2000 | < 300 | > 35 | < 250 | Attention |
| 5000 | < 500 | > 30 | < 500 | Attention |

**Points à vérifier :**
- [ ] Identifier le nombre maximum de marqueurs pour maintenir > 30 FPS
- [ ] Identifier le point où la mémoire devient problématique
- [ ] Noter les optimisations nécessaires

---

### 7. Test d'interaction (clic, hover)

**Configuration :**
- Nombre de marqueurs : 1000
- Clustering : **ON** (recommandé)

**Actions à effectuer :**
1. Activer le mode test avec 1000 marqueurs
2. Cliquer sur plusieurs marqueurs
3. Passer la souris sur plusieurs marqueurs (hover)
4. Observer la latence de réponse

**Métriques attendues :**
- Latence de clic : < 100ms
- Latence de hover : < 50ms
- Pas de freeze lors des interactions

**Points à vérifier :**
- [ ] Les tooltips s'affichent rapidement
- [ ] Les popups s'ouvrent sans latence
- [ ] Pas de freeze lors des interactions multiples

---

## Checklist de test complète

### Configuration initiale
- [ ] Mode test activé
- [ ] Monitoring de performance activé
- [ ] Nombre de marqueurs configuré (1000 par défaut)
- [ ] Navigateur : Chrome (pour la mesure de mémoire)

### Tests de base
- [ ] Test 1 : Marqueurs simples
- [ ] Test 2 : Avec clustering
- [ ] Test 3 : Avec spiderfying
- [ ] Test 4 : Zoom/dézoom progressif
- [ ] Test 5 : Pan (déplacement)
- [ ] Test 6 : Chargement progressif
- [ ] Test 7 : Interactions (clic, hover)

### Vérifications générales
- [ ] Pas de freeze ou de saccades
- [ ] FPS > 30 dans tous les scénarios
- [ ] Mémoire stable (pas de fuite)
- [ ] Rendu correct de tous les marqueurs
- [ ] Couleurs et icônes correctes selon les niveaux de qualité

---

## Analyse des résultats

### Interprétation des métriques

**FPS < 30 :**
- Problème de performance majeur
- Actions recommandées :
- Activer le clustering
- Réduire le nombre de marqueurs visibles
- Optimiser le rendu des icônes
- Utiliser le virtual scrolling

**Frame Time > 33ms :**
- Chaque frame prend trop de temps
- Actions recommandées :
- Optimiser les calculs de position
- Réduire les re-renders
- Utiliser React.memo pour les composants

**Memory > 500MB :**
- Utilisation mémoire élevée
- Actions recommandées :
- Vérifier les fuites mémoire
- Nettoyer les références non utilisées
- Limiter le nombre de marqueurs en mémoire

**Render Time > 200ms :**
- Rendu initial trop lent
- Actions recommandées :
- Lazy loading des marqueurs
- Rendu progressif
- Optimisation des images PNG

---

## Optimisations possibles

### Si les performances sont insuffisantes :

1. **Clustering obligatoire**
- Forcer l'activation du clustering au-delà de 500 marqueurs
- Ajuster le `maxClusterRadius` selon le zoom

2. **Lazy loading**
- Charger uniquement les marqueurs visibles dans le viewport
- Utiliser `react-window` ou `react-virtualized`

3. **Optimisation des icônes**
- Utiliser des sprites au lieu de PNG individuels
- Réduire la taille des images
- Utiliser des icônes SVG au lieu de PNG

4. **Debouncing**
- Debouncer les mises à jour lors du zoom/pan
- Limiter les re-renders

5. **Memoization**
- Utiliser `React.memo` pour les composants de marqueurs
- Utiliser `useMemo` pour les calculs coûteux

---

## Template de rapport de test

```markdown
# Rapport de test - [Date]

## Configuration
- Navigateur : [Chrome/Firefox/Safari]
- Version : [Version]
- OS : [Windows/Mac/Linux]
- Nombre de marqueurs : [Nombre]

## Résultats

### Test 1 : Marqueurs simples
- Temps de rendu : [X]ms
- FPS moyen : [X]
- Statut : OK / Attention / Non

### Test 2 : Avec clustering
- Temps de création clusters : [X]ms
- FPS moyen : [X]
- Statut : OK / Attention / Non

[... autres tests ...]

## Problèmes identifiés
- [Description des problèmes]

## Recommandations
- [Recommandations d'optimisation]
```

---

## Objectifs de performance

### Objectifs minimums (à atteindre)
- 1000 marqueurs : FPS > 30, Temps rendu < 150ms
- 2000 marqueurs : FPS > 30, Temps rendu < 300ms (avec clustering)
- Interactions : Latence < 100ms

### Objectifs optimaux (à viser)
- 1000 marqueurs : FPS > 50, Temps rendu < 100ms
- 2000 marqueurs : FPS > 40, Temps rendu < 200ms (avec clustering)
- Interactions : Latence < 50ms

---

## Ressources

- [Documentation Leaflet Performance](https://leafletjs.com/examples/zoom-levels/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

---

**Dernière mise à jour :** 16 février 2026
**Version de l'application :** 0.0.0 (voir `package.json`)
**Note :** Le mode test n'est pas encore implémenté et les tests décrits n'ont pas encore été réalisés ; ce document constitue une spécification et un guide pour une future campagne de tests.






