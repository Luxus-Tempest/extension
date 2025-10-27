const STORAGE_KEY = "tabActivityIndex";

/**
 * Load the entire tab activity index from chrome.storage.local.
 * @returns {Promise<Record<string, any>>}
 */
export async function loadIndex() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const index = result[STORAGE_KEY] || {};
  if (typeof index !== "object" || Array.isArray(index)) {
    return {};
  }
  return index;
}

/**
 * Persist the entire tab activity index to chrome.storage.local.
 * @param {Record<string, any>} index
 * @returns {Promise<void>}
 */
export async function saveIndex(index) {
  await chrome.storage.local.set({ [STORAGE_KEY]: index });
}

/**
 * Insert or update a tab record.
 * @param {object} record
 * @param {number} record.tabId
 * @param {number} record.windowId
 * @param {string} record.url
 * @param {string} record.title
 * @param {string} record.faviconUrl
 * @param {number} record.lastUpdatedAt
 * @param {boolean} record.isClosed
 */
export async function upsertTab(record) {
  const index = await loadIndex();
  const key = String(record.tabId);
  const existing = index[key] || {};
  const merged = {
    ...existing,
    ...record
  };
  index[key] = sanitizeRecord(merged);
  await saveIndex(index);
}

/**
 * Mark a tab as closed.
 * @param {number} tabId
 */
export async function markClosed(tabId) {
  const index = await loadIndex();
  const key = String(tabId);
  if (!index[key]) {
    return;
  }
  index[key].isClosed = true;
  index[key].lastUpdatedAt = Date.now();
  await saveIndex(index);
}

/**
 * Remove a tab from the index.
 * @param {number} tabId
 */
export async function removeTab(tabId) {
  const index = await loadIndex();
  delete index[String(tabId)];
  await saveIndex(index);
}

/**
 * Clear the entire index.
 */
export async function clearAll() {
  await saveIndex({});
}

/**
 * Get all tab records as an array.
 * @returns {Promise<Array<any>>}
 */
export async function getAll() {
  const index = await loadIndex();
  return Object.values(index);
}

/**
 * Update a tab's window id (e.g., on attach/detach).
 * @param {number} tabId
 * @param {number} windowId
 */
export async function updateWindow(tabId, windowId) {
  const index = await loadIndex();
  const key = String(tabId);
  const existing = index[key];
  if (!existing) {
    return;
  }
  index[key] = sanitizeRecord({ ...existing, windowId, lastUpdatedAt: Date.now() });
  await saveIndex(index);
}

/**
 * Ensure record fields are valid and trimmed.
 * @param {any} record
 */
function sanitizeRecord(record) {
  const safeUrl = typeof record.url === "string" ? record.url : "";
  const safeTitle = typeof record.title === "string" && record.title.trim().length > 0
    ? record.title.trim()
    : deriveTitleFromUrl(safeUrl);
  const safeFavicon = typeof record.faviconUrl === "string" && record.faviconUrl.trim().length > 0
    ? record.faviconUrl
    : (safeUrl ? `chrome://favicon/${safeUrl}` : "");
  return {
    tabId: Number(record.tabId),
    windowId: Number(record.windowId),
    url: safeUrl,
    title: safeTitle,
    faviconUrl: safeFavicon,
    lastUpdatedAt: typeof record.lastUpdatedAt === "number" ? record.lastUpdatedAt : Date.now(),
    isClosed: Boolean(record.isClosed)
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

