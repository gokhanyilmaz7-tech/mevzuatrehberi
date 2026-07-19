import"./modulepreload-polyfill-B5Qt9EMX.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))i(e);new MutationObserver(e=>{for(const s of e)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function n(e){const s={};return e.integrity&&(s.integrity=e.integrity),e.referrerPolicy&&(s.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?s.credentials="include":e.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(e){if(e.ep)return;e.ep=!0;const s=n(e);fetch(e.href,s)}})();const d=document.querySelector("#app");d.innerHTML=`
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
  </main>`;const o={sections:[]},a=t=>document.querySelector(t),c=t=>t.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"");function l(t=""){const n=c(t),i=o.sections.filter(e=>c(e.title).includes(n));a("#section-count").textContent=`${i.length}/${o.sections.length}`,a("#section-list").innerHTML=i.length?i.map(e=>`
    <button class="section-item" data-id="${e.id}" type="button">
      <span class="section-number">${String(o.sections.indexOf(e)+1).padStart(2,"0")}</span>
      <span class="section-name">${e.title}</span><span class="section-arrow">›</span>
    </button>`).join(""):'<p class="empty-state">Aramanızla eşleşen mevzuat yok.</p>',a("#section-list").querySelectorAll("[data-id]").forEach(e=>{e.addEventListener("click",()=>window.open(`/mevzuat.html?id=${encodeURIComponent(e.dataset.id)}`,"_blank"))})}async function u(){const t=await fetch("/manifest.json");if(!t.ok)throw new Error("Mevzuat listesi yüklenemedi.");const n=await t.json();o.sections=n.sections,l()}a("#section-filter").addEventListener("input",t=>l(t.target.value));u().catch(t=>{a("#section-list").innerHTML=`<p class="error-state">${t.message}</p>`});
