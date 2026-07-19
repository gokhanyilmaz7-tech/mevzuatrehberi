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
const isNote = (row) => /^\*{1,2}\s|^Not:/i.test(String(row[0] || '').trim());
const isFullWidthNote = (row) => isNote(row) || /^6331 sayılı Kanunun 24\. maddesi gereğince/i.test(String(row[0] || '').trim());

function rowArticleNumber(row) {
  const label = String(row[0] || '').trim();
  const description = String(row[2] || '').trim();
  return (label.match(/^MADDE\s+(\d+)/i) || description.match(/^(\d+)\s*\//))?.[1] || '';
}

function shadeRows(rows) {
  let currentArticle = '';
  let firstTableShade = -1;
  let lastGroup = '';
  return rows.map((row) => {
    const article = rowArticleNumber(row);
    if (article) currentArticle = article;
    if (isNote(row) || /^6331 sayılı Kanunun 24\. maddesi/i.test(String(row[0] || ''))) return 'shade-white';
    if (/^(92|107)$/.test(article) || /^(92|107)$/.test(currentArticle)) return 'shade-gray';
    if (article === '96' || currentArticle === '96') return 'shade-yellow';
    if (currentArticle) {
      const numericArticle = Number(currentArticle);
      if (numericArticle >= 4 && numericArticle <= 30) {
        const groupKey = numericArticle === 26 ? '26' : currentArticle;
        if (groupKey !== lastGroup) {
          lastGroup = groupKey;
          firstTableShade += 1;
        }
        return firstTableShade % 2 === 0 ? 'shade-yellow' : 'shade-gray';
      }
    }
    return 'shade-white';
  });
}

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
  const columnWidths = ['12%', '5%', '20%', '8%', ...Array(9).fill('4.8%'), '11.8%'];
  table.insertAdjacentHTML('afterbegin', `<colgroup>${columnWidths.map((width) => `<col style="width:${width}">`).join('')}</colgroup>`);
  table.querySelector('tbody').insertAdjacentHTML('beforebegin', makeHeader(title));
  const dataRows = rows.slice(6).filter((row) => !isHeaderRepeat(row) && row.some((cell) => cell !== null && cell !== '')).map((row) => {
    const normalized = [...row];
    if (/^MADDE\s+(92|96|107)\b/i.test(String(normalized[0] || '')) && !normalized.slice(3, 13).some((cell) => typeof cell === 'number')) normalized[3] = 241992;
    return normalized;
  });
  const madde96Index = dataRows.findIndex((row) => /^MADDE\s+96\b/i.test(String(row[0] || '')));
  if (madde96Index > 0 && dataRows[madde96Index + 1]) {
    const continuation = dataRows[madde96Index - 1];
    const madde96 = [...dataRows[madde96Index]];
    madde96[1] = dataRows[madde96Index + 1][1] || '107/1-b';
    madde96[2] = continuation[2] || 'İfade ve bilgilerine başvurulan işçilere işverenlerce telkinlerde bulunma, gerçeği saklamaya yahut değiştirmeye zorlama veyahut ilgili makamlara ifade vermeleri üzerine onlara karşı kötü davranışlarda bulunmak.';
    madde96[3] = continuation[3] || 241992;
    dataRows.splice(madde96Index - 1, 3, madde96);
  }
  // Excel'deki dikey olarak birleştirilmiş/boş devam satırlarını tek satırda tut.
  const paragraphC = new Map();
  const madde4Parts = dataRows.slice(0, 2).map((row) => formatCell(row[2])).filter(Boolean);
  if (madde4Parts.length) {
    paragraphC.set(0, madde4Parts);
    dataRows[0][2] = madde4Parts.join(' ');
    dataRows.splice(1, 1);
  }
  if (dataRows[10] && dataRows[11]) {
    dataRows[11].forEach((value, columnIndex) => {
      if (!formatCell(dataRows[10][columnIndex]) && formatCell(value)) {
        dataRows[10][columnIndex] = value;
        dataRows[11][columnIndex] = '';
      }
    });
  }
  const tahliyeParts = dataRows.slice(16, 19).map((row) => formatCell(row[2])).filter(Boolean);
  if (tahliyeParts.length) {
    paragraphC.set(16, tahliyeParts);
    dataRows[16][2] = tahliyeParts.join(' ');
    dataRows.splice(17, 2);
  }
  if (dataRows[13]?.[0]) dataRows[12][0] = dataRows[13][0];
  const shades = shadeRows(dataRows);
  const mergedA = new Map([[12, 14]]);
  const mergedB = new Map([[12, 13]]);
  const mergedC = new Map([[12, 13]]);
  const renderCell = (row, rowIndex, columnIndex) => {
    const mergeMap = columnIndex === 0 ? mergedA : columnIndex === 1 ? mergedB : columnIndex === 2 ? mergedC : null;
    if (mergeMap && [...mergeMap].some(([start, end]) => rowIndex > start && rowIndex <= end)) return '';
    if (mergeMap && mergeMap.has(rowIndex)) {
      const end = mergeMap.get(rowIndex);
      return `<td rowspan="${end - rowIndex + 1}">${escapeHtml(formatCell(row[columnIndex]))}</td>`;
    }
    if (columnIndex === 2 && [...mergedC].some(([start, end]) => rowIndex > start && rowIndex <= end)) return '';
    if (columnIndex === 2 && paragraphC.has(rowIndex)) {
      return `<td>${paragraphC.get(rowIndex).map(escapeHtml).join('<br><br>')}</td>`;
    }
    if (columnIndex === 2 && mergedC.has(rowIndex)) {
      const end = mergedC.get(rowIndex);
      const values = dataRows.slice(rowIndex, end + 1).map((item) => formatCell(item[2])).filter(Boolean);
      return `<td rowspan="${end - rowIndex + 1}">${values.map(escapeHtml).join('<br><br>')}</td>`;
    }
    return `<td>${escapeHtml(formatCell(row[columnIndex]))}</td>`;
  };
  tbody.innerHTML = dataRows.map((row, index) => {
    const fullWidth = isFullWidthNote(row);
    const cells = fullWidth
      ? `<td class="full-width-note" colspan="14">${escapeHtml(formatCell(row[0]))}</td>`
      : row.map((cell, columnIndex) => renderCell(row, index, columnIndex)).join('');
    return `<tr class="ipc-data-row ${shades[index]}${isMajor(row) ? ' major' : ''}" data-row-text="${escapeHtml(row.map(formatCell).join(' '))}">${cells}</tr>`;
  }).join('');
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
