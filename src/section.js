import './section.css';

const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const title = document.querySelector('#title');
const meta = document.querySelector('#meta');
const content = document.querySelector('#content');
const search = document.querySelector('#search');
const resultCount = document.querySelector('#result-count');
let blocks = [];
let matches = [];
let matchIndex = -1;

function escapeHtml(value) { return value.replace(/[&<>"']/g, (character) => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'}[character])); }
function normalize(value) { return value.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function compact(value) { return normalize(value).replace(/\s+/g, ''); }
function color(values) { return `rgb(${values.map((value) => Math.round(Number(value || 0) * 255)).join(', ')})`; }

function mergeWordFragments(words) {
  const merged = [];
  words.slice().sort((a, b) => a.x - b.x).forEach((word) => {
    const previous = merged[merged.length - 1];
    if (!previous) { merged.push({...word}); return; }
    const gap = word.x - (previous.x + previous.w);
    const joinsAtZeroGap = gap <= 0.75;
    const joinsSpacedLetters = gap <= 8 && previous.text.length <= 1 && word.text.length <= 1;
    if (joinsAtZeroGap || joinsSpacedLetters) {
      previous.text += word.text;
      previous.w = Math.max(previous.x + previous.w, word.x + word.w) - previous.x;
      previous.color = previous.color || word.color;
      previous.bold = previous.bold || word.bold;
      previous.italic = previous.italic || word.italic;
    } else merged.push({...word});
  });
  return merged;
}

function formatLayoutPage(page, totalPages) {
  const scale = 96 / 72;
  const isChemicalTablePage = page.page >= 391 && page.page <= 400;
  // 12 punto metnin hücrelere rahat oturması için yalnızca Ek-1/Ek-2
  // tablolarının koordinatlarını ve satır aralıklarını büyütüyoruz.
  const xScale = isChemicalTablePage ? scale * 1.45 : scale;
  const yScale = isChemicalTablePage ? scale * 1.28 : scale;
  const tableColumns = [71.068, 116.515, 167.617, 259.648, 326.629, 359.543, 397.007, 427.101, 464.192, 493.199, 522.512];
  const tableTop = isChemicalTablePage ? Math.min(...(page.lines || []).filter((line) => line.w > 100 && line.h === 0).map((line) => line.y)) : Infinity;
  const alignTableWords = (words, y) => {
    if (!isChemicalTablePage || y < tableTop) return words;
    const aligned = words.map((word) => ({...word}));
    for (let column = 3; column < tableColumns.length - 1; column += 1) {
      const inCell = aligned.filter((word) => {
        const center = word.x + word.w / 2;
        return center >= tableColumns[column] && center <= tableColumns[column + 1];
      });
      if (!inCell.length) continue;
      const left = Math.min(...inCell.map((word) => word.x));
      const right = Math.max(...inCell.map((word) => word.x + word.w));
      const cellCenter = (tableColumns[column] + tableColumns[column + 1]) / 2;
      const shift = cellCenter - (left + right) / 2;
      inCell.forEach((word) => { word.x += shift; });
    }
    return aligned;
  };
  const lines = [];
  page.words.slice().sort((a, b) => a.y - b.y || a.x - b.x).forEach((word) => {
    const line = lines.find((candidate) => Math.abs(candidate.y - word.y) < 2.5);
    if (line) line.words.push(word); else lines.push({y: word.y, words: [word]});
  });
  const lineData = lines.filter((line) => !(line.y > page.height - 70 && line.words.some((word) => word.text === 'Sayfa'))).sort((a, b) => a.y - b.y).map((line, index) => {
    line.words = mergeWordFragments(line.words);
    line.words = alignTableWords(line.words, line.y);
    const previous = lines[index - 1];
    const topGap = previous ? Math.max(0, line.y - previous.y - Math.max(...previous.words.map((word) => word.size))) * yScale : 0;
    const words = line.words.sort((a, b) => a.x - b.x).map((word, wordIndex) => {
      const next = line.words[wordIndex + 1];
      const gap = next ? Math.max(0, next.x - word.x - word.w) * xScale : 0;
      const readableGap = Math.min(gap, 10);
      const displaySize = 12;
      const style = `font-size:${displaySize}pt;font-family:'Times New Roman',Times,serif;font-weight:${word.bold ? 700 : 400};font-style:${word.italic ? 'italic' : 'normal'};color:${color(word.color || [0, 0, 0])};margin-right:${readableGap}px`;
      const separator = next && (next.x - word.x - word.w) > 1.5 ? ' ' : '';
      return `<span class="word" style="${style}">${escapeHtml(word.text)}</span>${separator}`;
    }).join('');
    const colors = line.words.map((word) => word.color || [0, 0, 0]);
    const average = colors.reduce((sum, current) => sum.map((value, index) => value + current[index]), [0, 0, 0]).map((value) => value / colors.length);
    const kind = average[1] > average[0] * 1.5 && average[1] > average[2] * 1.5 ? 'info' : average[0] > average[1] * 1.5 ? 'reference' : 'main';
    const copyHtml = line.words.sort((a, b) => a.x - b.x).map((word, wordIndex) => {
      const next = line.words[wordIndex + 1];
      const separator = next && (next.x - word.x - word.w) > 1.5;
      const style = `font-family:'Times New Roman',Times,serif;font-size:12pt;font-weight:${word.bold ? 700 : 400};font-style:${word.italic ? 'italic' : 'normal'};color:${color(word.color || [0, 0, 0])}`;
      return `<span style="${style}">${escapeHtml(word.text)}</span>${separator ? `<span style="white-space:pre"> </span>` : ''}`;
    }).join('');
    return {kind, words: line.words, y: line.y * yScale, height: Math.max(...line.words.map((word) => word.size)) * 1.6, text: line.words.map((word) => word.text).join(' '), html: `<div class="pdf-line" style="margin-left:${line.words[0].x * xScale}px;margin-top:${topGap}px">${words}</div>`, copyHtml};
  });
  const groups = [];
  lineData.forEach((line) => {
    const current = groups[groups.length - 1];
    const isBoldHeading = line.kind === 'main' && line.words.length > 0 && line.words.every((word) => word.bold) && line.text.length < 160;
    const previousIsBold = current?.lines.at(-1)?.words.every((word) => word.bold);
    if (current && isBoldHeading && !previousIsBold) groups.push({lines: [line]});
    else if (current && line.kind === 'main' && current.lines.some((item) => item.kind !== 'main')) groups.push({lines: [line]});
    else if (current) current.lines.push(line);
    else groups.push({lines: [line]});
  });
  const records = groups.map((group, index) => {
    const annotationOnly = group.lines.every((line) => line.kind === 'reference' || line.kind === 'info');
    const inner = group.lines.map((line) => line.html).join('');
    const copyParts = [];
    let mainRun = [];
    const gap = `<span style="white-space:pre;font-family:'Times New Roman',Times,serif;font-size:12pt"> </span>`;
    const flushMain = () => { if (mainRun.length) { copyParts.push(`<p style="margin:0 0 7pt;line-height:1.35;font-family:'Times New Roman',Times,serif;font-size:12pt;color:#000">${mainRun.join(gap)}</p>`); mainRun = []; } };
    group.lines.forEach((line) => {
      const allBold = line.words.every((word) => word.bold);
      if (line.kind === 'reference' || line.kind === 'info') { flushMain(); const tone = line.kind === 'reference' ? '#ff0000' : '#1db500'; copyParts.push(`<p style="margin:0 0 7pt;line-height:1.35;font-family:'Times New Roman',Times,serif;font-size:12pt;color:${tone}">${line.copyHtml}</p>`); }
      else if (allBold && line.text.length < 100) { flushMain(); copyParts.push(`<p style="margin:0 0 7pt;line-height:1.35;font-family:'Times New Roman',Times,serif;font-size:12pt;font-weight:700;color:#000">${line.copyHtml}</p>`); }
      else mainRun.push(line.copyHtml);
    });
    flushMain();
    const top = Math.max(0, Math.min(...group.lines.map((line) => line.y)) - 10);
    const bottom = Math.max(...group.lines.map((line) => line.y + line.height)) + 10;
    const exactInner = group.lines.map((line) => `<div class="exact-line" style="left:${line.words[0].x * xScale}px;top:${line.y - top}px">${line.html.replace(/^<div[^>]*>|<\/div>$/g, '')}</div>`).join('');
    const common = `<div class="copy-actions"><button class="copy-provision copy-all" data-copy-mode="all" type="button" title="Bu grubun tamamını biçimli olarak kopyala">Tümünü Kopyala</button><button class="copy-provision copy-single" data-copy-mode="single" type="button" title="Yalnızca bu hükmü biçimli olarak kopyala">Kopyala</button></div><div class="provision-content">`;
    const source = `<div class="copy-html-source">${copyParts.join('')}</div>`;
    const annotationClass = annotationOnly ? ' annotation-card' : '';
    return {flow: `<article class="provision-card${annotationClass}" data-block="${index}">${common}${inner}</div>${source}</article>`, exact: `<article class="provision-card exact-card${annotationClass}" data-block="${index}" style="top:${top}px;height:${bottom - top}px">${common}${exactInner}</div>${source}</article>`};
  });
  const hasFigures = (page.figures || []).length > 0;
  // Ek-1 ve Ek-2, PDF'de gerçek sütun koordinatlarıyla oluşturulmuş tablolardır.
  // Bu sayfaları normal paragraf akışına sokmak sütunları kaydırır; metinleri
  // PDF koordinatlarında tutarak hem tablo görünümünü hem seçilebilirliği koruruz.
  const hasFixedLayout = hasFigures || (page.page >= 391 && page.page <= 400);
  const blocks = (hasFixedLayout ? records.map((record) => record.exact) : records.map((record) => record.flow)).join('');
  const figures = (page.figures || []).map((figure) => `<figure class="embedded-figure" style="left:${figure.x * xScale}px;top:${figure.y * yScale}px;width:${figure.w * xScale}px;height:${figure.h * yScale}px"><img src="/${figure.src}" alt="Mevzuat içindeki şekil veya resim" loading="lazy"></figure>`).join('');
  const rules = hasFixedLayout ? (page.lines || []).map((line) => {
    const width = line.w > 0 ? line.w * xScale : Math.max(0.7, line.width * xScale);
    const height = line.h > 0 ? line.h * yScale : Math.max(0.7, line.width * yScale);
    return `<span class="pdf-rule" style="left:${line.x * xScale}px;top:${line.y * yScale}px;width:${width}px;height:${height}px;background:${color(line.color || [0.65, 0.65, 0.65])}"></span>`;
  }).join('') : '';
  return `<section class="article-page" data-page="${page.page}" data-text="${escapeHtml(page.text)}">
    <div class="page-marker">Sayfa ${page.page} / ${totalPages}</div>
    <div class="layout-page ${hasFixedLayout ? 'exact-page' : ''} ${isChemicalTablePage ? 'chemical-table-page' : ''}" ${isChemicalTablePage ? 'style="min-height:1350px"' : ''} aria-label="Mevzuat sayfası ${page.page}"><div class="word-layer">${rules}${blocks}${figures}</div><div class="page-footer" aria-hidden="true">Sayfa ${page.page} / ${totalPages}</div></div>
  </section>`;
}

function render(query = '') {
  const needle = compact(query.trim());
  blocks.forEach((block) => {
    const found = needle && compact(block.text).includes(needle);
    block.element.classList.toggle('match-page', Boolean(found));
    block.element.querySelectorAll('.search-hit').forEach((word) => word.classList.remove('search-hit'));
    if (needle && found) {
      block.element.querySelectorAll('.word').forEach((word) => { if (compact(word.textContent).includes(needle)) word.classList.add('search-hit'); });
    }
  });
  matches = blocks.filter((block) => block.element.classList.contains('match-page'));
  matchIndex = matches.length ? 0 : -1;
  resultCount.textContent = query.trim() ? `${matches.length} sayfa` : '';
  if (matches.length) matches[0].element.scrollIntoView({behavior: 'smooth', block: 'center'});
}

async function copyProvision(button) {
  const card = button.closest('.provision-card');
  const groupId = button.dataset.copyMode === 'all' ? card.dataset.copyGroup : '';
  const cards = groupId ? [...document.querySelectorAll(`.provision-card[data-copy-group="${groupId}"]`)] : [card];
  const sources = cards.map((item) => item.querySelector('.copy-html-source')).filter(Boolean);
  const html = `<div style="font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.35">${sources.map((source) => source.innerHTML).join('')}</div>`;
  const plain = sources.map((source) => source.innerText).join('\n\n');
  if (navigator.clipboard && window.ClipboardItem) {
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], {type: 'text/html'}),
        'text/plain': new Blob([plain], {type: 'text/plain'}),
      })]);
      button.textContent = 'Kopyalandı';
      setTimeout(() => { button.textContent = button.dataset.defaultLabel || 'Kopyala'; }, 1200);
      return;
    } catch (error) { /* Safari izin vermezse aşağıdaki yerel seçim yöntemi kullanılır. */ }
  }
  const buffer = document.querySelector('#copy-buffer') || document.body.appendChild(Object.assign(document.createElement('div'), {id: 'copy-buffer', contentEditable: 'true'}));
  buffer.innerHTML = html;
  buffer.style.cssText = "position:fixed;left:-10000px;top:0;width:900px;background:#fff;color:#000;font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.35;";
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(buffer);
  selection.removeAllRanges();
  selection.addRange(range);
  try { document.execCommand('copy'); } finally { selection.removeAllRanges(); }
  button.textContent = 'Kopyalandı';
  setTimeout(() => { button.textContent = button.dataset.defaultLabel || 'Kopyala'; }, 1200);
}

