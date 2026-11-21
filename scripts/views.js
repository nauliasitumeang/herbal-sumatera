import { escapeHTML as e, list, safeURL } from "./data.js";
import { icon } from "./icons.js";
import { mapSVG, atlasMarkup, bindMap } from "./map.js";
import { findCollection, findReferences, referencePageSize } from "./discovery.js";
import { methodologyContent } from "./methodology.js";

const $ = (selector, root = document) => root.querySelector(selector);
export const scientificLabel = (remedy) => remedy.namaIlmiah || remedy.bentuk;
export const photo = (src, alt, className = "", eager = false) => `<img class="${e(className)}" src="${e(src)}" alt="${e(alt)}" loading="${eager ? "eager" : "lazy"}" decoding="async">`;
export const link = (hash, label, className = "text-link") => `<a class="${e(className)}" href="#${e(hash)}">${e(label)} ${icon("arrow_outward")}</a>`;
const bullets = (value, className = "content-list") => `<ul class="${className}">${list(value).map((item) => `<li>${e(item)}</li>`).join("")}</ul>`;
const heading = (eyebrow, title, description = "") => `<div class="section-heading"><span class="eyebrow">${e(eyebrow)}</span><h2>${e(title)}</h2>${description ? `<p>${e(description)}</p>` : ""}</div>`;
const breadcrumb = (parts) => `<nav class="breadcrumb" aria-label="Jejak navigasi">${link("home", "Beranda", "")}${parts.map(([hash, label]) => `${icon("chevron_right")}${hash ? link(hash, label, "") : `<span aria-current="page">${e(label)}</span>`}`).join("")}</nav>`;
const copyLink = () => `<button class="text-link" data-share>Salin tautan ${icon("content_copy")}</button>`;
const search = (id, label, placeholder, value = "") => `<label class="search-wrapper">${icon("search")}<input id="${id}" type="search" aria-label="${e(label)}" placeholder="${e(placeholder)}" value="${e(value)}"></label>`;
const empty = (title, description, action, label, headingTag = "h3") => `<div class="empty-state"><${headingTag} class="empty-title">${e(title)}</${headingTag}><p>${e(description)}</p><button class="button button-outline" ${action}>${e(label)}</button></div>`;

// The directory and both home searches reuse the detail image, not a new asset.
export function herbEntry(remedy, headingTag = "h2") {
  const botanicalPlate = remedy.id === "temu-putih";
  const illustration = remedy.illustration || /ilustrasi/i.test(remedy.alt);
  return `<li><a class="directory-entry" href="#herbal/${e(remedy.id)}"><figure class="directory-media"><span class="directory-thumbnail ${botanicalPlate ? "botanical-plate" : ""}">${photo(remedy.image, remedy.alt, "directory-image")}</span>${illustration ? `<figcaption class="directory-image-note">${botanicalPlate ? "Ilustrasi botani" : "Ilustrasi"}</figcaption>` : ""}</figure><div class="directory-copy"><span class="directory-category">${e(remedy.type)}</span><${headingTag} class="directory-title">${e(remedy.name)}</${headingTag}><p class="directory-scientific">${e(scientificLabel(remedy))}</p><p class="directory-scope">${e(remedy.scopeLabel || remedy.tribeName)}</p></div>${icon("arrow_outward")}</a></li>`;
}

