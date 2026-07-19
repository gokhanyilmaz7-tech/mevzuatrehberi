import './styles.css';

const app = document.querySelector('#app');
app.innerHTML = `
  <header class="topbar">
    <div class="brand-mark">M</div>
    <div><p class="eyebrow">TEFTİŞ DAYANAKLARI</p><h1>Mevzuat Rehberi</h1></div>
    <div class="topbar-meta"><span class="status-dot"></span><span>Yerel mevzuat arşivi</span></div>
  </header>
  <main class="layout">
    <aside class="sidebar">
      <div class="sidebar-heading"><div><p class="eyebrow">İÇİNDEKİLER</p><h2>Mevzuat</h2></div><span class="count-badge" id="section-count">—</span></div>
      <label class="search-field sidebar-search"><span aria-hidden="true">⌕</span><input id="section-filter" type="search" placeholder="Mevzuat ara…" autocomplete="off" /></label>
      <nav id="section-list" class="section-list" aria-label="Mevzuat listesi"></nav>
    </aside>
    <section class="content">
      <div class="welcome"><div class="welcome-icon">§</div><p class="eyebrow">DAYANAKLAR (GENEL)</p><h2>Bir mevzuat seçin</h2><p>Soldaki listeden bir kanun veya yönetmelik seçin. İçerik, okunabilir ve kolay kopyalanabilir ayrı bir sekmede açılır.</p></div>
    </section>
  </main>`;

const state = {sections: []};
const $ = (selector) => document.querySelector(selector);
const normalize = (value) => value.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function renderSections(filter = '') {
  const needle = normalize(filter);
  const visible = state.sections.filter((section) => normalize(section.title).includes(needle));
  $('#section-count').textContent = `${visible.length}/${state.sections.length}`;
  $('#section-list').innerHTML = visible.length ? visible.map((section) => `
    <button class="section-item" data-id="${section.id}" type="button">
      <span class="section-visual"><img src="/thumbnails/${section.id}.png" alt="${section.title} ilk sayfa önizlemesi" loading="lazy" /></span>
      <span class="section-number">${String(state.sections.indexOf(section) + 1).padStart(2, '0')}</span>
      <span class="section-name">${section.title}</span><span class="section-arrow">›</span>
    </button>`).join('') : '<p class="empty-state">Aramanızla eşleşen mevzuat yok.</p>';
  $('#section-list').querySelectorAll('[data-id]').forEach((button) => {
    button.addEventListener('click', () => window.open(`/mevzuat.html?id=${encodeURIComponent(button.dataset.id)}`, '_blank'));
  });
}

async function loadManifest() {
  const response = await fetch('/manifest.json');
  if (!response.ok) throw new Error('Mevzuat listesi yüklenemedi.');
  const manifest = await response.json();
  state.sections = manifest.sections;
  renderSections();
}

$('#section-filter').addEventListener('input', (event) => renderSections(event.target.value));
loadManifest().catch((error) => { $('#section-list').innerHTML = `<p class="error-state">${error.message}</p>`; });
