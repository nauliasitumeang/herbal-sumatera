import { normalizeData, list } from "./data.js";
import { icon } from "./icons.js";
import { createViews } from "./views.js";
import { referencePageSize } from "./discovery.js";

const $ = (selector, root = document) => root.querySelector(selector);
let data, views, currentRegion, currentTribe;
let referenceCategory = "all", referenceKeyword = "";
let referenceLimit = referencePageSize, referenceLayout = "list";
let plantCategory = "all", plantKeyword = "";
let directoryCategory = "all", directoryKeyword = "";

function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $("#toast").classList.remove("visible"), 3200);
}

function closeMenu() {
  const restoreFocus = $("#main-nav").classList.contains("open") && $("#main-nav").contains(document.activeElement);
  $("#main-nav").classList.remove("open");
  $("#menu-toggle").setAttribute("aria-expanded", "false");
  $("#menu-toggle").setAttribute("aria-label", "Buka navigasi");
  $("#menu-toggle").innerHTML = icon("menu");
  if (restoreFocus) $("#menu-toggle").focus({ preventScroll: true });
}

function updatePlants() {
  const ids = currentTribe ? [currentTribe.id] : [...currentRegion.tribes, ...list(currentRegion.relatedTribes)];
  views.plants(ids, plantCategory, plantKeyword);
}
function updateReferences() {
  const openSources = new Set([...document.querySelectorAll("#reference-list details[open]")].map((details) => details.closest("[data-reference-id]").dataset.referenceId));
  const highlighted = $("#reference-list .source-highlight")?.dataset.referenceId;
  views.referenceList(referenceCategory, referenceKeyword, referenceLimit, referenceLayout);
  document.querySelectorAll("#reference-list [data-reference-id]").forEach((card) => {
    if (openSources.has(card.dataset.referenceId)) $("details", card).open = true;
    if (card.dataset.referenceId === highlighted) card.classList.add("source-highlight");
  });
}
function renderReferences(sourceId) {
  if (sourceId) {
    referenceCategory = "all"; referenceKeyword = "";
    const index = data.references.findIndex((ref) => ref.id === sourceId);
    referenceLimit = Math.max(referencePageSize, Math.ceil((index + 1) / referencePageSize) * referencePageSize);
  }
  views.references(referenceCategory, referenceKeyword, referenceLayout);
  updateReferences();
  if (!sourceId) return;
  const element = $(`#ref-${CSS.escape(sourceId)}`);
  if (!element) return;
  $("details", element).open = true;
  element.classList.add("source-highlight");
  requestAnimationFrame(() => {
    if (!element.isConnected) return;
    element.scrollIntoView({ block: "center", behavior: "instant" });
    element.setAttribute("tabindex", "-1");
    element.focus({ preventScroll: true });
  });
}