function moveResult(direction) {
  if (!matches.length) return;
  matchIndex = (matchIndex + direction + matches.length) % matches.length;
  matches[matchIndex].element.scrollIntoView({behavior: 'smooth', block: 'center'});
}

function linkCrossPageAnnotations() {
  const pages = [...content.querySelectorAll('.article-page')];
  pages.forEach((page, index) => {
    if (!index) return;
    const previousCard = pages[index - 1].querySelector('.provision-card:last-of-type');
    const annotationCard = page.querySelector('.provision-card:first-of-type.annotation-card');
    if (!previousCard || !annotationCard || previousCard.classList.contains('annotation-card')) return;
    const groupId = `cross-page-provision-${index}`;
    previousCard.dataset.copyGroup = groupId;
    annotationCard.dataset.copyGroup = groupId;
    annotationCard.querySelector('.copy-provision').title = 'Bu hükmün dayanak ve bilgi notu ile birlikte tamamını kopyala';
    previousCard.querySelector('.copy-provision').title = 'Bu hükmü dayanak ve bilgi notu ile birlikte tamamını kopyala';
  });
}

function linkLongProvisions() {
  if (id !== 'mevzuat-28') return;
  const cards = [...content.querySelectorAll('.provision-card')];
  const groups = [
    {
      id: 'long-provision-madde-4',
      start: 'Günde azami yedi buçuk saat çalışılabilecek işler',
      end: 'madde 4/1)',
      title: 'Madde 4 hükmünün tamamını ve dayanağını kopyala',
    },
    {
      id: 'long-provision-madde-5',
      start: 'Günde yedi buçuk saatten daha az çalışılması gereken işler',
      end: 'madde 5/1)',
      title: 'Madde 5 hükmünün tamamını ve dayanağını kopyala',
    },
  ];
  groups.forEach((group) => {
    const startText = compact(group.start);
    const endText = compact(group.end);
    let active = false;
    let firstCard = null;
    cards.forEach((card) => {
      const cardText = compact(card.innerText);
      if (!active && cardText.includes(startText)) {
        active = true;
        firstCard = card;
      }
      if (!active) return;
      card.dataset.copyGroup = group.id;
      const allButton = card.querySelector('.copy-all');
      if (allButton) {
        allButton.setAttribute('title', group.title);
        allButton.textContent = 'Tümünü Kopyala';
        allButton.dataset.defaultLabel = 'Tümünü Kopyala';
      }
      if (cardText.includes(endText)) active = false;
    });
  });
}

