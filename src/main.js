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

const topicVisuals = {
  'mevzuat-1': ['01-6331-law', 'Kanun ve mevzuat dosyası'],
  'mevzuat-2': ['02-building', 'İşyeri binası ve yapı ekipmanı'],
  'mevzuat-3': ['03-equipment', 'İş ekipmanı ve ayar simgesi'],
  'mevzuat-4': ['04-explosive', 'Patlama ve yangın tehlikesi'],
  'mevzuat-5': ['05-chemical', 'Kimyasal laboratuvar şişesi'],
  'mevzuat-6': ['06-construction', 'Yapı ve inşaat ekipmanı'],
  'mevzuat-7': ['07-ppe', 'Koruyucu eldiven'],
  'mevzuat-8': ['08-risk', 'Riskten korunma kalkanı'],
  'mevzuat-9': ['09-emergency', 'Acil durum bildirimi'],
  'mevzuat-10': ['10-signs', 'Güvenlik ve işaret bayrağı'],
  'mevzuat-11': ['11-health', 'İş sağlığı ve kalp sağlığı'],
  'mevzuat-12': ['12-noise', 'Gürültü ve işitme koruması'],
  'mevzuat-13': ['13-vibration', 'Titreşim ve bağlantı dalgaları'],
  'mevzuat-14': ['14-dust', 'Tozla mücadele ve temizlik'],
  'mevzuat-15': ['15-doctor', 'Çalışan sağlığı ve sağlık personeli'],
  'mevzuat-16': ['16-expert', 'Uzmanlık ve eğitim başlığı'],
  'mevzuat-17': ['17-employer', 'İşveren ve çalışma düzeni'],
  'mevzuat-18': ['18-board', 'Kurul ve toplantı notları'],
  'mevzuat-19': ['19-training', 'Mesleki eğitim ve başarı'],
  'mevzuat-20': ['20-education', 'Çalışan eğitimi ve öğrenme'],
  'mevzuat-21': ['21-carcinogen', 'Kanserojen madde laboratuvarı'],
  'mevzuat-22': ['22-biological', 'Biyolojik etken ve risk'],
  'mevzuat-23': ['23-pregnancy', 'Gebe çalışanların korunması'],
  'mevzuat-24': ['24-manual', 'Elle taşıma ve yük'],
  'mevzuat-25': ['25-screen', 'Ekranlı araç ve bilgisayar'],
  'mevzuat-26': ['26-asbestos', 'Asbest ve lifli malzeme'],
  'mevzuat-27': ['27-hygiene', 'İş hijyeni ve laboratuvar'],
  'mevzuat-28': ['28-hours', 'Çalışma süresi ve zaman'],
  'mevzuat-29': ['29-night', 'Gece postası ve çalışma'],
  'mevzuat-30': ['30-temporary', 'Geçici çalışma takvimi'],
  'mevzuat-31': ['31-stop', 'İşin durdurulması ve kilit'],
  'mevzuat-32': ['32-industry', 'Endüstriyel kaza ve grafik'],
  'mevzuat-33': ['33-fishing', 'Balıkçı gemisi ve açık hava'],
  'mevzuat-34': ['34-labour', 'İş Kanunu ve hedef adalet'],
  'mevzuat-35': ['35-international', 'Uluslararası işgücü ve konum'],
};

function visualFor(section) {
  const [name, label] = topicVisuals[section.id] || topicVisuals['mevzuat-1'];
  return {image: `/topic-icons/${name}.webp`, label};
}

function renderSections(filter = '') {
  const needle = normalize(filter);
  const visible = state.sections.filter((section) => normalize(section.title).includes(needle));
  $('#section-count').textContent = `${visible.length}/${state.sections.length}`;
  $('#section-list').innerHTML = visible.length ? visible.map((section) => `
    ${(() => { const visual = visualFor(section); return `<button class="section-item" data-id="${section.id}" type="button"><span class="section-visual"><img src="${visual.image}" alt="${visual.label}" loading="lazy" /></span><span class="section-number">${String(state.sections.indexOf(section) + 1).padStart(2, '0')}</span><span class="section-name">${section.title}</span><span class="section-arrow">›</span></button>`; })()}
    `).join('') : '<p class="empty-state">Aramanızla eşleşen mevzuat yok.</p>';
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
