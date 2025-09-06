# Tab Activity Tracker

Une extension de navigateur moderne qui enregistre automatiquement la dernière URL de chaque onglet, même après fermeture. Parfaite pour retrouver facilement où vous en étiez dans vos séries, vidéos, ou toute autre navigation.

## ✨ Fonctionnalités

- **Enregistrement automatique** : Sauvegarde la dernière URL de chaque onglet en temps réel
- **Persistance** : Les données sont conservées même après fermeture des onglets
- **Interface moderne** : Design élégant avec animations fluides
- **Recherche avancée** : Trouvez rapidement vos onglets par titre, URL ou domaine
- **Filtres intelligents** : Filtrez par date, type de contenu (vidéos, streaming, etc.)
- **Détection de contenu** : Reconnaissance automatique des plateformes de streaming, vidéos, etc.
- **Gestion des paramètres** : Personnalisez l'affichage et le comportement
- **Accès rapide** : Interface popup accessible d'un clic

## 🎯 Cas d'usage parfaits

- **Séries et films** : Retrouvez facilement l'épisode où vous vous êtes arrêté
- **Recherche et documentation** : Gardez une trace de vos recherches importantes
- **Travail et productivité** : Historique de vos onglets de travail
- **Apprentissage** : Suivi de vos cours et tutoriels en ligne

## 🚀 Installation

### Pour Chrome/Chromium

1. Téléchargez ou clonez ce repository
2. Ouvrez Chrome et allez dans `chrome://extensions/`
3. Activez le "Mode développeur" en haut à droite
4. Cliquez sur "Charger l'extension non empaquetée"
5. Sélectionnez le dossier de l'extension
6. L'extension est maintenant installée et active !

### Pour Firefox (avec adaptations mineures)

Les fichiers sont compatibles avec Firefox moyennant quelques ajustements du manifest.

## 📁 Structure du projet

```
tab-activity-tracker/
├── manifest.json           # Configuration de l'extension
├── background.js           # Script de surveillance des onglets
├── popup.html             # Interface utilisateur
├── popup.js               # Logique de l'interface
├── modules/
│   ├── storage.js         # Gestion du stockage des données
│   └── utils.js           # Utilitaires et helpers
├── styles/
│   └── popup.css          # Styles modernes avec animations
├── icons/
│   ├── icon16.png         # Icônes de l'extension
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # Documentation
```

## 🛠️ Architecture technique

### Modules principaux

- **Background Script** (`background.js`) : Surveille l'activité des onglets
- **Storage Module** (`modules/storage.js`) : Gère la persistance des données
- **Utils Module** (`modules/utils.js`) : Fonctions utilitaires
- **Popup Interface** (`popup.js` + `popup.html`) : Interface utilisateur

### Bonnes pratiques implémentées

- **Architecture modulaire** : Code organisé en modules réutilisables
- **Gestion d'erreurs** : Try-catch complets avec logging
- **Performance** : Throttling des mises à jour, debouncing de la recherche
- **UX/UI moderne** : Animations CSS, états de chargement, feedback visuel
- **Accessibilité** : Support clavier, focus visible, ARIA labels
- **Responsive** : Interface adaptée aux différentes tailles

### Fonctionnalités avancées

- **Détection intelligente** : Ignore les URLs système et temporaires
- **Nettoyage automatique** : Limite le nombre d'entrées pour optimiser l'espace
- **Groupement par domaine** : Organisation visuelle par site web
- **Filtrage par contenu** : Reconnaissance des types de contenu (vidéo, streaming, etc.)
- **Recherche en temps réel** : Filtrage instantané avec debouncing

## 🎨 Design et UX

- **Palette de couleurs moderne** : Utilisation de CSS custom properties
- **Animations fluides** : Transitions et micro-interactions
- **États visuels** : Loading, vide, erreur
- **Feedback utilisateur** : Confirmations, tooltips, états hover
- **Thème adaptatif** : Support du mode sombre (prefers-color-scheme)

## ⚙️ Configuration

L'extension propose plusieurs paramètres configurables :

- **Nettoyage automatique** : Limitation du nombre d'entrées
- **Affichage des favicons** : Icônes des sites web
- **Groupement par domaine** : Organisation des entrées

## 🔒 Permissions

L'extension demande uniquement les permissions nécessaires :

- `tabs` : Pour surveiller l'activité des onglets
- `storage` : Pour sauvegarder les données localement
- `activeTab` : Pour accéder aux informations de l'onglet actif

## 🐛 Dépannage

### L'extension ne se charge pas
- Vérifiez que le mode développeur est activé
- Assurez-vous que tous les fichiers sont présents
- Consultez la console des extensions pour les erreurs

### Les données ne sont pas sauvegardées
- Vérifiez les permissions de stockage
- Consultez les logs dans la console background

### Interface qui ne s'affiche pas correctement
- Vérifiez que les fichiers CSS sont correctement chargés
- Testez avec un autre navigateur

## 🚀 Développement futur

Fonctionnalités prévues :
- Export/import des données
- Synchronisation cloud
- Raccourcis clavier personnalisables
- Thèmes personnalisés
- Statistiques d'usage
- Intégration avec d'autres outils

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer de nouvelles fonctionnalités
- Améliorer la documentation
- Soumettre des pull requests

## 📞 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Consultez la documentation
- Vérifiez les logs de l'extension

---

**Tab Activity Tracker** - Gardez une trace de votre navigation web avec style ! 🕒✨