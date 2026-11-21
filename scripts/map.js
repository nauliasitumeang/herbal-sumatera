import { escapeHTML as e } from "./data.js";
import { icon } from "./icons.js";

export function mapSVG(mapData, regions, compact = false) {
  const outlines = mapData.features.map((feature) => {
    const region = regions.find((item) => item.codes.includes(feature.code));
    const path = `<path d="${e(feature.path)}" class="map-land ${region ? "map-region" : "map-context"}" ${region ? `data-map-region="${region.id}"` : ""}/>`;
    return region ? `<a href="#wilayah/${region.id}" data-map-region="${region.id}" aria-label="Jelajahi ${e(region.name)}"><title>${e(region.name)}</title>${path}</a>` : path;
  }).join("");
  const markers = regions.map((region, index) => `<a href="#wilayah/${region.id}" class="map-marker" data-map-region="${region.id}" aria-label="${index + 1} — ${e(region.name)} — buka halaman wilayah"><circle cx="${region.marker[0]}" cy="${region.marker[1]}" r="18" class="marker-halo"/><circle cx="${region.marker[0]}" cy="${region.marker[1]}" r="10" class="marker-dot"/><text x="${region.marker[0]}" y="${region.marker[1] + 3.8}" text-anchor="middle">${index + 1}</text></a>`).join("");
  return `<svg class="sumatra-map" viewBox="${e(mapData.viewBox)}" role="group" aria-label="Peta provinsi Sumatera dengan enam wilayah koleksi. Aceh, Lampung, dan Bangka Belitung ditampilkan sebagai konteks, bukan wilayah koleksi."><g>${outlines}</g><g>${markers}</g><text class="sea-label" x="80" y="395" transform="rotate(-35 80 395)">SAMUDRA HINDIA</text><text class="sea-label" x="442" y="160">SELAT MALAKA</text>${compact ? "" : '<text class="map-context-label" x="97" y="95">ACEH</text><text class="map-context-label" x="466" y="520">LAMPUNG</text>'}</svg>`;
}

export function atlasMarkup(mapData, regions, id) {
  return `<div class="atlas-layout" data-atlas="${id}"><div class="atlas-map-panel"><div class="atlas-map-top"><span class="eyebrow">SUMATERA, INDONESIA</span><span class="map-direction" aria-hidden="true">${icon("north")} UTARA</span></div>${mapSVG(mapData, regions)}<div class="map-legend"><span><i class="legend-dot" aria-hidden="true"></i> Wilayah koleksi</span><span><i class="legend-dot muted-dot" aria-hidden="true"></i> Konteks geografis</span></div><p class="map-footnote">Batas provinsi disederhanakan. Penanda menunjukkan enam wilayah editorial atlas.</p></div><div class="atlas-sidebar"><div class="atlas-region-preview" id="${id}-preview" aria-live="polite"></div><nav class="atlas-region-list" aria-label="Enam wilayah koleksi">${regions.map((region, index) => `<a href="#wilayah/${region.id}" data-map-region="${region.id}"><span>${String(index + 1).padStart(2, "0")}</span><strong>${e(region.name)}</strong>${icon("arrow_outward")}</a>`).join("")}</nav></div></div>`;
}

export function bindMap(root, regions, preview) {
  const update = (regionId) => {
    const region = regions.find((item) => item.id === regionId);
    if (!region || root.dataset.previewRegion === regionId) return;
    root.dataset.previewRegion = regionId;
    root.querySelectorAll("[data-map-region]").forEach((item) => item.classList.toggle("is-highlighted", item.dataset.mapRegion === regionId));
    if (preview) {
      const headingTag = preview.id === "dialog-preview" ? "h3" : "h2";
      preview.innerHTML = `<a class="landscape-reveal" href="#wilayah/${region.id}"><img src="${e(region.previewImage || region.image)}" alt="${e(region.previewAlt || region.imageAlt)}"><div><span class="eyebrow">LANSKAP & IDENTITAS</span><${headingTag} class="landscape-title">${e(region.name)}</${headingTag}><p>${e(region.landscape)}</p><span class="text-link">Masuk ke wilayah ${icon("arrow_forward")}</span></div></a>`;
    }
  };
  root.addEventListener("pointerover", (event) => { const item = event.target.closest("[data-map-region]"); if (item) update(item.dataset.mapRegion); });
  root.addEventListener("focusin", (event) => { const item = event.target.closest("[data-map-region]"); if (item) update(item.dataset.mapRegion); });
  update(regions[0].id);
}
