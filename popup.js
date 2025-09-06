/**
 * Script principal pour l'interface popup
 * Gère l'affichage et les interactions avec l'historique des onglets
 */

import { TabStorage } from "./modules/storage.js";
import { Utils } from "./modules/utils.js";

class TabHistoryPopup {
  constructor() {
    this.storage = new TabStorage();
    this.currentFilter = "all";
    this.currentSearchTerm = "";
    this.allEntries = [];
    this.filteredEntries = [];
    this.settings = {
      autoCleanup: true,
      showFavicons: true,
      groupByDomain: false,
    };

    this.initializeElements();
    this.setupEventListeners();
    this.loadSettings();
    this.loadTabHistory();

    // Ajouter un bouton de test pour le débogage
    this.addTestButton();
  }

  /**
   * Initialise les références aux éléments DOM
   */
  initializeElements() {
    // Éléments principaux
    this.entryCount = document.getElementById("entryCount");
    this.searchInput = document.getElementById("searchInput");
    this.searchClear = document.getElementById("searchClear");
    this.tabList = document.getElementById("tabList");
    this.lastUpdate = document.getElementById("lastUpdate");

    // États
    this.loadingState = document.getElementById("loadingState");
    this.emptyState = document.getElementById("emptyState");
    this.emptySearchState = document.getElementById("emptySearchState");

    // Boutons d'action
    this.refreshBtn = document.getElementById("refreshBtn");
    this.clearBtn = document.getElementById("clearBtn");
    this.settingsBtn = document.getElementById("settingsBtn");

    // Filtres
    this.filterTabs = document.querySelectorAll(".filter-tab");

    // Modales
    this.confirmModal = document.getElementById("confirmModal");
    this.settingsModal = document.getElementById("settingsModal");
    this.modalTitle = document.getElementById("modalTitle");
    this.modalMessage = document.getElementById("modalMessage");
    this.modalConfirm = document.getElementById("modalConfirm");
    this.modalCancel = document.getElementById("modalCancel");
    this.modalClose = document.getElementById("modalClose");
    this.settingsModalClose = document.getElementById("settingsModalClose");

    // Paramètres
    this.autoCleanupCheckbox = document.getElementById("autoCleanup");
    this.showFaviconsCheckbox = document.getElementById("showFavicons");
    this.groupByDomainCheckbox = document.getElementById("groupByDomain");
    this.saveSettingsBtn = document.getElementById("saveSettings");
  }

