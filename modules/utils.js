/**
 * Utilitaires pour le formatage et la manipulation des données
 */

export class Utils {
  
  /**
   * Formate une timestamp en date lisible
   * @param {number} timestamp - Timestamp à formater
   * @returns {string} Date formatée
   */
  static formatDate(timestamp) {
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
    
    if (diffInHours < 168) { // 7 jours
      const days = Math.floor(diffInHours / 24);
      return `Il y a ${days} jours`;
    }
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  /**
   * Tronque un texte à une longueur donnée
   * @param {string} text - Texte à tronquer
   * @param {number} maxLength - Longueur maximale
   * @returns {string} Texte tronqué
   */
  static truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Extrait le nom du site depuis un domaine
   * @param {string} domain - Domaine complet
   * @returns {string} Nom du site
   */
  static getSiteName(domain) {
    if (!domain) return 'Site inconnu';
    
    // Supprimer www. et sous-domaines communs
    let siteName = domain.replace(/^(www\.|m\.|mobile\.)/i, '');
    
    // Extraire le nom principal (avant le premier point)
    const parts = siteName.split('.');
    if (parts.length > 1) {
      siteName = parts[0];
    }
    
    // Capitaliser la première lettre
    return siteName.charAt(0).toUpperCase() + siteName.slice(1);
  }

  /**
   * Génère une couleur basée sur le domaine pour une identification visuelle
   * @param {string} domain - Domaine
   * @returns {string} Code couleur HSL
   */
  static getDomainColor(domain) {
    if (!domain) return 'hsl(0, 0%, 70%)';
    
    // Générer un hash simple du domaine
    let hash = 0;
    for (let i = 0; i < domain.length; i++) {
      const char = domain.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en 32-bit integer
    }
    
    // Utiliser le hash pour générer une teinte
    const hue = Math.abs(hash) % 360;
    
    // Saturation et luminosité fixes pour une cohérence visuelle
    return `hsl(${hue}, 70%, 60%)`;
  }

  /**
   * Nettoie et formate une URL pour l'affichage
   * @param {string} url - URL à nettoyer
   * @returns {string} URL nettoyée
   */
  static cleanUrl(url) {
    if (!url) return '';
    
    try {
      const urlObj = new URL(url);
      let cleanedUrl = urlObj.hostname + urlObj.pathname;
      
      // Supprimer les slashes finaux
      cleanedUrl = cleanedUrl.replace(/\/+$/, '');
      
      // Ajouter les paramètres de recherche importants (comme pour YouTube)
      if (urlObj.search && this.hasImportantParams(urlObj)) {
        cleanedUrl += urlObj.search;
      }
      
      return cleanedUrl;
    } catch {
      return url;
    }
  }

  /**
   * Vérifie si une URL a des paramètres importants à conserver
   * @param {URL} urlObj - Objet URL
   * @returns {boolean}
   */
  static hasImportantParams(urlObj) {
    const importantParams = ['v', 'watch', 'q', 'search', 'id'];
    const searchParams = new URLSearchParams(urlObj.search);
    
    return importantParams.some(param => searchParams.has(param));
  }

  /**
   * Détecte le type de contenu basé sur l'URL
   * @param {string} url - URL à analyser
   * @returns {string} Type de contenu
   */
  static getContentType(url) {
    if (!url) return 'web';
    
    const domain = this.extractDomain(url).toLowerCase();
    
    if (domain.includes('youtube') || domain.includes('youtu.be')) {
      return 'video';
    }
    if (domain.includes('netflix') || domain.includes('primevideo') || 
        domain.includes('disney') || domain.includes('hulu')) {
      return 'streaming';
    }
    if (domain.includes('github') || domain.includes('gitlab') || 
        domain.includes('stackoverflow')) {
      return 'code';
    }
    if (domain.includes('twitter') || domain.includes('facebook') || 
        domain.includes('instagram') || domain.includes('linkedin')) {
      return 'social';
    }
    if (domain.includes('amazon') || domain.includes('ebay') || 
        domain.includes('shop')) {
      return 'shopping';
    }
    
    return 'web';
  }

  /**
   * Extrait le domaine d'une URL
   * @param {string} url - URL complète
   * @returns {string} Domaine
   */
  static extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  /**
   * Génère une icône emoji basée sur le type de contenu
   * @param {string} contentType - Type de contenu
   * @returns {string} Emoji correspondant
   */
  static getContentIcon(contentType) {
    const icons = {
      video: '🎥',
      streaming: '📺',
      code: '💻',
      social: '👥',
      shopping: '🛒',
      web: '🌐'
    };
    
    return icons[contentType] || icons.web;
  }

  /**
   * Filtre les entrées basées sur une recherche
   * @param {Array} entries - Liste des entrées
   * @param {string} searchTerm - Terme de recherche
   * @returns {Array} Entrées filtrées
   */
  static filterEntries(entries, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return entries;
    }
    
    const term = searchTerm.toLowerCase().trim();
    
    return entries.filter(entry => {
      return entry.title.toLowerCase().includes(term) ||
             entry.url.toLowerCase().includes(term) ||
             entry.domain.toLowerCase().includes(term);
    });
  }

  /**
   * Groupe les entrées par domaine
   * @param {Array} entries - Liste des entrées
   * @returns {Object} Entrées groupées par domaine
   */
  static groupByDomain(entries) {
    const grouped = {};
    
    entries.forEach(entry => {
      const domain = entry.domain;
      if (!grouped[domain]) {
        grouped[domain] = [];
      }
      grouped[domain].push(entry);
    });
    
    return grouped;
  }

  /**
   * Debounce une fonction
   * @param {Function} func - Fonction à debouncer
   * @param {number} wait - Délai d'attente en ms
   * @returns {Function} Fonction debouncée
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}