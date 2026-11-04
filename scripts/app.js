
/* =====================================================
   RACIK SUMATERA
   Main JavaScript
   ===================================================== */

const tribeGrid = document.getElementById("tribe-grid");
const tribeContent = document.getElementById("tribe-content");
const referenceList = document.getElementById("reference-list");

const searchInput = document.getElementById("tribe-search");
const searchEmpty = document.getElementById("search-empty");
const clearFilter = document.getElementById("clear-filter");

const mainNav = document.getElementById("main-nav");
const menuToggle = document.getElementById("menu-toggle");

let tribeData = [];
let referenceData = [];

let selectedTribe = null;
let selectedProvince = null;
let selectedReferenceCategory = "all";


/* =====================================================
   1. HELPER FUNCTIONS
   ===================================================== */

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return entities[character];
  });
}


function activateImageFallbacks(root = document) {

  root.querySelectorAll(".asset-frame img").forEach((img) => {

    function showFallback() {

      img.hidden = true;

      img.parentElement.classList.add("has-fallback");

    }

    img.addEventListener("error", showFallback, {
      once: true
    });

    if (img.complete && img.naturalWidth === 0) {
      showFallback();
    }

  });

}


/* =====================================================
   2. LOAD JSON DATA
   ===================================================== */

async function loadWebsiteData() {

  try {

    const response = await fetch("data/suku.json");

    if (!response.ok) {
      throw new Error("Gagal membaca file JSON.");
    }

    const data = await response.json();

    tribeData = Array.isArray(data.suku) ? data.suku : [];

    referenceData = Array.isArray(data.referensi)
      ? data.referensi
      : [];

    renderTribeCards();
    renderReferences();

    activateImageFallbacks();

    openPageFromHash();

  } catch (error) {

    console.error("Data website gagal dimuat:", error);

    tribeGrid.innerHTML = `
      <div class="empty-state">
        <h3>Data belum dapat dimuat</h3>
        <p>
          Pastikan file data/suku.json tersedia dan website
          dijalankan melalui local server.
        </p>
      </div>
    `;

  }

}


/* =====================================================
   3. PAGE NAVIGATION
   ===================================================== */