async function load() {
  if (!id) throw new Error('Mevzuat seçilmedi.');
  const response = await fetch(`/sections/${id}.json`);
  if (!response.ok) throw new Error('Mevzuat içeriği yüklenemedi.');
  const data = await response.json();
  // PDF'nin 391-400. sayfalarında başlayan yeşil kimyasal bilgi notu,
  // 6735 sayılı Kanun'un altında görünmemeli; Kimyasal Maddeler Yönetmeliği
  // bölümünün sonunda gösterilmelidir. Sayfa numaraları global PDF numarasıdır.
  let sectionPages = data.pages;
  if (id === 'mevzuat-35') {
    sectionPages = sectionPages.filter((page) => page.page < 391);
  }
  if (id === 'mevzuat-5') {
    const chemicalNoteResponse = await fetch('/sections/mevzuat-35.json');
    if (!chemicalNoteResponse.ok) throw new Error('Kimyasal bilgi notu yüklenemedi.');
    const chemicalNote = await chemicalNoteResponse.json();
    sectionPages = [
      ...sectionPages,
      ...chemicalNote.pages.filter((page) => page.page >= 391),
    ];
  }
  const pages = await Promise.all(sectionPages.map((page) => fetch(`/layout/page-${String(page.page).padStart(3, '0')}.json`).then((result) => result.json())));
  title.textContent = data.title;
  document.title = data.title;
  meta.textContent = `${pages.length} sayfa · PDF ile aynı sayfa sırası ve yerleşim`;
  content.innerHTML = pages.map((page) => formatLayoutPage(page, 400)).join('');
  linkCrossPageAnnotations();
  linkLongProvisions();
  blocks = pages.map((page, index) => ({text: page.text, element: content.children[index]}));
  content.querySelectorAll('.copy-provision').forEach((button) => button.addEventListener('click', () => copyProvision(button)));
}

