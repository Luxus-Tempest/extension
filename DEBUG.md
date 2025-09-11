# Guide de Débogage - Extension Tab Activity Tracker

## Problème Identifié

L'extension n'enregistre pas les onglets. Voici les corrections apportées et comment tester.

## Corrections Apportées

### 1. Permissions Manquantes

- ✅ Ajouté `host_permissions` dans le manifest.json pour accéder aux URLs
- ✅ Permissions `tabs`, `storage`, `activeTab` déjà présentes

### 2. Logs de Débogage

- ✅ Ajouté des logs détaillés dans `background.js`
- ✅ Ajouté des logs dans `modules/storage.js`
- ✅ Ajouté des logs dans `popup.js`
- ✅ Ajouté un bouton de test dans l'interface

## Comment Tester l'Extension

### Étape 1: Recharger l'Extension

1. Ouvrez `chrome://extensions/`
2. Trouvez "Tab Activity Tracker"
3. Cliquez sur l'icône de rechargement 🔄
4. Ou désactivez/activez l'extension

### Étape 2: Ouvrir la Console de Débogage

1. Cliquez sur l'icône de l'extension dans la barre d'outils
2. Ouvrez les outils de développement (F12)
3. Allez dans l'onglet "Console"

### Étape 3: Tester avec le Bouton de Test

1. Dans le popup de l'extension, cliquez sur "🧪 Test Extension"
2. Vérifiez les logs dans la console
3. Vous devriez voir des messages comme :
   ```
   🧪 [Test] Début du test de l'extension...
   🧪 [Test] Données dans le storage: {...}
   🧪 [Test] Onglets actuels: X
   ```

### Étape 4: Tester la Navigation

1. Naviguez vers différents sites (YouTube, Netflix, etc.)
2. Changez d'onglets
3. Vérifiez les logs dans la console du background script
4. Vous devriez voir :
   ```
   🔄 Onglet activé: 123
   💾 Sauvegarde onglet activé: https://...
   💾 [Storage] Sauvegarde onglet: {...}
   ✅ [Storage] Données sauvegardées dans le storage
   ```

### Étape 5: Vérifier le Stockage

1. Dans la console, tapez :
   ```javascript
   chrome.storage.local.get("tabActivityTracker", (data) => {
     console.log("Données stockées:", data);
   });
   ```

## Messages de Log Attendus

### Au Démarrage de l'Extension

```
🚀 Initialisation du tracker d'onglets...
📋 X onglets trouvés au démarrage
💾 Sauvegarde onglet au démarrage: https://...
✅ Initialisation terminée
```

### Lors de la Navigation

```
🔄 Onglet activé: 123
💾 Sauvegarde onglet activé: https://...
🔄 Onglet mis à jour: 123 {...}
💾 Sauvegarde onglet mis à jour: https://...
```

### Dans le Storage

```
💾 [Storage] Sauvegarde onglet: {...}
📝 [Storage] Entrée créée/mise à jour: {...}
✅ [Storage] Données sauvegardées dans le storage
```

### Dans le Popup

```
🔄 [Popup] Chargement de l'historique...
📖 [Storage] Données récupérées: X entrées
📋 [Popup] Entrées récupérées: X
```

## Problèmes Potentiels et Solutions

### 1. Aucun Log Apparaît

- **Cause**: L'extension n'est pas rechargée
- **Solution**: Rechargez l'extension dans `chrome://extensions/`

### 2. "URL ignorée" dans les Logs

- **Cause**: L'URL est dans la liste des URLs ignorées
- **Solution**: Vérifiez que vous naviguez sur des sites web normaux (http/https)

### 3. Erreurs de Permissions

- **Cause**: Permissions manquantes
- **Solution**: Vérifiez que `host_permissions` est présent dans le manifest

### 4. Storage Vide

- **Cause**: Problème de sauvegarde
- **Solution**: Vérifiez les logs du storage pour les erreurs

## URLs Ignorées par Défaut

L'extension ignore automatiquement :

- `chrome://*`
- `chrome-extension://*`
- `about:*`
- `edge://*`
- URLs contenant "newtab" ou "blank"
- URLs de moins de 5 caractères

## Test Manuel Rapide

1. Ouvrez l'extension
2. Cliquez sur "🧪 Test Extension"
3. Naviguez vers YouTube ou Netflix
4. Changez d'onglets
5. Rechargez l'extension
6. Vérifiez que vos onglets apparaissent dans l'historique

## Support

Si le problème persiste, vérifiez :

1. La console pour les erreurs
2. Les permissions de l'extension
3. Que l'extension est bien activée
4. Les logs de débogage détaillés

