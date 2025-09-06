/**
 * Script popup simplifié sans modules ES6
 * Version de base pour tester le fonctionnement
 */

// Configuration
const STORAGE_KEY = 'tabActivityTracker';

// Éléments DOM
let entryCount, tabList, loadingState, emptyState, refreshBtn, clearBtn;

// Données
let allEntries = [];

// Utilitaires
function formatDate(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInHours = (now - date) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    return diffInMinutes <= 1 ? 'À l\'instant' : `Il y a ${diffInMinutes} min`;
  }
  
  if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    return `Il y a ${hours}h`;
  }
  
  if (diffInHours < 48) {
    return 'Hier';
  }
  
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short'
  });
}

function truncateText(text, maxLength = 40) {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength - 3) + '...';
}

function getSiteName(domain) {
  if (!domain) return 'Site inconnu';
  
  let siteName = domain.replace(/^(www\.|m\.|mobile\.)/i, '');
  const parts = siteName.split('.');
  if (parts.length > 1) {
    siteName = parts[0];
  }
  
  return siteName.charAt(0).toUpperCase() + siteName.slice(1);
}

function getContentIcon(url) {
  if (!url) return '🌐';
  
  const domain = url.toLowerCase();
  
  if (domain.includes('youtube') || domain.includes('youtu.be')) {
    return '🎥';
  }
  if (domain.includes('netflix') || domain.includes('primevideo') || 
      domain.includes('disney') || domain.includes('hulu')) {
    return '📺';
  }
  if (domain.includes('github') || domain.includes('gitlab')) {
    return '💻';
  }
  if (domain.includes('twitter') || domain.includes('facebook') || 
      domain.includes('instagram')) {
    return '👥';
  }
  
  return '🌐';
}

// Chargement des données
async function loadTabHistory() {
  try {
    console.log('📊 Chargement de l\'historique...');
    showLoadingState();
    
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const tabData = result[STORAGE_KEY] || {};
    
    console.log('📊 Données récupérées:', tabData);
    
    // Convertir en tableau et trier
    allEntries = Object.values(tabData)
      .sort((a, b) => b.lastUpdated - a.lastUpdated);
    
    console.log('📊 Entrées triées:', allEntries.length);
    
    hideLoadingState();
    renderTabList();
    updateEntryCount();
    
  } catch (error) {
    console.error('❌ Erreur lors du chargement:', error);
    hideLoadingState();
    showEmptyState();
  }
}

// Affichage
function renderTabList() {
  if (allEntries.length === 0) {
    showEmptyState();
    return;
  }

  hideAllStates();

  const html = allEntries
    .map(entry => renderTabItem(entry))
    .join('');
  
  tabList.innerHTML = html;
  attachEventListeners();
}

function renderTabItem(entry) {
  const timeAgo = formatDate(entry.lastUpdated);
  const truncatedTitle = truncateText(entry.title, 35);
  const truncatedUrl = truncateText(entry.url, 40);
  const siteName = getSiteName(entry.domain);
  const contentIcon = getContentIcon(entry.url);

  return `
    <div class="tab-item" data-url="${entry.url}">
      <div class="tab-favicon">
        ${entry.favIconUrl ? 
          `<img src="${entry.favIconUrl}" alt="${siteName}" onerror="this.style.display='none'">` : 
          `<span class="fallback">${siteName.charAt(0).toUpperCase()}</span>`
        }
        <div class="content-type-badge" title="Type de contenu">
          ${contentIcon}
        </div>
      </div>
      <div class="tab-content">
        <div class="tab-title" title="${entry.title}">${truncatedTitle}</div>
        <div class="tab-url" title="${entry.url}">${truncatedUrl}</div>
      </div>
      <div class="tab-meta">
        <div class="tab-time">${timeAgo}</div>
        <div class="tab-domain">${siteName}</div>
      </div>
    </div>
  `;
}

function attachEventListeners() {
  // Clic sur un onglet pour l'ouvrir
  document.querySelectorAll('.tab-item').forEach(item => {
    item.addEventListener('click', () => {
      openTab(item.dataset.url);
    });
  });
}

async function openTab(url) {
  try {
    await chrome.tabs.create({ url, active: true });
    window.close();
  } catch (error) {
    console.error('❌ Erreur lors de l\'ouverture:', error);
  }
}

function updateEntryCount() {
  const count = allEntries.length;
  entryCount.textContent = `${count} onglet${count > 1 ? 's' : ''}`;
}

// États d'affichage
function showLoadingState() {
  hideAllStates();
  loadingState.style.display = 'flex';
}

function showEmptyState() {
  hideAllStates();
  emptyState.style.display = 'flex';
}

function hideLoadingState() {
  loadingState.style.display = 'none';
}

function hideAllStates() {
  loadingState.style.display = 'none';
  emptyState.style.display = 'none';
}

async function clearAllHistory() {
  if (confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
    try {
      await chrome.storage.local.remove(STORAGE_KEY);
      await loadTabHistory();
      console.log('✅ Historique effacé');
    } catch (error) {
      console.error('❌ Erreur lors de l\'effacement:', error);
    }
  }
}

// Initialisation
function initializeElements() {
  entryCount = document.getElementById('entryCount');
  tabList = document.getElementById('tabList');
  loadingState = document.getElementById('loadingState');
  emptyState = document.getElementById('emptyState');
  refreshBtn = document.getElementById('refreshBtn');
  clearBtn = document.getElementById('clearBtn');
}

function setupEventListeners() {
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadTabHistory);
  }
  
  if (clearBtn) {
    clearBtn.addEventListener('click', clearAllHistory);
  }
}

// Démarrage
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initialisation du popup...');
  
  initializeElements();
  setupEventListeners();
  loadTabHistory();
  
  console.log('✅ Popup initialisé');
});