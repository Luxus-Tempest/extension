/**
 * Script de test pour l'extension Tab Activity Tracker
 * À exécuter dans la console du navigateur pour tester l'extension
 */

// Fonction pour tester le storage
async function testStorage() {
  console.log("🧪 Test du storage...");

  try {
    // Récupérer les données stockées
    const result = await chrome.storage.local.get("tabActivityTracker");
    console.log("📦 Données dans le storage:", result);

    if (result.tabActivityTracker) {
      const entries = Object.values(result.tabActivityTracker);
      console.log(`📊 ${entries.length} entrées trouvées`);

      entries.forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.title} - ${entry.url}`);
      });
    } else {
      console.log("❌ Aucune donnée trouvée dans le storage");
    }
  } catch (error) {
    console.error("❌ Erreur lors du test du storage:", error);
  }
}

// Fonction pour tester les onglets actuels
async function testCurrentTabs() {
  console.log("🧪 Test des onglets actuels...");

  try {
    const tabs = await chrome.tabs.query({});
    console.log(`📋 ${tabs.length} onglets ouverts`);

    tabs.forEach((tab, index) => {
      console.log(`${index + 1}. [${tab.id}] ${tab.title} - ${tab.url}`);
    });
  } catch (error) {
    console.error("❌ Erreur lors du test des onglets:", error);
  }
}

// Fonction pour simuler une sauvegarde
async function testSaveTab() {
  console.log("🧪 Test de sauvegarde d'onglet...");

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      const tab = tabs[0];
      console.log("💾 Sauvegarde de l'onglet actif:", tab.url);

      // Simuler la sauvegarde
      const testData = {
        tabId: tab.id,
        url: tab.url,
        title: tab.title,
        favIconUrl: tab.favIconUrl,
        lastUpdated: Date.now(),
        domain: new URL(tab.url).hostname,
      };

      const storageKey = "tabActivityTracker";
      const result = await chrome.storage.local.get(storageKey);
      const tabData = result[storageKey] || {};

      tabData[`tab_${tab.id}`] = testData;

      await chrome.storage.local.set({ [storageKey]: tabData });
      console.log("✅ Onglet sauvegardé avec succès");
    } else {
      console.log("❌ Aucun onglet actif trouvé");
    }
  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde:", error);
  }
}

// Fonction pour nettoyer le storage
async function clearStorage() {
  console.log("🧹 Nettoyage du storage...");

  try {
    await chrome.storage.local.remove("tabActivityTracker");
    console.log("✅ Storage nettoyé");
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error);
  }
}

// Fonction principale de test
async function runAllTests() {
  console.log("🚀 Début des tests de l'extension Tab Activity Tracker");
  console.log("=".repeat(50));

  await testCurrentTabs();
  console.log("-".repeat(30));

  await testStorage();
  console.log("-".repeat(30));

  await testSaveTab();
  console.log("-".repeat(30));

  await testStorage();
  console.log("=".repeat(50));
  console.log("✅ Tests terminés");
}

// Instructions d'utilisation
console.log(`
🧪 Script de test pour l'extension Tab Activity Tracker

Fonctions disponibles:
- runAllTests() : Exécute tous les tests
- testStorage() : Teste le storage
- testCurrentTabs() : Liste les onglets actuels
- testSaveTab() : Simule une sauvegarde
- clearStorage() : Nettoie le storage

Pour commencer, tapez: runAllTests()
`);

// Exporter les fonctions pour utilisation manuelle
window.testExtension = {
  runAllTests,
  testStorage,
  testCurrentTabs,
  testSaveTab,
  clearStorage,
};
