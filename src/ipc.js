import './ipc.css';

const table = document.querySelector('#ipc-table');
const tbody = table.querySelector('tbody');
const search = document.querySelector('#ipc-search');
const result = document.querySelector('#ipc-result');
const status = document.querySelector('#ipc-status');
const copyButton = document.querySelector('#ipc-copy');
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[character]));
const formatCell = (value) => {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value);
  return String(value).replace(/\s+/g, ' ').trim();
};
const isHeaderRepeat = (row) => row[0] === 'Kanun Maddesi' || String(row[4] || '').startsWith('10 dan Az') || String(row[4] || '').startsWith('AZ TEHLİKELİ');
const isMajor = (row) => /^MADDE\s+\d+/i.test(String(row[0] || '').trim());

function makeHeader(title) {
  return `<thead><tr class="ipc-title-row"><th colspan="14">${escapeHtml(title)}</th></tr><tr class="ipc-main-head"><th rowspan="3">Kanun Maddesi</th><th rowspan="3">Ceza Mad.</th><th rowspan="3">Kanun Maddesinde Sözü Edilen Fiil</th><th rowspan="3">2026 yılı için uygulanacak temel ceza miktarı<br>(Yeniden Değerleme Oranı %25,49)</th><th colspan="9">2026 Yılında Uygulanacak Ceza Miktarı (TL)</th><th rowspan="3">Açıklamalar</th></tr><tr class="ipc-group-head"><th colspan="3">10'dan Az Çalışanı Olan İşyerleri</th><th colspan="3">10-49 Çalışanı Olan İşyerleri</th><th colspan="3">50 ve Üzeri Çalışanı Olan İşyerleri</th></tr><tr class="ipc-sub-head"><th>AZ TEHLİKELİ<br>(Aynı miktarda)</th><th>TEHLİKELİ<br>(%25 artırılarak)</th><th>ÇOK TEHLİKELİ<br>(%50 artırılarak)</th><th>AZ TEHLİKELİ<br>(Aynı miktarda)</th><th>TEHLİKELİ<br>(%50 artırılarak)</th><th>ÇOK TEHLİKELİ<br>(%100 artırılarak)</th><th>AZ TEHLİKELİ<br>(%50 artırılarak)</th><th>TEHLİKELİ<br>(%100 artırılarak)</th><th>ÇOK TEHLİKELİ<br>(%200 artırılarak)</th></tr></thead>`;
}

function filterRows() {
  const needle = search.value.trim().toLocaleLowerCase('tr-TR');
  let visible = 0;
  tbody.querySelectorAll('tr').forEach((row) => {
    const matches = !needle || row.dataset.rowText.toLocaleLowerCase('tr-TR').includes(needle);
    row.classList.toggle('hidden-row', !matches);
    if (matches) visible += 1;
  });
  result.textContent = needle ? `${visible} satır` : '';
}

function render(rows, title) {
  table.querySelector('thead')?.remove();
  table.querySelector('colgroup')?.remove();
  const columnWidths = [220, 90, 510, 190, ...Array(9).fill(130), 240];
  table.insertAdjacentHTML('afterbegin', `<colgroup>${columnWidths.map((width) => `<col style="width:${width}px">`).join('')}</colgroup>`);
  table.querySelector('tbody').insertAdjacentHTML('beforebegin', makeHeader(title));
  const dataRows = rows.slice(6).filter((row) => !isHeaderRepeat(row) && row.some((cell) => cell !== null && cell !== '')).map((row) => {
    const normalized = [...row];
    if (/^MADDE\s+(92|96|107)\b/i.test(String(normalized[0] || '')) && !normalized.slice(3, 13).some((cell) => typeof cell === 'number')) normalized[3] = 241992;
    return normalized;
  });
  tbody.innerHTML = dataRows.map((row) => `<tr class="ipc-data-row${isMajor(row) ? ' major' : ''}" data-row-text="${escapeHtml(row.map(formatCell).join(' '))}">${row.map((cell) => `<td>${escapeHtml(formatCell(cell))}</td>`).join('')}</tr>`).join('');
  status.textContent = `${dataRows.length} ceza satırı · Excel tablosundan aktarıldı`;
  filterRows();
}

async function copyTable() {
  const html = `<table style="border-collapse:collapse;font-family:'Times New Roman',Times,serif;font-size:12pt">${table.querySelector('thead').outerHTML}${tbody.innerHTML}</table>`;
  const plain = [...table.querySelectorAll('tr:not(.hidden-row)')].map((row) => [...row.children].map((cell) => cell.innerText).join('\t')).join('\n');
  try {
    await navigator.clipboard.write([new ClipboardItem({'text/html': new Blob([html], {type:'text/html'}), 'text/plain': new Blob([plain], {type:'text/plain'})})]);
  } catch (error) {
    const buffer = document.createElement('textarea'); buffer.value = plain; document.body.appendChild(buffer); buffer.select(); document.execCommand('copy'); buffer.remove();
  }
  copyButton.textContent = 'Kopyalandı';
  setTimeout(() => { copyButton.textContent = 'Tabloyu kopyala'; }, 1200);
}

search.addEventListener('input', filterRows);
copyButton.addEventListener('click', copyTable);
fetch('/ipc-2026.json').then((response) => { if (!response.ok) throw new Error('Excel tablosu yüklenemedi.'); return response.json(); }).then((data) => render(data.values, data.values[0][0])).catch((error) => { status.textContent = error.message; });