document.addEventListener('copy', (event) => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.anchorNode) return;
  const container = selection.anchorNode.parentElement?.closest('.provision-content');
  if (!container || !event.clipboardData) return;
  const fragment = selection.getRangeAt(0).cloneContents();
  const wrapper = document.createElement('div');
  wrapper.append(fragment);
  wrapper.querySelectorAll('.pdf-line').forEach((line) => { line.removeAttribute('style'); line.style.cssText = "margin:0 0 4pt;line-height:1.35;font-family:'Times New Roman',Times,serif;font-size:12pt;"; });
  wrapper.querySelectorAll('.exact-line').forEach((line) => { line.removeAttribute('style'); line.style.cssText = "margin:0 0 4pt;line-height:1.35;font-family:'Times New Roman',Times,serif;font-size:12pt;"; });
  wrapper.querySelectorAll('.word').forEach((word) => { word.removeAttribute('class'); word.style.fontFamily = "'Times New Roman', Times, serif"; word.style.fontSize = '12pt'; word.style.marginRight = ''; });
  event.preventDefault();
  event.clipboardData.setData('text/html', `<div style="font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.35">${wrapper.innerHTML}</div>`);
  event.clipboardData.setData('text/plain', selection.toString());
});

search.addEventListener('input', (event) => render(event.target.value));
document.querySelector('#previous').addEventListener('click', () => moveResult(-1));
document.querySelector('#next').addEventListener('click', () => moveResult(1));
load().catch((error) => { title.textContent = 'Yüklenemedi'; content.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`; });
