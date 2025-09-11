# Notes personnelles - Organisation Projet

**Date :** 2025-01-27  
**Dernière mise à jour :** Mail Romain 19/08/2025

## 🎯 Tâches prioritaires

### 🏝️ **Qualit'air Corse (PRIORITÉ MAXIMALE)**

## Résumé

**Demande Qualit'air Corse :** Créer un sous-domaine `openairmap.qualitaircorse.org` avec personnalisation selon le domaine d'accès :

- **Logo dynamique** : Changer le logo selon le domaine
- **Zoom personnalisé** : Ajuster la carte sur la Corse
- **Variables configurables** : Autres paramètres adaptés à la Corse
- **Redirection intelligente** : Liens internes avec le bon sous-domaine (pas de basculement qualitaircorse → atmosud)
- **Multilingue** : Français, anglais, italien, espagnol (sans complexité excessive)
- **Infrastructure** : Évaluer leur espace OVH pour le déploiement / Ou alors on déploie sur notre serveur ?

**Tâches techniques :**

- [ ] **Config avec ou sans NGINX** - Tests avec gestion des langues
- [ ] **BVN - Référencement** - Préciser une origine pour le référencement / Se Mettre en contact avec BVN pour la Corse
  - [ ] **À valider avec la Corse** - Validation des spécifications
- [ ] **domaine Corse** - `openairmap.qualitaircorse.org` avec personnalisation
- [ ] **Logo dynamique** - Changement selon le domaine d'accès
- [ ] **Zoom personnalisé** - Ajuster la carte sur la Corse
- [ ] **Variables configurables** - Paramètres spécifiques par domaine / Se mettre en contact avec la Corse pour les paramètres
- [ ] **Redirection intelligente** - Liens internes avec sous-domaine correct ( .qualitaircorse.org si on est sur l'instance Corse / .atmosud.org si on est sur l'instance AtmoSud )
- [ ] **Multilingue** - FR, EN, IT, ES sans complexité excessive
- [ ] **Évaluation infrastructure OVH** - Analyse de leur espace pour déploiement

### ⚡ **Performance & Tests**

- [ ] **Tester 1000 marqueurs** - Performance, clustering et spider avec beaucoup de données
- [ ] **Autorefresh off par défaut** - Désactiver l'auto-refresh par défaut
- [ ] **UTC / Locale** - Gestion des fuseaux horaires + afficher à l'utilisateur dans l'appli

### 🔧 **Sources de données à implémenter**

- [ ] **PurpleAir** - Intégration des capteurs PurpleAir
  - [ ] Service vide (planifié)
  - [ ] API à intégrer
- [ ] **Sensor.Community** - Intégration des capteurs communautaires
  - [ ] Service vide (planifié)
  - [ ] API à intégrer

### 📊 **Fonctionnalités avancées**

- [ ] **Panel statistique** - Statistiques des appareils affichés sur la carte
- [ ] **Export de données** - Export CSV/JSON/PNG/PDF des données affichées
- [ ] **Filtres avancés** - Filtrage par qualité de l'air, distance, etc.
- [ ] **Comparaison de sources** - Analyse comparative entre différents appareils de mesure dans un même panel
- [ ] **Possibilité de remontée dans le temps** - Voir les épisodes de pollution passés sur la carte

### 🗺️ **Cartographie & Interface**

- [ ] **Fond ortho Géoportail** - Intégrer le fond de plan ortho (cf. Mathazoom)
- [ ] **Revoir design avec Baptiste** - Icônes et interface générale

### 🔄 **Versions & Évolutions**

- [ ] **V1 intercompo → V2 curseur** - Pouvoir remonter à X années dans l'historique

### 🔗 **Infrastructure & Déploiement**

- [ ] **Comment se brancher et backups** - Procédures de connexion et sauvegarde AirCarto
- [ ] **CIGALE** - Tickets, Rdv, Calendrier (intégration des fonctionnalités)

### 📚 **Documentation (PRIORITÉ BASSE)**

