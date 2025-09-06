import { getAll, removeTab, clearAll } from "../src/storage.js";

const listEl = document.getElementById("list");
const searchInput = document.getElementById("searchInput");
const clearAllBtn = document.getElementById("clearAllBtn");

let allItems = [];

async function load() {
  const items = await getAll();
  // Sort by last update desc
  items.sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt);
  allItems = items;
  render(items);
}

function render(items) {
  listEl.innerHTML = "";
  const template = document.getElementById("itemTemplate");
  for (const item of items) {
    const node = template.content.cloneNode(true);
    const li = node.querySelector(".item");
    const img = node.querySelector(".favicon");
    const title = node.querySelector(".title");
    const url = node.querySelector(".url");
    const status = node.querySelector(".status");
    const openBtn = node.querySelector(".btn.btn-open");
    const copyBtn = node.querySelector(".btn.btn-copy");
    const deleteBtn = node.querySelector(".btn.btn-delete");

    img.src = item.faviconUrl || "";
    img.width = 16;
    img.height = 16;
    img.referrerPolicy = "no-referrer";
    title.textContent = item.title || "(Sans titre)";
    url.textContent = item.url;
    url.title = item.url;
    status.textContent = item.isClosed ? "Fermé" : "Ouvert";
    status.className = `status ${item.isClosed ? "closed" : "open"}`;

    openBtn.addEventListener("click", () => openUrl(item.url));
    copyBtn.addEventListener("click", () => copyToClipboard(item.url));
    deleteBtn.addEventListener("click", async () => {
      await removeTab(item.tabId);
      allItems = allItems.filter((x) => x.tabId !== item.tabId);
      render(filterByQuery(searchInput.value, allItems));
    });

    li.dataset.tabId = String(item.tabId);
    listEl.appendChild(node);
  }
}

function filterByQuery(query, items) {
  const q = (query || "").trim().toLowerCase();
  if (q.length === 0) return items;
  return items.filter((it) =>
    (it.title || "").toLowerCase().includes(q) || (it.url || "").toLowerCase().includes(q)
  );
}

function onSearchInput() {
  const filtered = filterByQuery(searchInput.value, allItems);
  render(filtered);
}

async function openUrl(url) {
  try {
    await chrome.tabs.create({ url });
    window.close();
  } catch (e) {
    // ignore
  }
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    // ignore
  }
}

clearAllBtn.addEventListener("click", async () => {
  await clearAll();
  allItems = [];
  render([]);
});

searchInput.addEventListener("input", onSearchInput);

load();