export function createViews(data, mapData) {
  let homeTribesExpanded = false;
  const sourceLink = (id) => { const ref = data.references.find((item) => item.id === id); return ref ? link(`references/${id}`, `${ref.author} · ${ref.year}`, "source-tag") : ""; };
  const sources = (ids) => `<div class="source-tags">${[...new Set(list(ids))].map(sourceLink).join("")}</div>`;
  const caption = (asset, fallback = "Koleksi visual Racik Sumatera") => {
    const credit = data.photoCredits.find((item) => item.id === asset.credit);
    return `<span>${e(asset.imageCaption || asset.label || fallback)}</span>${credit ? `<a class="photo-credit" href="${e(safeURL(credit.source))}" target="_blank" rel="noopener noreferrer">${e(credit.creator)} · ${e(credit.license)}<span class="sr-only"> (sumber gambar, tab baru)</span></a>` : ""}`;
  };
  const regionCard = (region, index) => `<a class="province-card" href="#wilayah/${region.id}" style="--region-accent:${region.accent}">${photo(region.image, region.imageAlt)}<span class="province-number">${String(index + 1).padStart(2, "0")}</span><div class="province-card-content"><span class="eyebrow">${region.tribes.length ? `${region.tribes.length} KOMUNITAS` : "LINTAS WILAYAH"}</span><h3>${e(region.name)}</h3><p>${e(region.landscape)}</p><span class="card-arrow">${icon("arrow_outward")}</span></div></a>`;
  const tribeCard = (tribe) => `<article class="tribe-card"><a class="image-link" href="#suku/${tribe.id}" aria-label="Jelajahi ${e(tribe.name)}">${photo(tribe.image, tribe.illustration ? "Ilustrasi bahan rempah" : `Dokumentasi budaya ${tribe.name}`)}</a><div class="tribe-card-content"><span class="eyebrow">${e(tribe.province)}</span><h3>${e(tribe.name)}</h3><p>${e(tribe.summary)}</p>${link(`suku/${tribe.id}`, "Kenali tradisinya")}</div></article>`;
  const plantCard = (remedy) => `<article class="plant-card"><a class="plant-image image-link" href="#herbal/${remedy.id}" aria-label="Baca ${e(remedy.type)}: ${e(remedy.name)}">${photo(remedy.image, remedy.alt)}<span class="image-type">${e(remedy.type)}</span><span class="plant-image-arrow">${icon("arrow_outward")}</span></a><div class="plant-card-content"><span class="eyebrow">${e(remedy.scopeLabel || remedy.tribeName)}</span><h3><a href="#herbal/${remedy.id}">${e(remedy.name)}</a></h3><p class="botanical-name">${e(scientificLabel(remedy))}</p><p class="plant-summary">${e(remedy.summary)}</p><div class="card-bottom">${link(`herbal/${remedy.id}`, "Jelajahi detail")}${icon(remedy.type === "Tumbuhan" ? "eco" : "spa")}</div></div></article>`;
  const categoryIcon = (category) => category === "Jurnal" ? "science" : category === "Budaya" ? "groups" : "menu_book";
  const journalCard = (ref, headingTag = "h3") => {
    const url = safeURL(ref.url);
    return `<article class="journal-card" data-reference-id="${e(ref.id)}"><figure><div class="journal-image ${ref.imageFit === "contain" ? "image-contain" : ""}">${photo(ref.image, ref.alt)}<span class="image-type">${icon(categoryIcon(ref.category))}${e(ref.category)}</span><span class="journal-year">${e(ref.year)}</span></div><figcaption class="journal-caption">${caption(ref)}</figcaption></figure><div class="journal-content"><span class="eyebrow">${e(ref.publisher)}</span><${headingTag} class="journal-title">${e(ref.title)}</${headingTag}><p class="journal-author">${e(ref.author)}</p><p class="journal-summary">${e(ref.summary)}</p><details class="citation-details"><summary>Sitasi publikasi ${icon("expand_more")}</summary><p>${e(ref.citation)}</p><button class="text-link" data-copy-citation="${e(ref.id)}">Salin sitasi ${icon("content_copy")}</button></details><div class="card-bottom">${url ? `<a class="text-link" href="${e(url)}" target="_blank" rel="noopener noreferrer">Baca publikasi ${icon("arrow_outward")}<span class="sr-only"> (tab baru)</span></a>` : ""}<span class="reference-kind">${e(ref.year)}</span></div></div></article>`;
  };
  const referenceEntry = (ref) => `<article class="journal-card reference-entry" data-reference-id="${e(ref.id)}"><div class="reference-entry-meta"><span>${e(ref.category)}</span><span>${e(ref.year)}</span></div><h2 class="reference-entry-title" tabindex="-1">${e(ref.title)}</h2><p class="journal-author">${e(ref.author)} · ${e(ref.publisher)}</p><details class="citation-details"><summary>Ringkasan & sitasi ${icon("expand_more")}</summary><p>${e(ref.summary)}</p><p>${e(ref.citation)}</p><button class="text-link" data-copy-citation="${e(ref.id)}">Salin sitasi ${icon("content_copy")}</button></details><div class="card-bottom"><a class="text-link" href="${e(safeURL(ref.url))}" target="_blank" rel="noopener noreferrer">Baca publikasi ${icon("arrow_outward")}<span class="sr-only"> (tab baru)</span></a></div></article>`;
  const herbList = (remedies, headingTag = "h4") => `<ul class="directory-list">${remedies.map((remedy) => herbEntry(remedy, headingTag)).join("")}</ul>`;
  const discoveryGroups = ({ remedies, tribes }) => `${remedies.length ? `<section class="search-group" aria-label="Hasil herbal"><h3 class="search-group-title">Herbal · ${remedies.length} catatan</h3>${herbList(remedies)}</section>` : ""}${tribes.length ? `<section class="search-group" aria-label="Hasil komunitas"><h3 class="search-group-title">Komunitas · ${tribes.length}</h3><ul class="community-results">${tribes.map((tribe) => `<li>${link(`suku/${tribe.id}`, `${tribe.name} · ${tribe.province}`, "directory-community")}</li>`).join("")}</ul></section>` : ""}`;
  const journals = (ids, className = "") => `<div class="journal-grid ${className}">${[...new Set(list(ids))].map((id) => data.references.find((ref) => ref.id === id)).filter(Boolean).map((ref) => journalCard(ref)).join("")}</div>`;
  const mythCard = (myth, index) => `<a class="myth-card" href="#mitos/${myth.id}"><div class="myth-card-image">${photo(myth.image, myth.alt)}<span class="myth-index">${String(index + 1).padStart(2, "0")}</span><span class="image-type">${e(myth.topic)}</span><h2>${e(myth.title)}</h2></div><div class="myth-card-content"><span class="myth-label">KLAIM YANG SERING TERDENGAR</span><p class="myth-claim">${e(myth.myth)}</p><div class="card-bottom"><span class="text-link">Periksa fakta ${icon("arrow_forward")}</span></div></div></a>`;
  const impactCard = (sdg, point) => `<article class="impact-card"><a class="impact-image image-link" href="#dampak/${sdg.id}/${point.id}" aria-label="Baca ${e(point.title)}">${photo(point.image, point.alt)}</a><div class="impact-content"><div class="impact-metric"><strong>${e(point.value)}</strong><span>${e(point.unit)}</span></div><h2>${e(point.title)}</h2><p>${e(point.description)}</p><div class="impact-topics">${point.details.map((detail) => `<span>${icon("chevron_right")}${e(detail.title)}</span>`).join("")}</div>${link(`dampak/${sdg.id}/${point.id}`, "Pelajari kontribusinya")}</div></article>`;
  const initAtlas = (root, id) => bindMap($(`[data-atlas="${id}"]`, root), data.regions, $(`#${id}-preview`, root));
  const readingNav = (hash, sections) => `<nav class="article-toc detail-toc" aria-label="Panduan membaca halaman"><span class="eyebrow">DALAM HALAMAN INI</span>${sections.map(([id, label], index) => `<a href="#${e(hash)}" data-scroll="${id}"><span>${String(index + 1).padStart(2, "0")}</span>${e(label)}</a>`).join("")}</nav>`;

  return {
    home() {
      $("#remedy-count").textContent = data.remedies.length;
      $("#province-grid").innerHTML = data.regions.map(regionCard).join("");
      this.tribes();
      this.discovery();
      $("#hero-map").innerHTML = mapSVG(mapData, data.regions, true);
      bindMap($("#hero-map"), data.regions, $("#hero-preview"));
      $("#sdg-preview").innerHTML = data.sdgs.map((sdg) => `<a href="#${sdg.id}" class="sdg-preview-card">${photo(sdg.points[0].image, sdg.points[0].alt)}<div><span class="eyebrow">SUSTAINABLE DEVELOPMENT GOALS</span><h3>${e(sdg.title)}</h3><p>${e(sdg.english)}</p><span class="text-link">Kenali kontribusi proyek ${icon("arrow_outward")}</span></div><img class="sdg-small-icon" src="${sdg.icon}" alt="Ikon resmi SDG ${sdg.number}"></a>`).join("");
      $("#journal-preview").innerHTML = ["silalahi2019", "lee2021", "asra2024"].map((id) => journalCard(data.references.find((ref) => ref.id === id))).join("");
    },
    discovery() {
      const keyword = $("#discovery-search").value.trim();
      const results = findCollection(data, keyword);
      $("#discovery-results").hidden = !keyword;
      $("#discovery-results").innerHTML = keyword ? discoveryGroups(results) : "";
      $("#discovery-status").textContent = keyword ? results.remedies.length || results.tribes.length ? `${results.remedies.length} catatan herbal dan ${results.tribes.length} komunitas ditemukan.` : "Belum ada hasil. Coba nama lokal, nama ilmiah, atau komunitas lain." : "";
    },
    directory(category = "all", keyword = "") {
      const filters = ["all", "Tumbuhan", "Ramuan", "Minuman", "Tradisi"];
      $("#page-herbs").innerHTML = `<div class="container">${breadcrumb([[null, "Direktori herbal"]])}<div class="subpage-heading"><span class="eyebrow">${data.remedies.length} CATATAN PILIHAN</span><h1 tabindex="-1">Mulai dari <em>nama tumbuhan.</em></h1><p>Tumbuhan, ramuan, minuman, dan praktik dalam koleksi. Pilih nama untuk langsung membaca profil, konteks penggunaan, dan sumbernya.</p></div>${search("directory-search", "Cari nama herbal, nama ilmiah, atau komunitas", "Cari nama lokal, ilmiah, atau komunitas…", keyword)}<div class="filter-row" role="group" aria-label="Jenis catatan dalam direktori">${filters.map((type) => `<button class="filter-button ${category === type ? "active" : ""}" data-directory-filter="${type}" aria-pressed="${category === type}">${type === "all" ? "Semua catatan" : type}</button>`).join("")}</div><p id="directory-status" class="results-note" role="status"></p><div id="directory-results"></div><p class="collection-context">Koleksi pilihan, bukan inventaris lengkap Sumatera. Label literatur lintas wilayah menunjukkan konteks sumber, bukan kepemilikan resep lokal. ${link("about", "Baca metodologi")}</p></div>`;
      this.directoryList(category, keyword);
    },
    directoryList(category, keyword) {
      const { remedies } = findCollection(data, keyword, category);
      $("#directory-results").innerHTML = remedies.length ? herbList(remedies, "h2") : empty("Catatan belum ditemukan.", "Coba nama lain atau pilih semua jenis catatan.", "data-clear-directory", "Reset pencarian", "h2");
      $("#directory-status").textContent = `${remedies.length} dari ${data.remedies.length} catatan ditampilkan.`;
    },
    about() {
      $("#page-about").innerHTML = `<div class="container">${breadcrumb([[null, "Tentang & Metodologi"]])}<div class="subpage-heading"><span class="eyebrow">DI BALIK RACIK SUMATERA</span><h1 tabindex="-1">Pengetahuan terbuka.<br><em>Konteks tetap terjaga.</em></h1><p>Kenali cakupan atlas, cara membaca bukti, pilihan sumber, dan asal visual yang menemani perjalanan ini.</p></div>${methodologyContent(data)}</div>`;
    },
    tribes(expanded = homeTribesExpanded) {
      homeTribesExpanded = expanded;
      const keyword = $("#tribe-search").value.trim().toLocaleLowerCase("id");
      const { tribes, remedies } = findCollection(data, keyword);
      $("#tribe-herbal-results").hidden = !keyword || !remedies.length;
      $("#tribe-herbal-results").innerHTML = keyword && remedies.length ? `<h3 class="search-group-title">Herbal · langsung ke profil</h3>${herbList(remedies)}` : "";
      $("#tribe-search-heading").hidden = !keyword;
      $("#tribe-grid").innerHTML = tribes.length ? tribes.map(tribeCard).join("") : empty("Belum ada yang cocok.", "Coba nama komunitas, wilayah, atau tumbuhan lain.", "data-clear-tribes", "Hapus pencarian");
      $("#tribe-grid").classList.toggle("is-expanded", expanded || Boolean(keyword));
      $("[data-show-tribes]").hidden = expanded || Boolean(keyword);
      $("#tribe-results").textContent = keyword ? `${remedies.length} catatan herbal dan ${tribes.length} komunitas ditemukan.` : `${data.tribes.length} komunitas dalam koleksi. Pilih kartu untuk mengenali tradisinya.`;
    },
    atlas() {
      $("#page-atlas").innerHTML = `<div class="container">${breadcrumb([[null, "Atlas Sumatera"]])}<div class="subpage-heading"><span class="eyebrow">ATLAS WARISAN HERBAL</span><h1 tabindex="-1">Peta kecil.<br><em>Pengetahuan yang luas.</em></h1><p>Kenali enam wilayah koleksi melalui lanskap, masyarakat, dan tumbuhannya. Pilih penanda atau nama wilayah untuk mulai menjelajah.</p><p class="collection-context">Enam wilayah adalah pengelompokan editorial, bukan inventaris seluruh Sumatera atau batas kepemilikan tradisi. ${link("about", "Kenali cakupan atlas")}</p></div>${atlasMarkup(mapData, data.regions, "full")}</div>`;
      initAtlas($("#page-atlas"), "full");
    },
    mapDialog() { $("#dialog-atlas").innerHTML = atlasMarkup(mapData, data.regions, "dialog"); initAtlas($("#dialog-atlas"), "dialog"); },
    region(region) {
      const tribes = data.tribes.filter((tribe) => region.tribes.includes(tribe.id));
      const allTribes = [...tribes, ...data.tribes.filter((tribe) => list(region.relatedTribes).includes(tribe.id))];
      const remedies = allTribes.flatMap((tribe) => tribe.remedies);
      const filters = ["all", "Tumbuhan", "Ramuan", "Minuman", "Tradisi"].filter((type) => type === "all" || remedies.some((item) => item.type === type));
      $("#page-region").innerHTML = `<div class="region-page motif-${region.motif}" style="--region-accent:${region.accent}"><div class="container">${breadcrumb([["atlas", "Atlas"], [null, region.name]])}<section class="region-hero"><div><span class="eyebrow">WARISAN DARI ${e(region.name.toUpperCase())}</span><h1 tabindex="-1">${e(region.name)}<em>.</em></h1><p class="region-tagline">${e(region.tagline)}</p><p>${e(region.intro)}</p><div class="region-meta"><span>${tribes.length ? `${tribes.length} komunitas` : "Pembanding lintas wilayah"}</span><span>${remedies.length} catatan</span></div><a class="button button-primary" href="#wilayah/${region.id}" data-scroll="regional-herbs">Temukan herbalnya ${icon("arrow_forward")}</a></div><figure class="region-hero-photo">${photo(region.previewImage || region.image, region.previewAlt || region.imageAlt, "", true)}<figcaption>${e(region.landscape)}</figcaption></figure></section><div class="local-motif" aria-hidden="true"></div>${!tribes.length ? `<p class="region-context">${e(region.note)}</p>` : ""}<section class="section compact-section" id="regional-herbs">${heading("KOLEKSI PENGETAHUAN", tribes.length ? "Tumbuhan & ramuan dalam tradisi." : "Pembanding: betangas dari Jambi.")}<div class="collection-toolbar">${search("plant-search", "Cari herbal di wilayah ini", "Cari nama herbal atau nama ilmiah…")}<div class="filter-row" role="group" aria-label="Jenis catatan herbal">${filters.map((type) => `<button class="filter-button ${type === "all" ? "active" : ""}" data-plant-filter="${type}" aria-pressed="${type === "all"}">${type === "all" ? "Semua catatan" : type}</button>`).join("")}</div></div><div class="plant-grid" id="regional-plant-grid"></div><p class="results-note" id="plant-results" role="status"></p></section>${tribes.length ? `<section class="section compact-section">${heading("MASYARAKAT PEMILIK PENGETAHUAN", "Cerita di balik setiap ramuan.")}<div class="tribe-grid regional-tribes">${tribes.map(tribeCard).join("")}</div></section>` : ""}<section class="section compact-section">${heading("SUMBER WILAYAH", "Telusuri penelitiannya.")}${journals(allTribes.flatMap((tribe) => tribe.referensi.map((ref) => ref.id)))}</section></div></div>`;
    },
    plants(ids, category, keyword) {
      const remedies = data.remedies.filter((remedy) => ids.includes(remedy.tribeId) && (category === "all" || remedy.type === category) && [remedy.name, remedy.namaIlmiah || "", ...list(remedy.namaLain)].join(" ").toLocaleLowerCase("id").includes(keyword.toLocaleLowerCase("id")));
      $("#regional-plant-grid").innerHTML = remedies.length ? remedies.map(plantCard).join("") : empty("Catatan belum ditemukan.", "Coba kata kunci lain atau pilih semua jenis catatan.", "data-clear-plants", "Reset pencarian");
      $("#plant-results").textContent = `${remedies.length} catatan ditampilkan.`;
    },
    tribe(tribe) {
      $("#page-tribe").innerHTML = `<div class="container">${breadcrumb([[`wilayah/${tribe.regionId}`, tribe.province], [null, tribe.name]])}<section class="region-hero"><div><span class="eyebrow">MASYARAKAT & PENGETAHUAN</span><h1 tabindex="-1">${e(tribe.name)}<em>.</em></h1><p>${e(tribe.pengantar)}</p>${sources(tribe.sumberPengantar)}</div><figure class="region-hero-photo">${photo(tribe.image, `Dokumentasi ${tribe.name}`, "", true)}<figcaption>${e(tribe.province)} · ${tribe.illustration ? "ilustrasi bahan rempah" : "koleksi tim"}</figcaption></figure></section><section class="section compact-section">${heading(tribe.collectionIntro ? "PROFIL BOTANI PEMBANDING" : "CATATAN HERBAL", tribe.collectionIntro ? "Memperluas pengetahuan tumbuhan." : "Pengetahuan yang diwariskan.", tribe.collectionIntro || "")}${search("plant-search", "Cari herbal komunitas ini", "Cari herbal komunitas ini…")}<div class="plant-grid" id="regional-plant-grid"></div><p class="results-note" id="plant-results" role="status"></p></section>${tribe.tumbuhanLain ? `<section class="community-context"><span class="section-icon">${icon("forest")}</span><div><span class="eyebrow">LANSKAP PENGETAHUAN</span><h2>Lebih dari satu tumbuhan.</h2><p>${e(tribe.tumbuhanLain)}</p></div></section>` : ""}${tribe.gallery.length ? `<section class="section compact-section">${heading("ARSIP VISUAL", "Wajah sebuah warisan.")}<div class="culture-gallery">${tribe.gallery.map((src, index) => `<figure>${photo(src, `Dokumentasi budaya ${tribe.name}, koleksi ${index + 1}`)}<figcaption>${e(tribe.name)} · koleksi tim</figcaption></figure>`).join("")}</div></section>` : ""}<section class="section compact-section">${heading("REFERENSI KOMUNITAS", "Telusuri sumbernya.")}${journals([...tribe.referensi.map((ref) => ref.id), ...tribe.sumberPengantar])}</section></div>`;
    },
    plant(remedy) {
      const tribe = data.tribes.find((item) => item.id === remedy.tribeId);
      const hasPreparation = remedy.caraPengolahan.length > 0;
      const sections = [["plant-identity", "Identitas & bahan"], ["plant-tradition", "Pemanfaatan"], ...(hasPreparation ? [["plant-preparation", "Cara pengolahan"]] : []), ["plant-culture", "Konteks budaya"], ["plant-research", "Temuan penelitian"], ["plant-sources", "Referensi"]];
      const facts = [["forest", "Bentuk", remedy.bentuk], ["local_florist", "Bagian tumbuhan", remedy.bagian], ["spa", "Pemanfaatan", remedy.jalur], ["location_on", "Lokasi / literatur", remedy.lokasi]];
      const ingredientPhotos = list(remedy.ingredientPhotos);
      $("#page-plant").innerHTML = `<div class="container">
        ${breadcrumb([[`wilayah/${remedy.regionId}`, tribe.province], [`suku/${tribe.id}`, tribe.name], [null, remedy.name]])}
        <section class="plant-hero"><div>
          <span class="eyebrow">${e(remedy.type.toUpperCase())} · ${e(remedy.scopeLabel ? "PROFIL BOTANI" : tribe.name.toUpperCase())}</span>
          <h1 tabindex="-1">${e(remedy.name)}</h1><p class="plant-scientific">${e(scientificLabel(remedy))}</p><p>${e(remedy.summary)}</p>
          <div class="plant-badges"><span class="status-badge">${icon("menu_book")} ${e(remedy.scopeLabel || "CATATAN ETNOBOTANI")}</span><span>${e(tribe.province)}</span></div>
          ${list(remedy.namaLain).length ? `<p class="alternate-names">Nama lain: ${list(remedy.namaLain).map(e).join(" · ")}</p>` : ""}
          <div class="hero-actions">${copyLink()}</div>
        </div><figure class="plant-hero-photo ${remedy.id === "temu-putih" ? "botanical-plate" : ""}">${photo(remedy.image, remedy.alt, "", true)}<figcaption>${caption(remedy, remedy.illustration ? "Ilustrasi konteks tumbuhan dan tradisi" : remedy.alt)}</figcaption></figure></section>
        <div class="plant-profile-strip">${facts.filter(([, , value]) => value).map(([symbol, label, value]) => `<div>${icon(symbol)}<div><span>${e(label)}</span><strong>${e(value)}</strong></div></div>`).join("")}</div>
        <div class="article-layout"><nav class="article-toc" aria-label="Bagian catatan herbal"><span class="eyebrow">JELAJAHI CATATAN</span>${sections.map(([id, label], index) => `<a href="#herbal/${remedy.id}" data-scroll="${id}"><span>${String(index + 1).padStart(2, "0")}</span>${e(label)}</a>`).join("")}</nav>
          <div class="article-content">
            <section id="plant-identity">${heading("01 / MENGENAL BAHAN", "Identitas yang berakar.")}
              <div class="identity-panel"><div class="identity-title">${icon("eco")}<div><span class="eyebrow">${remedy.namaIlmiah ? "IDENTITAS BOTANI" : "BENTUK RAMUAN"}</span><h3>${e(scientificLabel(remedy))}</h3>${remedy.famili ? `<p>Famili ${e(remedy.famili)}</p>` : ""}</div></div>${bullets(remedy.ciri)}</div>
              <div class="ingredient-panel"><div class="ingredient-list"><span class="eyebrow">BAHAN & BAGIAN TUMBUHAN</span><h3>${remedy.type === "Tumbuhan" ? "Bagian yang dimanfaatkan" : "Susunan bahan"}</h3>${bullets(remedy.bahan)}</div>
                ${ingredientPhotos.length ? `<div class="ingredient-photos">${ingredientPhotos.map((asset) => `<figure>${photo(asset.image, asset.alt)}<figcaption>${caption(asset)}</figcaption></figure>`).join("")}</div>` : ""}
              </div>
            </section>
            <section id="plant-tradition">${heading("02 / PEMANFAATAN", "Tumbuhan dalam keseharian.")}
              <div class="practice-layout"><div class="practice-main"><span class="section-icon">${icon("spa")}</span><h3>Pemanfaatan tradisional</h3>${bullets(remedy.kegunaanTradisional)}</div>
                ${remedy.caraPenggunaan.length ? `<aside class="practice-use"><span class="eyebrow">BENTUK PEMAKAIAN</span><h3>Dari bahan, menjadi praktik.</h3>${bullets(remedy.caraPenggunaan)}</aside>` : ""}
              </div>
            </section>
            ${hasPreparation ? `<section id="plant-preparation">${heading("03 / CARA PENGOLAHAN", "Alur meracik pengetahuan.")}<ol class="preparation-timeline">${remedy.caraPengolahan.map((method, index) => `<li><span class="step-number">${String(index + 1).padStart(2, "0")}</span><div><h3>${e(method.metode)}</h3>${bullets(method.langkah)}</div></li>`).join("")}</ol></section>` : ""}
            <section id="plant-culture" class="culture-panel"><span class="culture-emblem">${icon("groups")}</span><span class="eyebrow">${remedy.scopeLabel ? "KONTEKS LITERATUR" : "WARISAN & MASYARAKAT"}</span><h2>${remedy.scopeLabel ? "Pengetahuan lintas wilayah." : "Pengetahuan punya rumah."}</h2>${bullets(remedy.budaya)}${link(`suku/${tribe.id}`, `Kenali masyarakat ${tribe.name}`)}</section>
            <section id="plant-research">${heading("PENELITIAN / MEMPERLUAS PENGETAHUAN", "Dari lapangan & laboratorium.")}
              <div class="research-stack">${list(remedy.penelitian).map((study, index) => `<article class="research-card"><div class="research-meta"><span>${String(index + 1).padStart(2, "0")}</span><span>${icon("science")}${e(study.kind)}</span></div><h3>${e(study.title)}</h3>${bullets(study.points)}<div class="research-source">${sourceLink(study.source)}</div></article>`).join("")}</div>
            </section>
          </div>
        </div>
        <section id="plant-sources" class="section compact-section">${heading("PERPUSTAKAAN TERKAIT", "Baca sumber lengkapnya.")}${journals(remedy.sumber)}</section>
        ${tribe.remedies.length > 1 ? `<section class="section compact-section">${heading(remedy.scopeLabel ? "PROFIL BOTANI TERKAIT" : "MASIH DALAM SATU TRADISI", "Lanjutkan rasa ingin tahu.")}<div class="plant-grid">${tribe.remedies.filter((item) => item.id !== remedy.id).slice(0, 3).map(plantCard).join("")}</div></section>` : ""}
        <div class="return-link">${link(`suku/${tribe.id}`, `Kembali ke ${tribe.name}`, "button button-outline")}</div>
      </div>`;
    },
    myths() {
      $("#page-myths").innerHTML = `<div class="container">${breadcrumb([[null, "Mitos vs Fakta"]])}<div class="subpage-heading"><span class="eyebrow">LITERASI KESEHATAN</span><h1 tabindex="-1">Hormati tradisinya.<br><em>Periksa faktanya.</em></h1><p>Enam pertanyaan untuk mengenal herbal dengan lebih jernih. Pilih sebuah kartu untuk membaca fakta dan sumber penjelasannya.</p></div><div class="myth-grid">${data.myths.map(mythCard).join("")}</div><div class="return-link">${link("references", "Baca sumber penelitian", "button button-outline")}</div></div>`;
    },
    myth(myth) {
      $("#page-myth").innerHTML = `<div class="container myth-detail">
        ${breadcrumb([["myths", "Mitos vs Fakta"], [null, myth.topic]])}
        <section class="editorial-hero detail-hero"><div><span class="eyebrow">MEMERIKSA KLAIM · ${e(myth.topic.toUpperCase())}</span><h1 tabindex="-1">${e(myth.title)}</h1><p>${e(myth.intro)}</p>${sources(myth.sources)}<div class="hero-actions">${copyLink()}</div></div><figure>${photo(myth.image, myth.alt, "", true)}<figcaption>${e(myth.alt)}</figcaption></figure></section>
        <div class="fact-comparison fact-editorial">
          <section class="claim-panel" aria-labelledby="myth-claim-heading"><div class="comparison-meta"><span class="myth-label">MITOS</span>${icon("menu_book")}</div><h2 id="myth-claim-heading">${e(myth.myth)}</h2></section>
          <section class="fact-panel" aria-labelledby="myth-fact-heading"><div class="comparison-meta"><span class="fact-label">FAKTA</span>${icon("science")}</div><h2 id="myth-fact-heading">${e(myth.fact)}</h2></section>
        </div>
        <div class="detail-layout">
          ${readingNav(`mitos/${myth.id}`, [["myth-context", "Konteks klaim"], ["myth-explanation", "Memahami fakta"], ["myth-sources", "Sumber penjelasan"]])}
          <div class="reading-column detail-reading">
            <section id="myth-context" class="detail-introduction">${heading("01 / KONTEKS", "Mengapa klaim ini bisa muncul?")}<p>${e(myth.context)}</p></section>
            <section id="myth-explanation" class="explanation-panel">${heading("02 / MEMBACA FAKTA", "Apa yang perlu dipahami?")}<p>${e(myth.explanation)}</p>${myth.remedy ? `<div class="detail-next">${link(`herbal/${myth.remedy}`, "Jelajahi herbal terkait", "button button-primary")}</div>` : ""}</section>
          </div>
        </div>
        <section id="myth-sources" class="section compact-section detail-sources">${heading("SUMBER PENJELASAN", "Fakta yang dapat ditelusuri.")}${journals(myth.sources)}</section>
        <section class="section compact-section">${heading("PERTANYAAN BERIKUTNYA", "Lanjutkan memeriksa fakta.")}<div class="related-links">${data.myths.filter((item) => item.id !== myth.id).slice(0, 3).map((item) => link(`mitos/${item.id}`, item.title, "related-link")).join("")}</div></section>
      </div>`;
    },
    sdg(sdg) {
      const officialURL = safeURL(data.references.find((ref) => ref.id === `un-${sdg.id}`).url);
      $("#page-" + sdg.id).innerHTML = `<div class="container">${breadcrumb([[null, `SDG ${sdg.number}`]])}<section class="sdg-page-hero"><a class="sdg-icon-card" href="${e(officialURL)}" target="_blank" rel="noopener noreferrer"><img src="${sdg.icon}" alt="Ikon resmi SDG ${sdg.number}: ${e(sdg.english)}"><span>Tujuan global.<br>Kontribusi lokal. ${icon("arrow_outward")}<span class="sr-only"> (Baca tujuan resmi PBB, tab baru)</span></span></a><div><span class="eyebrow">SUSTAINABLE DEVELOPMENT GOALS · ${String(sdg.number).padStart(2, "0")}</span><h1 tabindex="-1">${e(sdg.title)}<em>.</em></h1><p>${e(sdg.intro)}</p>${sources(sdg.sources)}</div></section><section class="project-connection"><span class="eyebrow">HUBUNGAN DENGAN PROYEK</span><h2>${sdg.number === 3 ? "Pengetahuan lebih jernih.<br><em>Pilihan lebih bijak.</em>" : "Mengenal budaya.<br><em>Belajar sepanjang hayat.</em>"}</h2><p>${e(sdg.connection)}</p></section><div class="impact-grid">${sdg.points.map((point) => impactCard(sdg, point)).join("")}</div><div class="return-link">${link(sdg.number === 3 ? "sdg4" : "sdg3", `Jelajahi SDG ${sdg.number === 3 ? 4 : 3}`, "button button-outline")}</div></div>`;
    },
    impact(sdg, point) {
      $("#page-impact").innerHTML = `<div class="container impact-detail">
        ${breadcrumb([[sdg.id, `SDG ${sdg.number}`], [null, point.title]])}
        <section class="editorial-hero detail-hero"><div><span class="eyebrow">KONTRIBUSI PROYEK · SDG ${sdg.number}</span><h1 tabindex="-1">${e(point.title)}<em>.</em></h1><p>${e(point.description)}</p><div class="impact-metric impact-hero-metric"><strong>${e(point.value)}</strong><span>${e(point.unit)}</span></div></div><figure>${photo(point.image, point.alt, "", true)}<figcaption>${e(point.alt)}</figcaption></figure></section>
        <div class="detail-layout">
          ${readingNav(`dampak/${sdg.id}/${point.id}`, [["impact-context", "Hubungan proyek"], ["impact-learning", "Materi pembelajaran"], ["impact-herbs", "Contoh herbal"], ["impact-sources", "Sumber terkait"]])}
          <div class="reading-column detail-reading">
            <section id="impact-context" class="detail-introduction">${heading("HUBUNGAN DENGAN RACIK SUMATERA", "Dari dokumentasi, menjadi pembelajaran.")}<p>${e(point.intro)}</p></section>
            <section id="impact-learning">${heading("DASAR & PRAKTIK PEMBELAJARAN", "Kenali hubungannya.")}
              <ol class="learning-stack" role="list">${point.details.map((detail, index) => `<li><article class="learning-card"><div class="learning-marker" aria-hidden="true"><span>${String(index + 1).padStart(2, "0")}</span>${icon(sdg.number === 3 ? "science" : "menu_book")}</div><div class="learning-copy"><span class="learning-meta">${e(point.evidenceLabel)} · SDG ${String(sdg.number).padStart(2, "0")}</span><h3>${e(detail.title)}</h3><p>${e(detail.text)}</p></div></article></li>`).join("")}</ol>
              ${point.myth ? `<div class="detail-next">${link(`mitos/${point.myth}`, "Periksa klaim terkait", "button button-primary")}</div>` : ""}
            </section>
          </div>
        </div>
        <section id="impact-herbs" class="section compact-section detail-sources">${heading("CONTOH DALAM KOLEKSI", "Lihat konteks herbalnya.")}<div class="plant-grid">${point.links.map((id) => data.remedies.find((remedy) => remedy.id === id)).filter(Boolean).map(plantCard).join("")}</div></section>
        <section id="impact-sources" class="section compact-section">${heading("SUMBER TERKAIT", "Belajar dengan dasar yang jelas.")}${journals(point.sources)}</section>
        <div class="return-link">${link(sdg.id, `Kembali ke SDG ${sdg.number}`, "button button-outline")}</div>
      </div>`;
    },
    references(category, keyword, layout = "list") {
      $("#page-references").innerHTML = `<div class="container">${breadcrumb([[null, "Referensi"]])}<div class="subpage-heading reference-heading"><span class="eyebrow">PERPUSTAKAAN TERBUKA</span><h1 tabindex="-1">Pengetahuan yang<br><em>bisa ditelusuri.</em></h1><p>Jurnal, monografi tumbuhan, dokumentasi budaya, dan panduan lembaga resmi. Temukan topiknya, salin sitasi, lalu baca publikasi aslinya.</p><div class="reference-stat"><strong>${data.references.length}</strong><span>sumber dalam perpustakaan</span></div></div><div class="reference-toolbar">${search("reference-search", "Cari judul, penulis, tahun, atau topik", "Cari judul, penulis, tahun, atau topik…", keyword)}<div class="filter-row reference-layout" role="group" aria-label="Tampilan referensi">${[["list", "Daftar ringkas"], ["cards", "Kartu visual"]].map(([value, label]) => `<button class="filter-button ${layout === value ? "active" : ""}" data-ref-layout="${value}" aria-pressed="${layout === value}">${label}</button>`).join("")}</div></div><div class="filter-row" role="group" aria-label="Kategori referensi">${["all", "Jurnal", "Pemerintah", "Budaya", "Lainnya"].filter((type) => type === "all" || data.references.some((ref) => ref.category === type)).map((type) => `<button class="filter-button ${category === type ? "active" : ""}" aria-pressed="${category === type}" data-ref-filter="${type}">${type === "all" ? "Semua sumber" : type}</button>`).join("")}</div><p class="results-note" id="reference-results" role="status"></p><div id="reference-list" class="reference-list"></div><div class="reference-more"><button class="button button-outline" data-more-refs aria-controls="reference-list">Tampilkan sumber lagi</button></div></div>`;
    },
    referenceList(category, keyword, limit = referencePageSize, layout = "list") {
      const refs = findReferences(data, category, keyword);
      const visible = refs.slice(0, limit);
      $("#reference-list").className = layout === "list" ? "reference-list" : "journal-grid";
      $("#reference-list").innerHTML = refs.length ? visible.map((ref) => layout === "list" ? referenceEntry(ref) : journalCard(ref, "h2")).join("") : empty("Sumber belum ditemukan.", "Coba kata kunci atau kategori yang berbeda.", "data-clear-refs", "Tampilkan semua sumber", "h2");
      $("#reference-list").querySelectorAll("[data-reference-id]").forEach((card) => { card.id = `ref-${card.dataset.referenceId}`; });
      $("#reference-results").textContent = `${visible.length} dari ${refs.length} hasil ditampilkan · ${data.references.length} sumber dalam perpustakaan.`;
      $("[data-more-refs]").hidden = visible.length >= refs.length;
      $("[data-more-refs]").textContent = `Tampilkan ${Math.min(referencePageSize, refs.length - visible.length)} sumber lagi`;
    },
    notFound() { $("#page-not-found").innerHTML = `<div class="container not-found"><span class="eyebrow">404 · CATATAN BELUM TERSEDIA</span><h1 tabindex="-1">Mari kembali<br><em>ke perjalanan.</em></h1><p>Halaman atau catatan ini tidak ditemukan. Pilih wilayah dari atlas untuk melanjutkan.</p>${link("atlas", "Kembali ke atlas", "button button-primary")}</div>`; }
  };
}
