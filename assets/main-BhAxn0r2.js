import"./modulepreload-polyfill-B5Qt9EMX.js";const c=document.querySelector("#app");c.innerHTML=`
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
  </main>`;const t={sections:[]},a=e=>document.querySelector(e),l=e=>e.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"");function o(e=""){const i=l(e),n=t.sections.filter(s=>l(s.title).includes(i));a("#section-count").textContent=`${n.length}/${t.sections.length}`,a("#section-list").innerHTML=n.length?n.map(s=>`
    <button class="section-item" data-id="${s.id}" type="button">
      <span class="section-visual"><img src="/thumbnails/${s.id}.png" alt="${s.title} ilk sayfa önizlemesi" loading="lazy" /></span>
      <span class="section-number">${String(t.sections.indexOf(s)+1).padStart(2,"0")}</span>
      <span class="section-name">${s.title}</span><span class="section-arrow">›</span>
    </button>`).join(""):'<p class="empty-state">Aramanızla eşleşen mevzuat yok.</p>',a("#section-list").querySelectorAll("[data-id]").forEach(s=>{s.addEventListener("click",()=>window.open(`/mevzuat.html?id=${encodeURIComponent(s.dataset.id)}`,"_blank"))})}async function r(){const e=await fetch("/manifest.json");if(!e.ok)throw new Error("Mevzuat listesi yüklenemedi.");const i=await e.json();t.sections=i.sections,o()}a("#section-filter").addEventListener("input",e=>o(e.target.value));r().catch(e=>{a("#section-list").innerHTML=`<p class="error-state">${e.message}</p>`});