  /**
   * Configure tous les écouteurs d'événements
   */
  setupEventListeners() {
    // Recherche
    this.searchInput.addEventListener(
      "input",
      Utils.debounce((e) => this.handleSearch(e.target.value), 300)
    );
    this.searchClear.addEventListener("click", () => this.clearSearch());

    // Filtres
    this.filterTabs.forEach((tab) => {
      tab.addEventListener("click", () =>
        this.handleFilterChange(tab.dataset.filter)
      );
    });

    // Actions principales
    this.refreshBtn.addEventListener("click", () => this.loadTabHistory());
    this.clearBtn.addEventListener("click", () =>
      this.showConfirmModal(
        "Effacer tout l'historique",
        "Cette action supprimera définitivement tout l'historique des onglets. Cette action ne peut pas être annulée.",
        () => this.clearAllHistory()
      )
    );
    this.settingsBtn.addEventListener("click", () => this.showSettingsModal());

    // Modales
    this.modalCancel.addEventListener("click", () => this.hideConfirmModal());
    this.modalClose.addEventListener("click", () => this.hideConfirmModal());
    this.settingsModalClose.addEventListener("click", () =>
      this.hideSettingsModal()
    );
    this.saveSettingsBtn.addEventListener("click", () => this.saveSettings());

    // Fermeture des modales en cliquant sur l'overlay
    this.confirmModal.addEventListener("click", (e) => {
      if (e.target === this.confirmModal) this.hideConfirmModal();
    });
    this.settingsModal.addEventListener("click", (e) => {
      if (e.target === this.settingsModal) this.hideSettingsModal();
    });

    // Raccourcis clavier
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.hideConfirmModal();
        this.hideSettingsModal();
      }
      if (e.key === "/" || (e.ctrlKey && e.key === "f")) {
        e.preventDefault();
        this.searchInput.focus();
      }
    });
  }

  /**
   * Charge les paramètres depuis le stockage
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.local.get("tabHistorySettings");
      if (result.tabHistorySettings) {
        this.settings = { ...this.settings, ...result.tabHistorySettings };
      }
      this.updateSettingsUI();
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres:", error);
    }
  }

  /**
   * Met à jour l'interface des paramètres
   */
  updateSettingsUI() {
    this.autoCleanupCheckbox.checked = this.settings.autoCleanup;
    this.showFaviconsCheckbox.checked = this.settings.showFavicons;
    this.groupByDomainCheckbox.checked = this.settings.groupByDomain;
  }

  /**
   * Sauvegarde les paramètres
   */
  async saveSettings() {
    try {
      this.settings.autoCleanup = this.autoCleanupCheckbox.checked;
      this.settings.showFavicons = this.showFaviconsCheckbox.checked;
      this.settings.groupByDomain = this.groupByDomainCheckbox.checked;

      await chrome.storage.local.set({ tabHistorySettings: this.settings });
      this.hideSettingsModal();

      // Recharger l'affichage si nécessaire
      this.renderTabList();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  }

  /**
   * Charge l'historique des onglets
   */
  async loadTabHistory() {
    try {
      console.log("🔄 [Popup] Chargement de l'historique...");
      this.showLoadingState();

      // Essayer d'abord de communiquer avec le service worker
      try {
        const response = await chrome.runtime.sendMessage({
          action: "getTabData",
        });
        if (response && response.success) {
          this.allEntries = response.data;
          console.log(
            "📋 [Popup] Entrées récupérées via service worker:",
            this.allEntries.length
          );
        } else {
          throw new Error("Service worker non disponible");
        }
      } catch (error) {
        console.log(
          "⚠️ [Popup] Service worker non disponible, utilisation du storage local"
        );
        this.allEntries = await this.storage.getSortedTabActivities();
        console.log(
          "📋 [Popup] Entrées récupérées localement:",
          this.allEntries.length
        );
      }

      this.applyFilters();

      this.updateLastUpdateTime();
      this.hideLoadingState();
    } catch (error) {
      console.error("❌ [Popup] Erreur lors du chargement:", error);
      this.hideLoadingState();
      this.showEmptyState();
    }
  }

  /**
   * Applique les filtres actuels
   */
  applyFilters() {
    let filtered = [...this.allEntries];

    // Filtre par terme de recherche
    if (this.currentSearchTerm) {
      filtered = Utils.filterEntries(filtered, this.currentSearchTerm);
    }

    // Filtre par catégorie
    if (this.currentFilter !== "all") {
      filtered = this.applyContentFilter(filtered, this.currentFilter);
    }

    this.filteredEntries = filtered;
    this.renderTabList();
    this.updateEntryCount();
  }

  /**
   * Applique un filtre de contenu
   */
  applyContentFilter(entries, filter) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
      case "today":
        return entries.filter((entry) => new Date(entry.lastUpdated) >= today);
      case "video":
      case "streaming":
        return entries.filter(
          (entry) => Utils.getContentType(entry.url) === filter
        );
      default:
        return entries;
    }
  }

  /**
   * Gère la recherche
   */
  handleSearch(searchTerm) {
    this.currentSearchTerm = searchTerm.trim();
    this.updateSearchUI();
    this.applyFilters();
  }

  /**
   * Met à jour l'interface de recherche
   */
  updateSearchUI() {
    if (this.currentSearchTerm) {
      this.searchClear.classList.add("visible");
    } else {
      this.searchClear.classList.remove("visible");
    }
  }

  /**
   * Efface la recherche
   */
  clearSearch() {
    this.searchInput.value = "";
    this.currentSearchTerm = "";
    this.updateSearchUI();
    this.applyFilters();
  }

  /**
   * Gère le changement de filtre
   */
  handleFilterChange(filter) {
    // Mettre à jour l'état des onglets de filtre
    this.filterTabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.filter === filter);
    });

    this.currentFilter = filter;
    this.applyFilters();
  }

  /**
   * Rend la liste des onglets
   */
  renderTabList() {
    if (this.filteredEntries.length === 0) {
      if (this.currentSearchTerm) {
        this.showEmptySearchState();
      } else {
        this.showEmptyState();
      }
      return;
    }

    this.hideAllStates();

    if (this.settings.groupByDomain) {
      this.renderGroupedTabList();
    } else {
      this.renderFlatTabList();
    }
  }

  /**
   * Rend la liste des onglets groupés par domaine
   */
  renderGroupedTabList() {
    const grouped = Utils.groupByDomain(this.filteredEntries);
    const html = Object.entries(grouped)
      .map(([domain, entries]) => this.renderDomainGroup(domain, entries))
      .join("");

    this.tabList.innerHTML = html;
    this.attachTabEventListeners();
  }

  /**
   * Rend la liste des onglets à plat
   */
  renderFlatTabList() {
    const html = this.filteredEntries
      .map((entry, index) => this.renderTabItem(entry, index))
      .join("");

    this.tabList.innerHTML = html;
    this.attachTabEventListeners();
  }

  /**
   * Rend un groupe de domaine
   */
  renderDomainGroup(domain, entries) {
    const domainName = Utils.getSiteName(domain);
    const domainColor = Utils.getDomainColor(domain);

    return `
      <div class="domain-group">
        <div class="domain-header" style="border-left: 3px solid ${domainColor}">
          <h3>${domainName}</h3>
          <span class="domain-count">${entries.length} onglet${entries.length > 1 ? "s" : ""}</span>
        </div>
        <div class="domain-entries">
          ${entries.map((entry) => this.renderTabItem(entry)).join("")}
        </div>
      </div>
    `;
  }

  /**
   * Rend un élément d'onglet
   */
  renderTabItem(entry, index = 0) {
    const contentType = Utils.getContentType(entry.url);
    const contentIcon = Utils.getContentIcon(contentType);
    const timeAgo = Utils.formatDate(entry.lastUpdated);
    const cleanUrl = Utils.cleanUrl(entry.url);
    const truncatedTitle = Utils.truncateText(entry.title, 40);
    const siteName = Utils.getSiteName(entry.domain);

    return `
      <div class="tab-item" data-tab-key="tab_${entry.tabId}" data-url="${entry.url}" style="animation-delay: ${index * 50}ms">
        <div class="tab-favicon">
          ${
            this.settings.showFavicons && entry.favIconUrl
              ? `<img src="${entry.favIconUrl}" alt="${siteName}" onerror="this.style.display='none'">`
              : `<span class="fallback">${siteName.charAt(0).toUpperCase()}</span>`
          }
          <div class="content-type-badge" title="${contentType}">
            ${contentIcon}
          </div>
        </div>
        <div class="tab-content">
          <div class="tab-title" title="${entry.title}">${truncatedTitle}</div>
          <div class="tab-url" title="${entry.url}">${cleanUrl}</div>
        </div>
        <div class="tab-meta">
          <div class="tab-time">${timeAgo}</div>
          <div class="tab-domain">${siteName}</div>
        </div>
        <div class="tab-actions">
          <button class="tab-delete" data-tab-key="tab_${entry.tabId}" title="Supprimer cette entrée">
            <span class="icon">🗑️</span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Attache les écouteurs d'événements aux éléments d'onglets
   */
  attachTabEventListeners() {
    // Clic sur un onglet pour l'ouvrir
    this.tabList.querySelectorAll(".tab-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (!e.target.closest(".tab-delete")) {
          this.openTab(item.dataset.url);
        }
      });
    });

    // Boutons de suppression
    this.tabList.querySelectorAll(".tab-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const tabKey = btn.dataset.tabKey;
        this.showConfirmModal(
          "Supprimer cette entrée",
          "Êtes-vous sûr de vouloir supprimer cette entrée de l'historique ?",
          () => this.deleteEntry(tabKey)
        );
      });
    });
  }

  /**
   * Ouvre un onglet
   */
  async openTab(url) {
    try {
      await chrome.tabs.create({ url, active: true });
      window.close();
    } catch (error) {
      console.error("Erreur lors de l'ouverture de l'onglet:", error);
    }
  }

  /**
   * Supprime une entrée
   */
  async deleteEntry(tabKey) {
    try {
      await this.storage.deleteEntry(tabKey);
      this.hideConfirmModal();
      await this.loadTabHistory();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  }

  /**
   * Efface tout l'historique
   */
  async clearAllHistory() {
    try {
      await this.storage.clearAllData();
      this.hideConfirmModal();
      await this.loadTabHistory();
    } catch (error) {
      console.error("Erreur lors de l'effacement:", error);
    }
  }

  /**
   * Met à jour le compteur d'entrées
   */
  updateEntryCount() {
    const count = this.filteredEntries.length;
    const total = this.allEntries.length;

    if (this.currentSearchTerm || this.currentFilter !== "all") {
      this.entryCount.textContent = `${count} sur ${total} onglets`;
    } else {
      this.entryCount.textContent = `${count} onglet${count > 1 ? "s" : ""}`;
    }
  }

  /**
   * Met à jour l'heure de dernière mise à jour
   */
  updateLastUpdateTime() {
    this.lastUpdate.textContent = new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Affiche l'état de chargement
   */
  showLoadingState() {
    this.hideAllStates();
    this.loadingState.style.display = "flex";
  }

  /**
   * Affiche l'état vide
   */
  showEmptyState() {
    this.hideAllStates();
    this.emptyState.style.display = "flex";
  }

  /**
   * Affiche l'état de recherche vide
   */
  showEmptySearchState() {
    this.hideAllStates();
    this.emptySearchState.style.display = "flex";
  }

  /**
   * Cache l'état de chargement
   */
  hideLoadingState() {
    this.loadingState.style.display = "none";
  }

  /**
   * Cache tous les états
   */
  hideAllStates() {
    this.loadingState.style.display = "none";
    this.emptyState.style.display = "none";
    this.emptySearchState.style.display = "none";
  }

  /**
   * Affiche la modal de confirmation
   */
  showConfirmModal(title, message, onConfirm) {
    this.modalTitle.textContent = title;
    this.modalMessage.textContent = message;
    this.modalConfirm.onclick = onConfirm;
    this.confirmModal.style.display = "flex";
  }

  /**
   * Cache la modal de confirmation
   */
  hideConfirmModal() {
    this.confirmModal.style.display = "none";
  }

  /**
   * Affiche la modal des paramètres
   */
  showSettingsModal() {
    this.settingsModal.style.display = "flex";
  }

  /**
   * Cache la modal des paramètres
   */
  hideSettingsModal() {
    this.settingsModal.style.display = "none";
  }

  /**
   * Ajoute un bouton de test pour le débogage
   */
  addTestButton() {
    // Créer un bouton de test temporaire
    const testButton = document.createElement("button");
    testButton.textContent = "🧪 Test Extension";
    testButton.className = "btn btn-small";
    testButton.style.marginLeft = "8px";
    testButton.onclick = () => this.testExtension();

    // Ajouter le bouton à côté du bouton paramètres
    const footerActions = document.querySelector(".footer-actions");
    if (footerActions) {
      footerActions.appendChild(testButton);
    }
  }

  /**
   * Teste le fonctionnement de l'extension
   */
  async testExtension() {
    try {
      console.log("🧪 [Test] Début du test de l'extension...");

      // Test 1: Vérifier le storage
      const storageData = await chrome.storage.local.get("tabActivityTracker");
      console.log("🧪 [Test] Données dans le storage:", storageData);

      // Test 2: Vérifier les onglets actuels
      const tabs = await chrome.tabs.query({});
      console.log("🧪 [Test] Onglets actuels:", tabs.length);

      // Test 3: Simuler une sauvegarde
      if (tabs.length > 0) {
        const firstTab = tabs[0];
        console.log("🧪 [Test] Simulation sauvegarde onglet:", firstTab.url);
        await this.storage.saveTabActivity(
          firstTab.id,
          firstTab.url,
          firstTab.title,
          firstTab.favIconUrl
        );
      }

      // Test 4: Recharger les données
      await this.loadTabHistory();

      console.log("🧪 [Test] Test terminé");
      alert("Test terminé! Vérifiez la console pour les détails.");
    } catch (error) {
      console.error("❌ [Test] Erreur lors du test:", error);
      alert("Erreur lors du test: " + error.message);
    }
  }
}

// Initialiser l'application quand le DOM est chargé
document.addEventListener("DOMContentLoaded", () => {
  new TabHistoryPopup();
});
