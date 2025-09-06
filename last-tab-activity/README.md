# Last Tab Activity (MV3)

Enregistre l'URL la plus récente pour chaque onglet afin de la retrouver rapidement même après fermeture.

## Fonctionnalités
- Dernière URL par onglet (pas de doublons pour un même onglet)
- Indication ouvert/fermé
- Ouverture rapide, copie de l'URL, suppression, nettoyage total
- Recherche par titre/URL
- UI compacte et moderne

## Installation (Développement)
1. Ouvrez `chrome://extensions/`
2. Activez le mode développeur
3. Cliquez sur « Charger l'extension non empaquetée »
4. Sélectionnez le dossier `last-tab-activity`

## Structure
- `manifest.json` — configuration MV3
- `src/background.js` — écoute des événements d'onglets et enregistrement
- `src/storage.js` — module de persistance (chrome.storage.local)
- `popup/` — interface utilisateur (HTML/CSS/JS)

## Notes
- L'extension n'enregistre qu'une seule entrée par onglet (clé = `tabId`). Quand l'URL change, l'entrée est mise à jour.
- À la fermeture d'un onglet, l'entrée est marquée comme « Fermé » pour pouvoir reprendre plus tard.
- Les données sont stockées localement (chrome.storage.local).

## Licence
MIT