function navigateTo(page, updateHistory = true) {

  const targetPage = document.getElementById(`page-${page}`);

  if (!targetPage) return;

  document.querySelectorAll(".page").forEach((section) => {

    section.classList.remove("active");

  });

  targetPage.classList.add("active");

  document.querySelectorAll(".nav-link").forEach((button) => {

    button.classList.toggle(
      "active",
      button.dataset.page === page
    );

  });

  mainNav.classList.remove("open");

  menuToggle.setAttribute("aria-expanded", "false");

  menuToggle.textContent = "☰";

  if (updateHistory) {

    const hash = page === "tribe"
      ? `#suku/${selectedTribe}`
      : `#${page}`;

    history.pushState(null, "", hash);

  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


function openPageFromHash() {

  const hash = window.location.hash.replace("#", "");

  if (hash.startsWith("suku/")) {

    const tribeId = hash.split("/")[1];

    openTribe(tribeId, false);

    return;

  }

  const validPages = [
    "home",
    "myths",
    "sdg3",
    "sdg4",
    "references"
  ];

  if (validPages.includes(hash)) {

    navigateTo(hash, false);

  } else {

    navigateTo("home", false);

  }

}


window.addEventListener("popstate", openPageFromHash);


/* =====================================================
   4. NAVIGATION BUTTONS
   ===================================================== */

document.addEventListener("click", (event) => {

  const pageButton = event.target.closest("[data-page]");

  if (pageButton) {

    event.preventDefault();

    const page = pageButton.dataset.page;

    navigateTo(page);

    if (pageButton.dataset.scroll) {

      const section = document.getElementById(
        pageButton.dataset.scroll
      );

      if (section) {

        setTimeout(() => {

          section.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

        }, 120);

      }

    }

    return;

  }


  /* Klik kartu provinsi */

  const provinceButton = event.target.closest(
    "[data-province-filter]"
  );

  if (provinceButton) {

    selectedProvince = provinceButton.dataset.provinceFilter;

    navigateTo("home");

    renderTribeCards();

    setTimeout(() => {

      document.getElementById("tribes").scrollIntoView({
        behavior: "smooth"
      });

    }, 150);

    return;

  }


  /* Klik kartu suku */

  const tribeButton = event.target.closest("[data-tribe]");

  if (tribeButton) {

    openTribe(tribeButton.dataset.tribe);

    return;

  }


  /* Filter referensi */

  const referenceButton = event.target.closest(
    "[data-ref-filter]"
  );

  if (referenceButton) {

    selectedReferenceCategory =
      referenceButton.dataset.refFilter;

    document.querySelectorAll(".filter-button").forEach((button) => {

      button.classList.toggle(
        "active",
        button === referenceButton
      );

    });

    renderReferences();

    return;

  }

});


/* =====================================================
   5. MOBILE NAVIGATION
   ===================================================== */

menuToggle.addEventListener("click", () => {

  const isOpen = mainNav.classList.toggle("open");

  menuToggle.setAttribute(
    "aria-expanded",
    String(isOpen)
  );

  menuToggle.textContent = isOpen ? "✕" : "☰";

});


/* =====================================================
   6. RENDER TRIBE CARDS
   ===================================================== */

function renderTribeCards() {

  if (!tribeGrid) return;

  const keyword = searchInput.value.trim().toLowerCase();

  const filteredTribes = tribeData.filter((tribe) => {

    const matchesSearch = (
      tribe.name.toLowerCase().includes(keyword) ||
      tribe.province.toLowerCase().includes(keyword)
    );

    const matchesProvince = selectedProvince
      ? tribe.province === selectedProvince
      : true;

    return matchesSearch && matchesProvince;

  });


  tribeGrid.innerHTML = filteredTribes.map((tribe) => {

    return `

      <article class="tribe-card">

        <div class="tribe-card-image asset-frame">

          <img
            src="${escapeHTML(tribe.cover)}"
            alt="Dokumentasi budaya ${escapeHTML(tribe.name)}"
            loading="lazy"
          >

          <div class="asset-placeholder">
            <span class="placeholder-icon">✳</span>
            <strong>${escapeHTML(tribe.name)}</strong>
            <small>Foto dokumentasi akan ditambahkan</small>
          </div>

        </div>


        <div class="tribe-card-content">

          <span class="tribe-location">
            ${escapeHTML(tribe.province)}
          </span>

          <h3>${escapeHTML(tribe.name)}</h3>

          <p>${escapeHTML(tribe.summary)}</p>

          <button
            class="tribe-button"
            data-tribe="${escapeHTML(tribe.id)}"
          >
            Jelajahi Suku <span>→</span>
          </button>

        </div>

      </article>

    `;

  }).join("");


  searchEmpty.hidden = filteredTribes.length !== 0;

  clearFilter.hidden = (
    !selectedProvince &&
    keyword === ""
  );

  activateImageFallbacks(tribeGrid);

}


/* SEARCH */

searchInput.addEventListener("input", () => {

  renderTribeCards();

});


/* CLEAR FILTER */

clearFilter.addEventListener("click", () => {

  selectedProvince = null;

  searchInput.value = "";

  renderTribeCards();

});


/* =====================================================
   7. OPEN TRIBE DETAIL
   ===================================================== */

function openTribe(tribeId, updateHistory = true) {

  const tribe = tribeData.find((item) => {

    return item.id === tribeId;

  });

  if (!tribe) {

    console.error("Suku tidak ditemukan:", tribeId);

    return;

  }

  selectedTribe = tribeId;

  renderTribeDetail(tribe);

  navigateTo("tribe", updateHistory);

}


/* =====================================================
   8. RENDER RECIPE CARDS
   ===================================================== */

function renderRecipe(recipe, index) {

  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : [];

  const preparation = Array.isArray(recipe.preparation)
    ? recipe.preparation
    : [];

  const sources = Array.isArray(recipe.sourceIds)
    ? recipe.sourceIds
    : [];


  const sourceHTML = sources.length

    ? sources.map((sourceId) => {

        const source = referenceData.find(
          (item) => item.id === sourceId
        );

        if (!source) return "";

        return `
          <span class="source-tag">
            ${escapeHTML(source.author || source.title)}
          </span>
        `;

      }).join("")

    : `
      <span class="source-tag">
        Referensi belum ditautkan
      </span>
    `;


  return `

    <article class="recipe-card">

      <span class="recipe-number">
        RAMUAN ${String(index + 1).padStart(2, "0")}
      </span>


      <h3>${escapeHTML(recipe.name)}</h3>


      <!-- BAHAN -->

      <h4>Bahan-bahan</h4>

      <ul>

        ${ingredients.map((ingredient) => `
          <li>${escapeHTML(ingredient)}</li>
        `).join("")}

      </ul>


      <!-- KEGUNAAN -->

      <div class="recipe-use">

        <h4>Kegunaan Tradisional</h4>

        <p>
          ${escapeHTML(recipe.traditionalUse)}
        </p>

      </div>


      <!-- CARA PENGOLAHAN -->

      <h4>Cara Pengolahan</h4>

      <ol>

        ${preparation.map((step) => `
          <li>${escapeHTML(step)}</li>
        `).join("")}

      </ol>


      <!-- MAKNA BUDAYA -->

      <div class="recipe-culture">

        <h4>Makna Budaya</h4>

        <p>
          ${escapeHTML(recipe.culturalMeaning)}
        </p>

      </div>


      <!-- CATATAN KEAMANAN -->

      <div class="recipe-use">

        <h4>Catatan Keamanan</h4>

        <p>
          ${escapeHTML(
            recipe.safety ||
            "Periksa keamanan setiap bahan berdasarkan sumber yang relevan."
          )}
        </p>

      </div>


      <!-- REFERENSI -->

      <h4>Sumber Informasi</h4>

      <div class="source-tags">
        ${sourceHTML}
      </div>


    </article>

  `;

}


/* =====================================================
   9. RENDER TRIBE DETAIL PAGE
   ===================================================== */

function renderTribeDetail(tribe) {

  const remedies = Array.isArray(tribe.ramuan)
    ? tribe.ramuan
    : [];

  const gallery = Array.isArray(tribe.gallery)
    ? tribe.gallery
    : [];


  const remedyHTML = remedies.length

    ? `

      <div class="recipe-grid">

        ${remedies.map((recipe, index) => {

          return renderRecipe(recipe, index);

        }).join("")}

      </div>

    `

    : `

      <div class="empty-state">

        <h3>Informasi sedang disusun</h3>

        <p>
          Dokumentasi ramuan dari suku ${escapeHTML(tribe.name)}
          sedang dikumpulkan dan akan ditampilkan setelah
          informasi serta sumbernya diverifikasi.
        </p>

      </div>

    `;


  const galleryHTML = gallery.length

    ? `

      <div class="tribe-gallery">

        ${gallery.map((photo) => `

          <figure class="gallery-photo">

            <div class="asset-frame">

              <img
                src="${escapeHTML(photo.src)}"
                alt="${escapeHTML(photo.alt)}"
                loading="lazy"
              >

              <div class="asset-placeholder">
                <span class="placeholder-icon">✳</span>
                <strong>Foto Dokumentasi</strong>
              </div>

            </div>

            <figcaption class="gallery-caption">

              ${escapeHTML(photo.caption)}

            </figcaption>

          </figure>

        `).join("")}

      </div>

    `

    : `

      <div class="empty-state">

        <h3>Galeri belum tersedia</h3>

        <p>
          Dokumentasi gambar akan ditambahkan setelah
          aset dan informasi lisensinya diperiksa.
        </p>

      </div>

    `;


  tribeContent.innerHTML = `


    <!-- BREADCRUMB -->

    <div class="tribe-breadcrumb">

      <button data-page="home">Beranda</button>

      <span>/</span>

      <span>${escapeHTML(tribe.province)}</span>

      <span>/</span>

      <strong>${escapeHTML(tribe.name)}</strong>

    </div>


    <!-- HERO SUKU -->

    <section class="tribe-hero">

      <div>

        <span class="eyebrow">
          PENGETAHUAN TRADISIONAL SUMATERA
        </span>

        <h1>
          ${escapeHTML(tribe.name)}<em>.</em>
        </h1>

        <p>${escapeHTML(tribe.province)}</p>

        <p>${escapeHTML(tribe.summary)}</p>

      </div>


      <div class="tribe-cover asset-frame">

        <img
          src="${escapeHTML(tribe.cover)}"
          alt="Dokumentasi ${escapeHTML(tribe.name)}"
        >

        <div class="asset-placeholder">

          <span class="placeholder-icon">✳</span>

          <strong>${escapeHTML(tribe.name)}</strong>

          <small>Foto budaya atau dokumentasi lokal</small>

        </div>

      </div>

    </section>


    <!-- PENGENALAN BUDAYA -->

    <section class="tribe-story">

      <span class="eyebrow">MENGENAL TRADISI</span>

      <h2>
        Warisan pengetahuan
        <em>masyarakat.</em>
      </h2>

      <p>
        ${escapeHTML(tribe.cultureNote)}
      </p>

    </section>


    <!-- DAFTAR RAMUAN -->

    <section class="tribe-section">

      <div class="tribe-section-heading">

        <span class="eyebrow">DOKUMENTASI HERBAL</span>

        <h2>Ramuan Tradisional</h2>

        <p>
          Informasi mengenai bahan, penggunaan tradisional,
          pengolahan, dan makna budaya.
        </p>

      </div>


      ${remedyHTML}

    </section>


    <!-- GALERI -->

    <section class="tribe-section">

      <div class="tribe-section-heading">

        <span class="eyebrow">DOKUMENTASI VISUAL</span>

        <h2>Galeri Budaya</h2>

        <p>
          Dokumentasi tanaman, bahan, proses pengolahan,
          dan unsur budaya yang relevan.
        </p>

      </div>


      ${galleryHTML}

    </section>


    <!-- DISCLAIMER -->

    <div class="safety-box">

      <span class="safety-icon">!</span>

      <div>

        <h3>Perhatikan Keamanan Penggunaan</h3>

        <p>
          Informasi penggunaan tradisional bukan jaminan
          keamanan atau bukti efektivitas klinis.
          Bahan alami tetap dapat mempunyai risiko.
          Konsultasikan penggunaan herbal dengan tenaga kesehatan.
        </p>

      </div>

    </div>


    <!-- REFERENSI -->

    <section class="tribe-section">

      <div class="tribe-section-heading">

        <span class="eyebrow">SUMBER INFORMASI</span>

        <h2>Referensi Penelitian</h2>

        <p>
          Telusuri sumber informasi yang mendukung
          dokumentasi suku ini.
        </p>

      </div>

      <button
        class="button button-outline"
        data-page="references"
      >
        Lihat Daftar Referensi →
      </button>

    </section>


  `;


  activateImageFallbacks(tribeContent);

}


/* =====================================================
   10. RENDER REFERENCES
   ===================================================== */

function renderReferences() {

  const filteredReferences = referenceData.filter((ref) => {

    return (
      selectedReferenceCategory === "all" ||
      ref.category === selectedReferenceCategory
    );

  });


  if (filteredReferences.length === 0) {

    referenceList.innerHTML = `

      <div class="empty-state">

        <h3>Referensi sedang dikumpulkan</h3>

        <p>
          Daftar referensi akan ditampilkan setelah
          tim menyelesaikan proses pengumpulan dan
          verifikasi sumber informasi.
        </p>

      </div>

    `;

    return;

  }


  referenceList.innerHTML = filteredReferences.map(
    (ref, index) => {

      const linkHTML = ref.url

        ? `
          <a
            class="reference-link"
            href="${escapeHTML(ref.url)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Buka Sumber ↗
          </a>
        `

        : "";


      return `

        <article class="reference-card">

          <span class="reference-index">
            ${String(index + 1).padStart(2, "0")}
          </span>


          <div>

            <h3>${escapeHTML(ref.title)}</h3>

            <p>
              ${escapeHTML(ref.author)}
              · ${escapeHTML(ref.year)}
              · ${escapeHTML(ref.publisher)}
            </p>

          </div>


          <div>

            <span class="reference-type">
              ${escapeHTML(ref.category)}
            </span>

            ${linkHTML}

          </div>

        </article>

      `;

    }
  ).join("");

}


/* =====================================================
   11. INITIALIZE
   ===================================================== */

loadWebsiteData();

activateImageFallbacks();

