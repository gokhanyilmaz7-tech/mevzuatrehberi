(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))s(e);new MutationObserver(e=>{for(const i of e)if(i.type==="childList")for(const c of i.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&s(c)}).observe(document,{childList:!0,subtree:!0});function a(e){const i={};return e.integrity&&(i.integrity=e.integrity),e.referrerPolicy&&(i.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?i.credentials="include":e.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(e){if(e.ep)return;e.ep=!0;const i=a(e);fetch(e.href,i)}})();const p=document.querySelector("#app");p.innerHTML=`
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
  </main>`;const r={sections:[]},o=t=>document.querySelector(t),l=t=>t.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"");function d(t=""){const n=l(t),a=r.sections.filter(s=>l(s.title).includes(n));o("#section-count").textContent=`${a.length}/${r.sections.length}`,o("#section-list").innerHTML=a.length?a.map(s=>`
    <button class="section-item" data-id="${s.id}" type="button">
      <span class="section-number">${String(r.sections.indexOf(s)+1).padStart(2,"0")}</span>
      <span class="section-name">${s.title}</span><span class="section-arrow">›</span>
    </button>`).join(""):'<p class="empty-state">Aramanızla eşleşen mevzuat yok.</p>',o("#section-list").querySelectorAll("[data-id]").forEach(s=>{s.addEventListener("click",()=>window.open(`/mevzuat.html?id=${encodeURIComponent(s.dataset.id)}`,"_blank"))})}async function u(){const t=await fetch("/manifest.json");if(!t.ok)throw new Error("Mevzuat listesi yüklenemedi.");const n=await t.json();r.sections=n.sections,d()}o("#section-filter").addEventListener("input",t=>d(t.target.value));u().catch(t=>{o("#section-list").innerHTML=`<p class="error-state">${t.message}</p>`});
