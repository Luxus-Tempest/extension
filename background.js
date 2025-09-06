/**
 * Script background pour surveiller l'activité des onglets
 * Enregistre automatiquement les URLs des onglets actifs
 */

import { TabStorage } from './modules/storage.js';

class TabActivityTracker {
  constructor() {
    this.storage = new TabStorage();
    this.updateThrottleTime = 2000; // Délai minimum entre les mises à jour (2s)
    this.lastUpdateTimes = new Map(); // Cache des dernières mises à jour par onglet
    
    this.initializeListeners();
  }

  /**
   * Initialise tous les écouteurs d'événements
   */
  initializeListeners() {
    // Écouter les changements d'onglet actif
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivated(activeInfo.tabId);
    });

    // Écouter les mises à jour d'onglets (changement d'URL, titre, etc.)
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdated(tabId, changeInfo, tab);
    });

    // Écouter la fermeture d'onglets
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.handleTabRemoved(tabId);
    });

    // Écouter les changements de fenêtre active
    chrome.windows.onFocusChanged.addListener((windowId) => {
      if (windowId !== chrome.windows.WINDOW_ID_NONE) {
        this.handleWindowFocusChanged(windowId);
      }
    });

    // Initialiser au démarrage
    this.initializeOnStartup();
  }

  /**
   * Gère l'activation d'un onglet
   * @param {number} tabId - ID de l'onglet activé
   */
  async handleTabActivated(tabId) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab && tab.url) {
        await this.saveTabActivity(tab);
      }
    } catch (error) {
      console.error('Erreur lors de l\'activation d\'onglet:', error);
    }
  }

  /**
   * Gère les mises à jour d'onglets
   * @param {number} tabId - ID de l'onglet
   * @param {Object} changeInfo - Informations sur les changements
   * @param {Object} tab - Objet onglet complet
   */
  async handleTabUpdated(tabId, changeInfo, tab) {
    try {
      // Ne sauvegarder que si l'URL ou le titre a changé et que la page est complètement chargée
      if ((changeInfo.url || changeInfo.title) && 
          tab.status === 'complete' && 
          tab.url) {
        
        // Vérifier le throttling pour éviter trop de mises à jour
        if (this.shouldThrottleUpdate(tabId)) {
          return;
        }

        await this.saveTabActivity(tab);
        this.lastUpdateTimes.set(tabId, Date.now());
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour d\'onglet:', error);
    }
  }

  /**
   * Gère la fermeture d'onglets
   * @param {number} tabId - ID de l'onglet fermé
   */
  async handleTabRemoved(tabId) {
    try {
      // Nettoyer le cache de throttling
      this.lastUpdateTimes.delete(tabId);
      
      // Note: On ne supprime pas l'entrée du storage car on veut garder l'historique
      // même après fermeture de l'onglet
    } catch (error) {
      console.error('Erreur lors de la fermeture d\'onglet:', error);
    }
  }

  /**
   * Gère le changement de focus de fenêtre
   * @param {number} windowId - ID de la fenêtre
   */
  async handleWindowFocusChanged(windowId) {
    try {
      // Obtenir l'onglet actif de la fenêtre focalisée
      const tabs = await chrome.tabs.query({ active: true, windowId: windowId });
      if (tabs.length > 0 && tabs[0].url) {
        await this.saveTabActivity(tabs[0]);
      }
    } catch (error) {
      console.error('Erreur lors du changement de focus:', error);
    }
  }

  /**
   * Sauvegarde l'activité d'un onglet
   * @param {Object} tab - Objet onglet
   */
  async saveTabActivity(tab) {
    try {
      await this.storage.saveTabActivity(
        tab.id,
        tab.url,
        tab.title,
        tab.favIconUrl
      );
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  }

  /**
   * Vérifie si une mise à jour doit être throttlée
   * @param {number} tabId - ID de l'onglet
   * @returns {boolean}
   */
  shouldThrottleUpdate(tabId) {
    const lastUpdate = this.lastUpdateTimes.get(tabId);
    if (!lastUpdate) return false;
    
    return (Date.now() - lastUpdate) < this.updateThrottleTime;
  }

  /**
   * Initialise le tracker au démarrage de l'extension
   */
  async initializeOnStartup() {
    try {
      // Enregistrer tous les onglets ouverts au démarrage
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.url && !this.storage.shouldIgnoreUrl(tab.url)) {
          await this.saveTabActivity(tab);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
    }
  }
}

// Initialiser le tracker
const tracker = new TabActivityTracker();

// Gérer l'installation/mise à jour de l'extension
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension Tab Activity Tracker installée/mise à jour:', details.reason);
});