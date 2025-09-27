
const overlay = document.getElementById('adminOverlay');
const tbody = () => document.querySelector('#dataTable tbody');
let suggestedFilename = 'data.json';

// === Live summary inside admin overlay ===
function ensureAdminSummary(){
  if (!overlay) return null;
  let box = document.getElementById('adminPreviewSummary');
  if (!box){
    box = document.createElement('div');
    box.id = 'adminPreviewSummary';
    box.className = 'minmax';
    const h = document.createElement('h3');
    h.textContent = 'Preview — Range & Recommended PEG';
    box.appendChild(h);
    const content = document.createElement('div');
    content.id = 'adminPreviewContent';
    box.appendChild(content);
    overlay.prepend(box);
  }
  return box;
}

async function loadLimits(){
  try{
    const res = await fetch('limits.json?v=' + Date.now(), {cache:'no-cache'});
    return await res.json();
  }catch(e){
    return [];
  }
}

async function updateAdminSummary(){
  const box = ensureAdminSummary();
  if (!box) return;
  const content = document.getElementById('adminPreviewContent');
  const prod = (document.getElementById('product')||{}).value;
  const method = (document.getElementById('method')||{}).value;
  const pressure = (document.getElementById('pressure')||{}).value;

  // compute recommended from current in-memory table/state
  const rows = (window.state && Array.isArray(window.state.data) ? window.state.data : [])
    .filter(r => r.Product===prod && r.Method===method && r.Pressure===pressure);
  const rec = rows.length ? rows[0] : null;

  // fetch limits and pick for product
  const lims = await loadLimits();
  const mm = (lims||[]).find(x => x.Product === prod);

  let html = '<div class="hint">No selection.</div>';
  if (prod){
    const range = mm ? `${mm.Min} <span class="arrow">→</span> ${mm.Max}` : '—';
    const recText = rec ? ` — Recommended PEG: <b>${rec.PEG||''}</b> ${rec.Dilution!=null? '(at '+rec.Dilution+'%)':''}` : '';
    html = `<div class="summary"><span class="pill">Range</span> ${range}${recText}</div>`;
  }
  content.innerHTML = html;
}

// === ADMIN LIMITS EDITOR (Min/Max) ===
let __limitsCache = []; // array of {Product, Min, Max}

async function __loadLimitsOnce(){
  if (__limitsCache && __limitsCache.length) return __limitsCache;
  try{
    const res = await fetch('limits.json?v=' + Date.now(), {cache:'no-cache'});
    __limitsCache = await res.json();
  }catch(e){
    __limitsCache = [];
  }
  return __limitsCache;
}

function __getLimitFor(product){
  return (__limitsCache || []).find(x => x.Product === product) || null;
}

function __setLimitFor(product, minVal, maxVal){
  const idx = (__limitsCache || []).findIndex(x => x.Product === product);
  if (idx >= 0){
    __limitsCache[idx].Min = minVal;
    __limitsCache[idx].Max = maxVal;
  } else {
    __limitsCache.push({Product: product, Min: minVal, Max: maxVal});
  }
}

