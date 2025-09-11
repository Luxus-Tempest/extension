/**
 * Script background standalone pour surveiller l'activité des onglets
 * Version sans imports ES6 pour compatibilité avec les service workers
 */

// Classe TabStorage intégrée
class TabStorage {
  constructor() {
    this.storageKey = "tabActivityTracker";
    this.maxEntries = 100; // Limite pour éviter un stockage excessif
  }

  /**
   * Sauvegarde ou met à jour l'entrée d'un onglet
   */
  async saveTabActivity(tabId, url, title, favIconUrl = null) {
    try {
      console.log("💾 [Storage] Sauvegarde onglet:", { tabId, url, title });

      // Ignorer les URLs système et internes
      if (this.shouldIgnoreUrl(url)) {
        console.log("⏭️ [Storage] URL ignorée:", url);
        return;
      }

      const tabData = await this.getTabData();
      const timestamp = Date.now();

      // Créer ou mettre à jour l'entrée pour cet onglet
      const tabKey = `tab_${tabId}`;
      const entry = {
        tabId,
        url,
        title: title || this.extractTitleFromUrl(url),
        favIconUrl,
        lastUpdated: timestamp,
        domain: this.extractDomain(url),
      };

      tabData[tabKey] = entry;
      console.log("📝 [Storage] Entrée créée/mise à jour:", entry);

      // Nettoyer les anciennes entrées si nécessaire
      await this.cleanupOldEntries(tabData);

      await chrome.storage.local.set({ [this.storageKey]: tabData });
      console.log("✅ [Storage] Données sauvegardées dans le storage");
    } catch (error) {
      console.error("❌ [Storage] Erreur lors de la sauvegarde:", error);
    }
  }