function route(focus = true) {
  if (!data) return;
  if ($("#map-dialog").open) $("#map-dialog").close();
  // Clear stale route DOM: IDs and search controls belong only to the active route.
  document.querySelectorAll(".page:not(#page-home)").forEach((page) => page.replaceChildren());
  const [type, id, pointId] = location.hash.slice(1).split("/");
  let page = type || "home", title = "Atlas Warisan Herbal";
  if (page === "home") { /* Preserve the home search. */ }
  else if (page === "atlas") { views.atlas(); title = "Atlas Sumatera"; }
  else if (page === "herbs") { views.directory(directoryCategory, directoryKeyword); title = "Direktori Herbal"; }
  else if (page === "about") { views.about(); title = "Tentang & Metodologi"; }
  else if (page === "wilayah") {
    const region = data.regions.find((item) => item.id === id);
    if (region) { currentRegion = region; currentTribe = null; plantCategory = "all"; plantKeyword = ""; views.region(region); updatePlants(); page = "region"; title = region.name; } else page = "not-found";
  } else if (page === "suku") {
    const tribe = data.tribes.find((item) => item.id === id);
    if (tribe) { currentTribe = tribe; plantCategory = "all"; plantKeyword = ""; views.tribe(tribe); updatePlants(); page = "tribe"; title = tribe.name; } else page = "not-found";
  } else if (page === "herbal") {
    const remedy = data.remedies.find((item) => item.id === id);
    if (remedy) { views.plant(remedy); page = "plant"; title = remedy.name; } else page = "not-found";
  } else if (page === "myths") { views.myths(); title = "Mitos vs Fakta"; }
  else if (page === "mitos") {
    const myth = data.myths.find((item) => item.id === id);
    if (myth) { views.myth(myth); page = "myth"; title = myth.title; } else page = "not-found";
  } else if (["sdg3", "sdg4"].includes(page)) {
    const sdg = data.sdgs.find((item) => item.id === page); views.sdg(sdg); title = `SDG ${sdg.number} — ${sdg.title}`;
  } else if (page === "dampak") {
    const sdg = data.sdgs.find((item) => item.id === id), point = sdg?.points.find((item) => item.id === pointId);
    if (point) { views.impact(sdg, point); page = "impact"; title = point.title; } else page = "not-found";
  } else if (page === "references") {
    if (id && !data.references.some((ref) => ref.id === id)) page = "not-found";
    else { renderReferences(id); title = "Sumber & Referensi"; }
  } else page = "not-found";
  if (page === "not-found") { views.notFound(); title = "Catatan tidak ditemukan"; }
  document.querySelectorAll(".page").forEach((element) => { const active = element.id === `page-${page}`; element.hidden = !active; element.classList.toggle("active", active); });
  document.title = `${title} | Racik Sumatera`;
  const navPage = ["region", "plant", "tribe", "atlas"].includes(page) ? "atlas" : page === "myth" ? "myths" : page === "impact" ? id : page;
  document.querySelectorAll(".main-nav a").forEach((item) => { const active = item.hash === `#${navPage}`; item.classList.toggle("active", active); if (active) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current"); });
  closeMenu();
  window.scrollTo({ top: 0, behavior: "instant" });
  if (focus) $("h1", $("#page-" + page))?.focus({ preventScroll: true });
}

function openMap() { if (data) { views.mapDialog(); $("#map-dialog").showModal(); } }
document.addEventListener("click", async (event) => {
  const target = event.target;
  const scrollLink = target.closest("[data-scroll]");
  if (scrollLink && data) {
    event.preventDefault();
    if (scrollLink.hash !== location.hash) { history.pushState(null, "", scrollLink.hash); route(false); }
    requestAnimationFrame(() => {
      const section = document.getElementById(scrollLink.dataset.scroll);
      if (!section) return;
      section.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      section.setAttribute("tabindex", "-1"); section.focus({ preventScroll: true });
    }); return;
  }
  if (target.closest("[data-open-map]") || (target.closest("#hero-map") && !target.closest("a"))) { openMap(); return; }
  if (target.closest("[data-close-map]")) { $("#map-dialog").close(); return; }
  if (!data) return;
  if (target.closest("[data-show-tribes]")) {
    views.tribes(true);
    $("#tribe-grid .tribe-card:nth-child(5) a")?.focus();
    return;
  }
  const directoryFilter = target.closest("[data-directory-filter]");
  if (directoryFilter) { directoryCategory = directoryFilter.dataset.directoryFilter; document.querySelectorAll("[data-directory-filter]").forEach((button) => { button.classList.toggle("active", button === directoryFilter); button.setAttribute("aria-pressed", String(button === directoryFilter)); }); views.directoryList(directoryCategory, directoryKeyword); return; }
  if (target.closest("[data-clear-directory]")) { directoryCategory = "all"; directoryKeyword = ""; views.directory(); $("#directory-search").focus(); return; }
  const layout = target.closest("[data-ref-layout]");
  if (layout) { referenceLayout = layout.dataset.refLayout; document.querySelectorAll("[data-ref-layout]").forEach((button) => { button.classList.toggle("active", button === layout); button.setAttribute("aria-pressed", String(button === layout)); }); updateReferences(); return; }
  if (target.closest("[data-more-refs]")) {
    const previousCount = $("#reference-list").children.length;
    referenceLimit += referencePageSize; updateReferences();
    const heading = $(`#reference-list .journal-card:nth-child(${previousCount + 1}) :is(h2, h3)`);
    heading?.setAttribute("tabindex", "-1"); heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ block: "center", behavior: "instant" });
    return;
  }
  const filter = target.closest("[data-ref-filter]");
  if (filter) { referenceCategory = filter.dataset.refFilter; referenceLimit = referencePageSize; document.querySelectorAll("[data-ref-filter]").forEach((button) => { button.classList.toggle("active", button === filter); button.setAttribute("aria-pressed", String(button === filter)); }); updateReferences(); return; }
  if (target.closest("[data-clear-refs]")) { referenceCategory = "all"; referenceKeyword = ""; referenceLimit = referencePageSize; renderReferences(); $("#reference-search").focus(); return; }
  const plantFilter = target.closest("[data-plant-filter]");
  if (plantFilter) { plantCategory = plantFilter.dataset.plantFilter; document.querySelectorAll("[data-plant-filter]").forEach((button) => { button.classList.toggle("active", button === plantFilter); button.setAttribute("aria-pressed", String(button === plantFilter)); }); updatePlants(); return; }
  if (target.closest("[data-clear-plants]")) { plantCategory = "all"; plantKeyword = ""; $("#plant-search").value = ""; document.querySelectorAll("[data-plant-filter]").forEach((button) => { const active = button.dataset.plantFilter === "all"; button.classList.toggle("active", active); button.setAttribute("aria-pressed", String(active)); }); updatePlants(); $("#plant-search").focus(); return; }
  if (target.closest("[data-clear-tribes]")) { $("#tribe-search").value = ""; views.tribes(); $("#tribe-search").focus(); return; }
  const copy = target.closest("[data-copy-citation], [data-share]");
  if (copy) { const text = copy.hasAttribute("data-share") ? location.href : data.references.find((ref) => ref.id === copy.dataset.copyCitation)?.citation; try { await navigator.clipboard.writeText(text); toast(copy.hasAttribute("data-share") ? "Tautan catatan disalin." : "Sitasi disalin."); } catch { toast("Pilih dan salin teks sitasi atau alamat halaman secara manual."); } }
  // The menu icon is replaced during its button's click handler; use the
  // original event path so that detached icon does not count as an outside click.
  if ($("#main-nav").classList.contains("open") && !event.composedPath().includes($(".site-header"))) closeMenu();
});
document.addEventListener("input", (event) => {
  if (!data) return;
  if (event.target.id === "discovery-search") views.discovery();
  if (event.target.id === "tribe-search") views.tribes();
  if (event.target.id === "directory-search") { directoryKeyword = event.target.value.trim(); views.directoryList(directoryCategory, directoryKeyword); }
  if (event.target.id === "plant-search") { plantKeyword = event.target.value.trim(); updatePlants(); }
  if (event.target.id === "reference-search") { referenceKeyword = event.target.value.trim(); referenceLimit = referencePageSize; updateReferences(); }
});
$("#menu-toggle").addEventListener("click", () => { const open = $("#main-nav").classList.toggle("open"); $("#menu-toggle").setAttribute("aria-expanded", String(open)); $("#menu-toggle").setAttribute("aria-label", open ? "Tutup navigasi" : "Buka navigasi"); $("#menu-toggle").innerHTML = icon(open ? "close" : "menu"); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(); if (event.target.id === "hero-map" && ["Enter", " "].includes(event.key)) { event.preventDefault(); openMap(); } });
$("#map-dialog").addEventListener("click", (event) => { if (event.target !== $("#map-dialog")) return; const rect = event.target.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.target.close(); });
$("#map-dialog").addEventListener("close", () => { if (!$("#map-dialog").open) $("#dialog-atlas").replaceChildren(); });
window.addEventListener("hashchange", () => route());

// Missing images do not silently become an unrelated species or institution.
document.addEventListener("error", (event) => { const image = event.target; if (image.tagName === "IMG") image.classList.add("image-unavailable"); }, true);
async function loadWebsiteData() {
  try {
    const [source, editorial, map, credits] = await Promise.all(["data/suku.json", "data/editorial.json", "data/sumatra-map.json", "assets/references/credits.json"].map(async (url) => { const response = await fetch(url); if (!response.ok) throw new Error(`Gagal memuat ${url}`); return response.json(); }));
    data = normalizeData(source, editorial, credits); views = createViews(data, map);
    $("#loading-status").hidden = true;
    views.home(); route(false); document.documentElement.dataset.ready = "true";
  } catch (error) {
    console.error("Koleksi tidak dapat dimuat:", error);
    $("#loading-status").hidden = false;
    $("#loading-status").innerHTML = '<strong>Koleksi belum dapat dimuat.</strong><span>Periksa koneksi lalu coba lagi. Jika membuka file langsung, gunakan server lokal (npm run dev), bukan file://.</span><button class="button button-outline" id="retry-load">Coba lagi</button>';
    $("#retry-load").addEventListener("click", loadWebsiteData, { once: true });
  }
}
loadWebsiteData();
