/**
 * Script background simplifié pour tester le fonctionnement de base
 * Version sans modules ES6 pour éviter les problèmes de compatibilité
 */

// Configuration
const STORAGE_KEY = 'tabActivityTracker';
const UPDATE_THROTTLE_TIME = 2000;
const MAX_ENTRIES = 100;

// Cache pour le throttling
const lastUpdateTimes = new Map();

// Fonctions utilitaires
function shouldIgnoreUrl(url) {
  const ignoredProtocols = ['chrome:', 'chrome-extension:', 'moz-extension:', 'about:', 'edge:'];
  const ignoredUrls = ['newtab', 'blank'];
  
  return ignoredProtocols.some(protocol => url.startsWith(protocol)) ||
         ignoredUrls.some(ignored => url.includes(ignored)) ||
         url.length < 5;
}

function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return 'Domaine inconnu';
  }
}

function extractTitleFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname + urlObj.pathname;
  } catch {
    return url.substring(0, 50) + '...';
  }
}

function shouldThrottleUpdate(tabId) {
  const lastUpdate = lastUpdateTimes.get(tabId);
  if (!lastUpdate) return false;
  
  return (Date.now() - lastUpdate) < UPDATE_THROTTLE_TIME;
}

// Fonction principale de sauvegarde
async function saveTabActivity(tabId, url, title, favIconUrl = null) {
  try {
    console.log('📝 Tentative de sauvegarde:', { tabId, url, title });
    
    // Ignorer les URLs système
    if (shouldIgnoreUrl(url)) {
      console.log('⏭️ URL ignorée:', url);
      return;
    }

    // Récupérer les données existantes
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const tabData = result[STORAGE_KEY] || {};
    
    const timestamp = Date.now();
    const tabKey = `tab_${tabId}`;
    
    // Créer ou mettre à jour l'entrée
    tabData[tabKey] = {
      tabId,
      url,
      title: title || extractTitleFromUrl(url),
      favIconUrl,
      lastUpdated: timestamp,
      domain: extractDomain(url)
    };

    console.log('💾 Sauvegarde de l\'onglet:', tabData[tabKey]);

    // Nettoyer les anciennes entrées si nécessaire
    const entries = Object.entries(tabData);
    if (entries.length > MAX_ENTRIES) {
      const sortedEntries = entries.sort((a, b) => b[1].lastUpdated - a[1].lastUpdated);
      const toKeep = sortedEntries.slice(0, MAX_ENTRIES);
      
      const cleanedData = {};
      toKeep.forEach(([key, value]) => {
        cleanedData[key] = value;
      });
      
      await chrome.storage.local.set({ [STORAGE_KEY]: cleanedData });
    } else {
      await chrome.storage.local.set({ [STORAGE_KEY]: tabData });
    }
    
    console.log('✅ Sauvegarde réussie pour l\'onglet:', tabId);
    
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error);
  }
}

// Gestionnaires d'événements
async function handleTabActivated(activeInfo) {
  try {
    console.log('🔄 Onglet activé:', activeInfo.tabId);
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url) {
      await saveTabActivity(tab.id, tab.url, tab.title, tab.favIconUrl);
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'activation d\'onglet:', error);
  }
}

async function handleTabUpdated(tabId, changeInfo, tab) {
  try {
    // Ne sauvegarder que si l'URL ou le titre a changé et que la page est complètement chargée
    if ((changeInfo.url || changeInfo.title) && 
        tab.status === 'complete' && 
        tab.url) {
      
      console.log('🔄 Onglet mis à jour:', tabId, changeInfo);
      
      // Vérifier le throttling
      if (shouldThrottleUpdate(tabId)) {
        console.log('⏸️ Mise à jour throttlée pour l\'onglet:', tabId);
        return;
      }

      await saveTabActivity(tab.id, tab.url, tab.title, tab.favIconUrl);
      lastUpdateTimes.set(tabId, Date.now());
    }
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour d\'onglet:', error);
  }
}

function handleTabRemoved(tabId) {
  try {
    console.log('🗑️ Onglet fermé:', tabId);
    // Nettoyer le cache de throttling
    lastUpdateTimes.delete(tabId);
    
    // Note: On ne supprime pas l'entrée du storage car on veut garder l'historique
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture d\'onglet:', error);
  }
}

async function handleWindowFocusChanged(windowId) {
  try {
    if (windowId !== chrome.windows.WINDOW_ID_NONE) {
      console.log('🔄 Fenêtre focalisée:', windowId);
      const tabs = await chrome.tabs.query({ active: true, windowId: windowId });
      if (tabs.length > 0 && tabs[0].url) {
        await saveTabActivity(tabs[0].id, tabs[0].url, tabs[0].title, tabs[0].favIconUrl);
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors du changement de focus:', error);
  }
}

// Initialisation au démarrage
async function initializeOnStartup() {
  try {
    console.log('🚀 Initialisation de l\'extension...');
    
    // Enregistrer tous les onglets ouverts au démarrage
    const tabs = await chrome.tabs.query({});
    console.log('📊 Onglets trouvés au démarrage:', tabs.length);
    
    for (const tab of tabs) {
      if (tab.url && !shouldIgnoreUrl(tab.url)) {
        await saveTabActivity(tab.id, tab.url, tab.title, tab.favIconUrl);
      }
    }
    
    console.log('✅ Initialisation terminée');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  }
}

// Configuration des écouteurs d'événements
console.log('🔧 Configuration des écouteurs d\'événements...');

chrome.tabs.onActivated.addListener(handleTabActivated);
chrome.tabs.onUpdated.addListener(handleTabUpdated);
chrome.tabs.onRemoved.addListener(handleTabRemoved);
chrome.windows.onFocusChanged.addListener(handleWindowFocusChanged);

// Initialiser au démarrage
initializeOnStartup();

// Gérer l'installation/mise à jour
chrome.runtime.onInstalled.addListener((details) => {
  console.log('🎉 Extension Tab Activity Tracker installée/mise à jour:', details.reason);
  
  // Forcer l'initialisation après installation
  setTimeout(() => {
    initializeOnStartup();
  }, 1000);
});

console.log('✅ Script background chargé et prêt!');