function __downloadLimits(){
  const blob = new Blob([JSON.stringify(__limitsCache, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'limits.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function __ensureLimitsEditor(){
  if (!overlay) return;
  let box = document.getElementById('adminLimitsEditor');
  if (box) return box;
  box = document.createElement('div');
  box.id = 'adminLimitsEditor';
  box.className = 'card-like';
  box.innerHTML = `
    <h3>Min/Max for Selected Product</h3>
    <div class="limits-row">
      <label>Product</label>
      <input id="limProduct" type="text" readonly />
    </div>
    <div class="limits-grid">
      <div>
        <label for="limMin">Min</label>
        <input id="limMin" type="text" placeholder="e.g. L (0.8%)" />
      </div>
      <div>
        <label for="limMax">Max</label>
        <input id="limMax" type="text" placeholder="e.g. E (4%)" />
      </div>
    </div>
    <div class="limits-actions">
      <button id="limApply">Add/Update</button>
      <button id="limDownload">Download limits.json</button>
      <span id="limStatus" class="muted"></span>
    </div>
  `;
  // place beneath the preview summary if present, otherwise at top
  const preview = document.getElementById('adminPreviewSummary');
  if (preview && overlay.contains(preview)){
    overlay.insertBefore(box, preview.nextSibling);
  } else {
    overlay.prepend(box);
  }

  // Wire buttons
  box.querySelector('#limApply').addEventListener('click', () => {
    const p = document.getElementById('limProduct').value.trim();
    const minVal = document.getElementById('limMin').value.trim();
    const maxVal = document.getElementById('limMax').value.trim();
    if (!p){ alert('Select a product first.'); return; }
    __setLimitFor(p, minVal, maxVal);
    document.getElementById('limStatus').textContent = 'Saved (in preview). Use "Download limits.json" to export.';
  });
  box.querySelector('#limDownload').addEventListener('click', () => {
    __downloadLimits();
    document.getElementById('limStatus').textContent = 'Downloaded.';
  });
  return box;
}

async function __populateLimitsEditor(){
  await __loadLimitsOnce();
  const prod = (document.getElementById('product')||{}).value || '';
  const row = __getLimitFor(prod) || {Min:'', Max:''};
  const pInput = document.getElementById('limProduct');
  const minInput = document.getElementById('limMin');
  const maxInput = document.getElementById('limMax');
  if (pInput) pInput.value = prod;
  if (minInput) minInput.value = row.Min || '';
  if (maxInput) maxInput.value = row.Max || '';
}

// Refresh editor whenever selection changes
['product','method','pressure'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', __populateLimitsEditor);
});

// re-run summary when selectors change
['product','method','pressure'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', updateAdminSummary);
});


function openOverlay(){
  __ensureLimitsEditor();
  __populateLimitsEditor();
  ensureAdminSummary();
  updateAdminSummary();
  buildTable(state.data || []);
  overlay.style.display = 'flex';
}
function closeOverlay(){ overlay.style.display = 'none'; }

function buildTable(arr){
  const tb = tbody();
  tb.innerHTML = '';
  arr.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td contenteditable>${row.Product ?? ''}</td>
      <td contenteditable>${row.Method ?? ''}</td>
      <td contenteditable>${row.Pressure ?? ''}</td>
      <td contenteditable>${row.PEG ?? ''}</td>
      <td contenteditable>${row.Dilution ?? ''}</td>
      <td><button class="del">X</button></td>
    `;
    tr.querySelector('.del').addEventListener('click', () => tr.remove());
    tb.appendChild(tr);
  });
}

function tableToJson(){
  const rows = Array.from(tbody().querySelectorAll('tr'));
  return rows.map(tr => {
    const tds = tr.querySelectorAll('td');
    return {
      Product: tds[0].innerText.trim(),
      Method: tds[1].innerText.trim(),
      Pressure: tds[2].innerText.trim(),
      PEG: tds[3].innerText.trim(),
      Dilution: parseFloat(tds[4].innerText.trim() || '0')
    };
  });
}

function downloadJson(filename, obj){
  const blob = new Blob([JSON.stringify(obj, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

document.getElementById('addRow').addEventListener('click', () => {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td contenteditable></td>
    <td contenteditable></td>
    <td contenteditable></td>
    <td contenteditable></td>
    <td contenteditable></td>
    <td><button class="del">X</button></td>
  `;
  tr.querySelector('.del').addEventListener('click', () => tr.remove());
  tbody().appendChild(tr);
});

document.getElementById('downloadData').addEventListener('click', () => {
  const data = tableToJson();
  if (window.state) window.state.data = data; // live preview
  downloadJson(suggestedFilename, data);
});

document.getElementById('newVersion').addEventListener('click', () => {
  tbody().innerHTML = '';
  const stamp = new Date().toISOString().replace(/[-:T]/g,'').slice(0,12);
  suggestedFilename = prompt('Filename for new version:', `data-${stamp}.json`) || `data-${stamp}.json`;
});

document.getElementById('uploadBtn').addEventListener('click', () => {
  document.getElementById('uploadInput').click();
});
document.getElementById('uploadInput').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    if (!Array.isArray(json)) throw new Error('JSON must be an array');
    if (window.state) window.state.data = json;
    buildTable(json);
    alert('Loaded JSON into editor. Download to save and upload to GitHub.');
  } catch (err) {
    alert('Invalid JSON: ' + err.message);
  }
});

document.getElementById('closeAdmin').addEventListener('click', closeOverlay);

// Double‑tap 'E' → password → open
let last = 0;
document.addEventListener('keydown', (e) => {
  if ((e.key||'').toLowerCase() === 'e'){
    const now = Date.now();
    if (now - last < 400){
      const pass = prompt('Enter admin password:');
      if (pass === 'apex-admin') openOverlay();
    }
    last = now;
  }
});


/* Update summary live when editing table */
document.addEventListener('input', (e) => {
  const table = document.getElementById('dataTable');
  if (table && table.contains(e.target)){
    // Rebuild state.data for preview and refresh summary
    if (window.state) window.state.data = tableToJson();
    updateAdminSummary();
  }
});
