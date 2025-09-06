# Guide de Test - Extension Tab Activity Tracker

## 🚀 Instructions de Test Rapide

### 1. Recharger l'Extension

1. Ouvrez `chrome://extensions/`
2. Trouvez "Tab Activity Tracker"
3. Cliquez sur l'icône de rechargement 🔄

### 2. Tester avec le Bouton Intégré

1. Cliquez sur l'icône de l'extension dans la barre d'outils
2. Cliquez sur "🧪 Test Extension" en bas à droite
3. Vérifiez que vous voyez une alerte "Test terminé!"

### 3. Tester la Navigation

1. Ouvrez plusieurs onglets avec différents sites :

   - YouTube (pour tester les vidéos)
   - Netflix (pour tester le streaming)
   - GitHub (pour tester le code)
   - Un site de news (pour tester le web général)

2. Changez d'onglets plusieurs fois
3. Fermez et rouvrez l'extension
4. Vérifiez que vos onglets apparaissent dans l'historique

### 4. Vérifier les Logs (Optionnel)

1. Ouvrez les outils de développement (F12)
2. Allez dans l'onglet "Console"
3. Vous devriez voir des messages comme :
   ```
   🚀 Initialisation du tracker d'onglets...
   🔄 Onglet activé: 123
   💾 Sauvegarde onglet activé: https://...
   ```

## 🎯 Fonctionnalités à Tester

### ✅ Enregistrement Automatique

- [ ] Les onglets s'enregistrent automatiquement lors de la navigation
- [ ] Les onglets s'enregistrent lors du changement d'onglet actif
- [ ] Les onglets s'enregistrent au démarrage de l'extension

### ✅ Interface Utilisateur

- [ ] Le popup s'ouvre correctement
- [ ] Les onglets enregistrés s'affichent dans la liste
- [ ] Les filtres fonctionnent (Tous, Aujourd'hui, Vidéos, Streaming)
- [ ] La recherche fonctionne
- [ ] Les boutons d'action fonctionnent (actualiser, effacer)

### ✅ Fonctionnalités Avancées

- [ ] Les favicons s'affichent (si activé dans les paramètres)
- [ ] Le groupement par domaine fonctionne (si activé)
- [ ] La suppression d'entrées individuelles fonctionne
- [ ] L'effacement complet fonctionne

### ✅ Persistance

- [ ] Les données persistent après fermeture du navigateur
- [ ] Les données persistent après rechargement de l'extension
- [ ] Seule la dernière URL de chaque onglet est conservée

## 🐛 Dépannage

### Problème : Aucun onglet n'apparaît

**Solutions :**

1. Vérifiez que vous naviguez sur des sites web normaux (pas chrome:// ou about:)
2. Rechargez l'extension
3. Utilisez le bouton "🧪 Test Extension"
4. Vérifiez la console pour les erreurs

### Problème : L'extension ne se charge pas

**Solutions :**

1. Vérifiez les permissions dans `chrome://extensions/`
2. Assurez-vous que l'extension est activée
3. Rechargez l'extension

### Problème : Erreurs dans la console

**Solutions :**

1. Vérifiez que tous les fichiers sont présents
2. Vérifiez la syntaxe du manifest.json
3. Rechargez l'extension

## 📊 Test de Performance

### Test avec Beaucoup d'Onglets

1. Ouvrez 20+ onglets différents
2. Naviguez entre eux
3. Vérifiez que l'extension reste réactive
4. Vérifiez que seules les 100 entrées les plus récentes sont conservées

### Test de Mémoire

1. Laissez l'extension fonctionner pendant plusieurs heures
2. Vérifiez qu'elle ne ralentit pas le navigateur
3. Vérifiez que les données ne s'accumulent pas indéfiniment

## 🎉 Critères de Succès

L'extension fonctionne correctement si :

- ✅ Les onglets s'enregistrent automatiquement
- ✅ L'interface est réactive et intuitive
- ✅ Les filtres et la recherche fonctionnent
- ✅ Les données persistent entre les sessions
- ✅ Aucune erreur dans la console
- ✅ L'extension ne ralentit pas le navigateur

## 📝 Rapport de Test

Après vos tests, notez :

- [ ] Nombre d'onglets testés
- [ ] Sites testés (YouTube, Netflix, etc.)
- [ ] Problèmes rencontrés
- [ ] Fonctionnalités qui ne marchent pas
- [ ] Suggestions d'amélioration

---

**Note :** Si vous rencontrez des problèmes, consultez le fichier `DEBUG.md` pour des instructions de débogage détaillées.
