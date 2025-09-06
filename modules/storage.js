/**
 * Module de gestion du stockage des onglets
 * Utilise l'API Chrome Storage pour persister les données
 */

export class TabStorage {
  constructor() {
    this.storageKey = 'tabActivityTracker';
    this.maxEntries = 100; // Limite pour éviter un stockage excessif
  }

  /**
   * Sauvegarde ou met à jour l'entrée d'un onglet
   * @param {number} tabId - ID de l'onglet
   * @param {string} url - URL de l'onglet
   * @param {string} title - Titre de la page
   * @param {string} favIconUrl - URL du favicon
   */
  async saveTabActivity(tabId, url, title, favIconUrl = null) {
    try {
      // Ignorer les URLs système et internes
      if (this.shouldIgnoreUrl(url)) {
        return;
      }

      const tabData = await this.getTabData();
      const timestamp = Date.now();
      
      // Créer ou mettre à jour l'entrée pour cet onglet
      const tabKey = `tab_${tabId}`;
      tabData[tabKey] = {
        tabId,
        url,
        title: title || this.extractTitleFromUrl(url),
        favIconUrl,
        lastUpdated: timestamp,
        domain: this.extractDomain(url)
      };

      // Nettoyer les anciennes entrées si nécessaire
      await this.cleanupOldEntries(tabData);
      
      await chrome.storage.local.set({ [this.storageKey]: tabData });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  }

  /**
   * Supprime l'entrée d'un onglet fermé
   * @param {number} tabId - ID de l'onglet fermé
   */
  async removeTab(tabId) {
    try {
      const tabData = await this.getTabData();
      const tabKey = `tab_${tabId}`;
      
      if (tabData[tabKey]) {
        delete tabData[tabKey];
        await chrome.storage.local.set({ [this.storageKey]: tabData });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  }

  /**
   * Récupère toutes les activités d'onglets
   * @returns {Object} Données des onglets
   */
  async getTabData() {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      return result[this.storageKey] || {};
    } catch (error) {
      console.error('Erreur lors de la récupération:', error);
      return {};
    }
  }

  /**
   * Récupère les activités d'onglets triées par date
   * @returns {Array} Liste des activités triées
   */
  async getSortedTabActivities() {
    const tabData = await this.getTabData();
    return Object.values(tabData)
      .sort((a, b) => b.lastUpdated - a.lastUpdated);
  }

  /**
   * Supprime une entrée spécifique
   * @param {string} tabKey - Clé de l'onglet à supprimer
   */
  async deleteEntry(tabKey) {
    try {
      const tabData = await this.getTabData();
      if (tabData[tabKey]) {
        delete tabData[tabKey];
        await chrome.storage.local.set({ [this.storageKey]: tabData });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'entrée:', error);
    }
  }

  /**
   * Efface tout l'historique
   */
  async clearAllData() {
    try {
      await chrome.storage.local.remove(this.storageKey);
    } catch (error) {
      console.error('Erreur lors de l\'effacement:', error);
    }
  }

  /**
   * Vérifie si une URL doit être ignorée
   * @param {string} url - URL à vérifier
   * @returns {boolean}
   */
  shouldIgnoreUrl(url) {
    const ignoredProtocols = ['chrome:', 'chrome-extension:', 'moz-extension:', 'about:', 'edge:'];
    const ignoredUrls = ['newtab', 'blank'];
    
    return ignoredProtocols.some(protocol => url.startsWith(protocol)) ||
           ignoredUrls.some(ignored => url.includes(ignored)) ||
           url.length < 5;
  }

  /**
   * Extrait le domaine d'une URL
   * @param {string} url - URL complète
   * @returns {string} Domaine extrait
   */
  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return 'Domaine inconnu';
    }
  }

  /**
   * Extrait un titre basique depuis l'URL
   * @param {string} url - URL
   * @returns {string} Titre généré
   */
  extractTitleFromUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname;
    } catch {
      return url.substring(0, 50) + '...';
    }
  }

  /**
   * Nettoie les anciennes entrées pour éviter un stockage excessif
   * @param {Object} tabData - Données actuelles des onglets
   */
  async cleanupOldEntries(tabData) {
    const entries = Object.entries(tabData);
    if (entries.length > this.maxEntries) {
      // Trier par date et garder seulement les plus récentes
      const sortedEntries = entries.sort((a, b) => b[1].lastUpdated - a[1].lastUpdated);
      const toKeep = sortedEntries.slice(0, this.maxEntries);
      
      // Reconstruire l'objet avec seulement les entrées à garder
      const cleanedData = {};
      toKeep.forEach(([key, value]) => {
        cleanedData[key] = value;
      });
      
      await chrome.storage.local.set({ [this.storageKey]: cleanedData });
    }
  }
}