  /**
   * Récupère toutes les activités d'onglets
   */
  async getTabData() {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      const data = result[this.storageKey] || {};
      console.log(
        "📖 [Storage] Données récupérées:",
        Object.keys(data).length,
        "entrées"
      );
      return data;
    } catch (error) {
      console.error("❌ [Storage] Erreur lors de la récupération:", error);
      return {};
    }
  }

  /**
   * Récupère les activités d'onglets triées par date
   */
  async getSortedTabActivities() {
    const tabData = await this.getTabData();
    return Object.values(tabData).sort((a, b) => b.lastUpdated - a.lastUpdated);
  }

  /**
   * Supprime une entrée spécifique
   */
  async deleteEntry(tabKey) {
    try {
      const tabData = await this.getTabData();
      if (tabData[tabKey]) {
        delete tabData[tabKey];
        await chrome.storage.local.set({ [this.storageKey]: tabData });
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'entrée:", error);
    }
  }

  /**
   * Efface tout l'historique
   */
  async clearAllData() {
    try {
      await chrome.storage.local.remove(this.storageKey);
    } catch (error) {
      console.error("Erreur lors de l'effacement:", error);
    }
  }

  /**
   * Vérifie si une URL doit être ignorée
   */
  shouldIgnoreUrl(url) {
    const ignoredProtocols = [
      "chrome:",
      "chrome-extension:",
      "moz-extension:",
      "about:",
      "edge:",
    ];
    const ignoredUrls = ["newtab", "blank"];

    return (
      ignoredProtocols.some((protocol) => url.startsWith(protocol)) ||
      ignoredUrls.some((ignored) => url.includes(ignored)) ||
      url.length < 5
    );
  }

  /**
   * Extrait le domaine d'une URL
   */
  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return "Domaine inconnu";
    }
  }

  /**
   * Extrait un titre basique depuis l'URL
   */
  extractTitleFromUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname;
    } catch {
      return url.substring(0, 50) + "...";
    }
  }

  /**
   * Nettoie les anciennes entrées pour éviter un stockage excessif
   */
  async cleanupOldEntries(tabData) {
    const entries = Object.entries(tabData);
    if (entries.length > this.maxEntries) {
      // Trier par date et garder seulement les plus récentes
      const sortedEntries = entries.sort(
        (a, b) => b[1].lastUpdated - a[1].lastUpdated
      );
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

// Classe principale du tracker
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
    console.log("🔧 Initialisation des listeners...");

    // Écouter les changements d'onglet actif
    chrome.tabs.onActivated.addListener((activeInfo) => {
      console.log("🎯 Event: onActivated", activeInfo);
      this.handleTabActivated(activeInfo.tabId);
    });

    // Écouter les mises à jour d'onglets (changement d'URL, titre, etc.)
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      console.log("🎯 Event: onUpdated", { tabId, changeInfo, tab });
      this.handleTabUpdated(tabId, changeInfo, tab);
    });

    // Écouter la fermeture d'onglets
    chrome.tabs.onRemoved.addListener((tabId) => {
      console.log("🎯 Event: onRemoved", tabId);
      this.handleTabRemoved(tabId);
    });

    // Écouter les changements de fenêtre active
    chrome.windows.onFocusChanged.addListener((windowId) => {
      console.log("🎯 Event: onFocusChanged", windowId);
      if (windowId !== chrome.windows.WINDOW_ID_NONE) {
        this.handleWindowFocusChanged(windowId);
      }
    });

    // Écouter la création d'onglets
    chrome.tabs.onCreated.addListener((tab) => {
      console.log("🎯 Event: onCreated", tab);
      this.handleTabCreated(tab);
    });

    console.log("✅ Listeners initialisés");
    // Initialiser au démarrage
    this.initializeOnStartup();
  }

  /**
   * Gère la création d'un nouvel onglet
   */
  async handleTabCreated(tab) {
    try {
      console.log("🆕 Nouvel onglet créé:", tab.id, tab.url);
      if (tab.url && !this.storage.shouldIgnoreUrl(tab.url)) {
        await this.saveTabActivity(tab);
      }
    } catch (error) {
      console.error("Erreur lors de la création d'onglet:", error);
    }
  }

  /**
   * Gère l'activation d'un onglet
   */
  async handleTabActivated(tabId) {
    try {
      console.log("🔄 Onglet activé:", tabId);
      const tab = await chrome.tabs.get(tabId);
      if (tab && tab.url) {
        console.log("💾 Sauvegarde onglet activé:", tab.url);
        await this.saveTabActivity(tab);
      }
    } catch (error) {
      console.error("Erreur lors de l'activation d'onglet:", error);
    }
  }

  /**
   * Gère les mises à jour d'onglets
   */
  async handleTabUpdated(tabId, changeInfo, tab) {
    try {
      console.log("🔄 Onglet mis à jour:", tabId, changeInfo);

      // Ne sauvegarder que si l'URL ou le titre a changé et que la page est complètement chargée
      if (
        (changeInfo.url || changeInfo.title) &&
        tab.status === "complete" &&
        tab.url
      ) {
        // Vérifier le throttling pour éviter trop de mises à jour
        if (this.shouldThrottleUpdate(tabId)) {
          console.log("⏱️ Mise à jour throttlée pour onglet:", tabId);
          return;
        }

        console.log("💾 Sauvegarde onglet mis à jour:", tab.url);
        await this.saveTabActivity(tab);
        this.lastUpdateTimes.set(tabId, Date.now());
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour d'onglet:", error);
    }
  }

  /**
   * Gère la fermeture d'onglets
   */
  async handleTabRemoved(tabId) {
    try {
      // Nettoyer le cache de throttling
      this.lastUpdateTimes.delete(tabId);

      // Note: On ne supprime pas l'entrée du storage car on veut garder l'historique
      // même après fermeture de l'onglet
    } catch (error) {
      console.error("Erreur lors de la fermeture d'onglet:", error);
    }
  }

  /**
   * Gère le changement de focus de fenêtre
   */
  async handleWindowFocusChanged(windowId) {
    try {
      // Obtenir l'onglet actif de la fenêtre focalisée
      const tabs = await chrome.tabs.query({
        active: true,
        windowId: windowId,
      });
      if (tabs.length > 0 && tabs[0].url) {
        await this.saveTabActivity(tabs[0]);
      }
    } catch (error) {
      console.error("Erreur lors du changement de focus:", error);
    }
  }

  /**
   * Sauvegarde l'activité d'un onglet
   */
  async saveTabActivity(tab) {
    try {
      console.log("💾 Sauvegarde activité onglet:", {
        id: tab.id,
        url: tab.url,
        title: tab.title,
        favIconUrl: tab.favIconUrl,
      });

      await this.storage.saveTabActivity(
        tab.id,
        tab.url,
        tab.title,
        tab.favIconUrl
      );

      console.log("✅ Activité onglet sauvegardée avec succès");
    } catch (error) {
      console.error("❌ Erreur lors de la sauvegarde:", error);
    }
  }

  /**
   * Vérifie si une mise à jour doit être throttlée
   */
  shouldThrottleUpdate(tabId) {
    const lastUpdate = this.lastUpdateTimes.get(tabId);
    if (!lastUpdate) return false;

    return Date.now() - lastUpdate < this.updateThrottleTime;
  }

  /**
   * Initialise le tracker au démarrage de l'extension
   */
  async initializeOnStartup() {
    try {
      console.log("🚀 Initialisation du tracker d'onglets...");

      // Enregistrer tous les onglets ouverts au démarrage
      const tabs = await chrome.tabs.query({});
      console.log(`📋 ${tabs.length} onglets trouvés au démarrage`);

      for (const tab of tabs) {
        if (tab.url && !this.storage.shouldIgnoreUrl(tab.url)) {
          console.log("💾 Sauvegarde onglet au démarrage:", tab.url);
          await this.saveTabActivity(tab);
        } else {
          console.log("⏭️ Onglet ignoré:", tab.url);
        }
      }

      console.log("✅ Initialisation terminée");
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation:", error);
    }
  }
}

// Initialiser le tracker
console.log("🚀 Démarrage du service worker...");
const tracker = new TabActivityTracker();

// Gérer l'installation/mise à jour de l'extension
chrome.runtime.onInstalled.addListener((details) => {
  console.log(
    "Extension Tab Activity Tracker installée/mise à jour:",
    details.reason
  );
});

// Gérer le démarrage du service worker
chrome.runtime.onStartup.addListener(() => {
  console.log("🔄 Service worker redémarré");
});

// Gérer les messages du popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📨 Message reçu:", request);

  if (request.action === "getTabData") {
    tracker.storage.getSortedTabActivities().then((data) => {
      sendResponse({ success: true, data });
    });
    return true; // Indique une réponse asynchrone
  }

  if (request.action === "clearAllData") {
    tracker.storage.clearAllData().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === "deleteEntry") {
    tracker.storage.deleteEntry(request.tabKey).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});

console.log("✅ Service worker initialisé avec succès");

