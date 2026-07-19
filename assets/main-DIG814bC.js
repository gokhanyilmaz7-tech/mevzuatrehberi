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
  </main>`;const t={sections:[]},n=e=>document.querySelector(e),l=e=>e.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,""),d=[{words:["kişisel koruyucu","iş güvenliği uzmanı","işyeri hekimi"],image:"/figures/page-185-1.png",label:"Baret, iş elbisesi ve koruyucu eldiven kullanan işçi"},{words:["sağlık ve güvenlik işaretleri"],image:"/figures/page-175-1.png",label:"Güvenlik ve yasaklama işareti"},{words:["patlayıcı","büyük endüstriyel"],image:"/figures/page-175-11.png",label:"Patlama tehlikesi işareti"},{words:["kimyasal","kanserojen","asbest","toz"],image:"/figures/page-175-8.png",label:"Zehirli ve tehlikeli madde işareti"},{words:["biyolojik"],image:"/figures/page-263-1.png",label:"Biyolojik risk işareti"},{words:["yapı işleri","iş ekipman"],image:"/figures/page-126-1.png",label:"Yapı işlerinde düşmeye karşı güvenlik görseli"},{words:["acil durum","yangın","işin durdurul"],image:"/figures/page-175-10.png",label:"Yangın tehlikesi işareti"},{words:["gürültü","titreşim"],image:"/figures/page-175-1.png",label:"İş sağlığı ve güvenliği uyarı işareti"}];function p(e){const a=l(e.title);return d.find(s=>s.words.some(i=>a.includes(l(i))))||{image:"/figures/page-185-1.png",label:"İş sağlığı ve güvenliği için koruyucu ekipman"}}function o(e=""){const a=l(e),s=t.sections.filter(i=>l(i.title).includes(a));n("#section-count").textContent=`${s.length}/${t.sections.length}`,n("#section-list").innerHTML=s.length?s.map(i=>`
    ${(()=>{const r=p(i);return`<button class="section-item" data-id="${i.id}" type="button"><span class="section-visual"><img src="${r.image}" alt="${r.label}" loading="lazy" /></span><span class="section-number">${String(t.sections.indexOf(i)+1).padStart(2,"0")}</span><span class="section-name">${i.title}</span><span class="section-arrow">›</span></button>`})()}
    `).join(""):'<p class="empty-state">Aramanızla eşleşen mevzuat yok.</p>',n("#section-list").querySelectorAll("[data-id]").forEach(i=>{i.addEventListener("click",()=>window.open(`/mevzuat.html?id=${encodeURIComponent(i.dataset.id)}`,"_blank"))})}async function u(){const e=await fetch("/manifest.json");if(!e.ok)throw new Error("Mevzuat listesi yüklenemedi.");const a=await e.json();t.sections=a.sections,o()}n("#section-filter").addEventListener("input",e=>o(e.target.value));u().catch(e=>{n("#section-list").innerHTML=`<p class="error-state">${e.message}</p>`});