- [ ] **Documenter installation dans le README** - Instructions complètes d'installation
- [ ] **Documenter le hook useAirQualityData** - Fonctionnement et utilisation
- [ ] **Documenter le useCallback** - Expliquer que c'est "sioux" (optimisation React)
- [ ] **Documenter le format de l'appli** - Structure des mesures et données
- [ ] **Trouver un outil de doc des classes automatique** - Génération auto de documentation

---

## ✅ **Tâches déjà implémentées (selon README)**

### 🎉 **Fonctionnalités récemment implémentées**

- [x] **Side Panel AtmoMicro** - Graphiques historiques pour les microcapteurs
- [x] **Side Panel NebuleAir** - Visualisation des capteurs communautaires
- [x] **Side Panels MobileAir** - Sélection et visualisation des capteurs mobiles
- [x] **Auto-refresh intelligent** - Rafraîchissement automatique adaptatif
- [x] **Gestion des périodes personnalisées** - Sélecteurs de dates avancés
- [x] **Contrôles de redimensionnement** - Panels normal, plein écran, masqué

### 🏗️ **Architecture de base**

- [x] **Services modulaires** - Chaque source de données a son service
- [x] **Hooks personnalisés** - `useAirQualityData` pour la gestion des données
- [x] **Composants réutilisables** - Menus et contrôles modulaires
- [x] **TypeScript** - Typage complet pour la sécurité
- [x] **Clustering intelligent** - Amélioration de la lisibilité avec de nombreux marqueurs
- [x] **Interface responsive** - Adapté à tous les écrans

---

## 🐛 Bugs à corriger

- [ ] Vérifier les problèmes potentiels de performance avec un grand nombre de marqueurs.
- [ ] Gestion UTC / Locale incorrecte dans certaines situations.
- [ ] Tests de configuration avec NGINX et multilingue.
- [ ] Nebuleair : - Le graphique n'affiche pas de données historiques.

---

## 📋 Tâches futures (non prioritaires)

- [ ] Améliorer la documentation générale du projet.
- [ ] Desactivé le clustering par defaut
- [ ] Préparer une version stable pour la Corse avec toutes les validations nécessaires.
- [ ] Implémenter la fonctionnalité de pouvoir remonter dans le temps sur la carte (remonter plusieurs années).

---

## 📝 Notes techniques

### Architecture actuelle

- **Services modulaires** : Chaque source de données a son service
- **Hooks personnalisés** : `useAirQualityData` pour la gestion des données
- **Composants réutilisables** : Menus et contrôles modulaires
- **TypeScript** : Typage complet pour la sécurité

### Points d'attention

- **Performance** : Tests avec 1000+ marqueurs nécessaires
- **UTC/Locale** : Gestion des fuseaux horaires à améliorer
- **Documentation** : Besoin d'une documentation complète et accessible
- **Déploiement Corse** : Configuration spécifique requise

---

## 🎯 Prochaines étapes recommandées

### 🏝️ **PRIORITÉ MAXIMALE - Qualit'air Corse**

1. **Config NGINX** - Tests avec gestion des langues
2. **BVN Référencement** - Préciser une origine + validation Corse
3. **Domaine unique** - `openairmap.atmofrance.org`

### ⚡ **PRIORITÉ HAUTE - Performance & Tests**

4. **Tests 1000 marqueurs** - Performance, clustering et spider
5. **Autorefresh off par défaut** - Configuration par défaut
6. **UTC/Locale** - Gestion des fuseaux horaires + affichage utilisateur

### 🔧 **PRIORITÉ MOYENNE - Fonctionnalités**

7. **Sources manquantes** - PurpleAir et Sensor.Community
8. **Export de données** - CSV/JSON/PNG/PDF
9. **Panel statistique** - Statistiques des appareils
10. **Fond Géoportail** - Intégration du fond ortho

### 🎨 **PRIORITÉ BASSE - Améliorations**

11. **Design review** - Session avec Baptiste pour l'interface
12. **Filtres avancés** - Filtrage par qualité, distance
13. **Comparaison de sources** - Analyse comparative
14. **V1 → V2 curseur** - Remontée dans le temps

### 📚 **PRIORITÉ TRÈS BASSE - Documentation**

15. **Documentation** - Installation, hooks, format appli, useCallback
