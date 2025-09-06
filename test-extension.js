/**
 * Script de test pour vérifier le fonctionnement de l'extension
 * À exécuter dans la console de l'extension
 */

// Test 1: Vérifier les permissions
console.log('=== Test des permissions ===');
console.log('chrome.tabs disponible:', typeof chrome.tabs !== 'undefined');
console.log('chrome.storage disponible:', typeof chrome.storage !== 'undefined');

// Test 2: Vérifier le stockage
console.log('\n=== Test du stockage ===');
async function testStorage() {
  try {
    // Écrire une donnée de test
    await chrome.storage.local.set({ test: 'Hello World' });
    console.log('✅ Écriture test réussie');
    
    // Lire la donnée
    const result = await chrome.storage.local.get('test');
    console.log('✅ Lecture test réussie:', result);
    
    // Nettoyer
    await chrome.storage.local.remove('test');
    console.log('✅ Suppression test réussie');
    
  } catch (error) {
    console.error('❌ Erreur de stockage:', error);
  }
}

// Test 3: Vérifier les onglets
console.log('\n=== Test des onglets ===');
async function testTabs() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('✅ Onglets récupérés:', tabs.length);
    if (tabs.length > 0) {
      console.log('Onglet actuel:', tabs[0].url, tabs[0].title);
    }
  } catch (error) {
    console.error('❌ Erreur onglets:', error);
  }
}

// Exécuter les tests
testStorage();
testTabs();

// Test 4: Vérifier les données de l'extension
console.log('\n=== Test des données de l\'extension ===');
async function checkExtensionData() {
  try {
    const result = await chrome.storage.local.get('tabActivityTracker');
    console.log('Données actuelles de l\'extension:', result);
    
    if (result.tabActivityTracker) {
      const count = Object.keys(result.tabActivityTracker).length;
      console.log(`✅ ${count} onglets enregistrés`);
    } else {
      console.log('⚠️ Aucune donnée trouvée - l\'extension n\'a pas encore enregistré d\'onglets');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

checkExtensionData();