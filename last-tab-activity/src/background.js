import { upsertTab, markClosed, updateWindow } from "./storage.js";

/**
 * Build a record object from a Tab.
 * @param {chrome.tabs.Tab} tab
 */
function buildRecordFromTab(tab) {
  const url = tab.url || "";
  return {
    tabId: tab.id,
    windowId: tab.windowId,
    url,
    title: tab.title || deriveTitleFromUrl(url),
    faviconUrl: url ? `chrome://favicon/${url}` : "",
    lastUpdatedAt: Date.now(),
    isClosed: false
  };
}

function deriveTitleFromUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch (e) {
    return url || "";
  }
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!tabId || !tab) {
    return;
  }
  const urlChanged = typeof changeInfo.url === "string";
  const isComplete = changeInfo.status === "complete";
  if (!urlChanged && !isComplete) {
    return;
  }
  const record = buildRecordFromTab(tab);
  await upsertTab(record);
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await markClosed(tabId);
});

chrome.tabs.onAttached.addListener(async (tabId, attachInfo) => {
  await updateWindow(tabId, attachInfo.newWindowId);
});

chrome.tabs.onDetached.addListener(async (tabId, detachInfo) => {
  await updateWindow(tabId, detachInfo.oldWindowId);
});

// Record current active tabs at startup (service worker cold start)
async function snapshotOpenTabsOnStartup() {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id != null) {
        const record = buildRecordFromTab(tab);
        await upsertTab(record);
      }
    }
  } catch (e) {
    // no-op
  }
}

snapshotOpenTabsOnStartup();

