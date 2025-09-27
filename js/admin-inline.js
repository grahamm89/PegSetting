
const overlay = document.getElementById('adminOverlay');
const tbody = () => document.querySelector('#dataTable tbody');
let suggestedFilename = 'data.json';

// === Auto-Refresh Controls (Admin) ===
function ensureRefreshControls(){
  if (!overlay) return;
  if (document.getElementById('refreshControls')) return;
  const box = document.createElement('div');
  box.id = 'refreshControls';
  box.className = 'card-like';
  box.innerHTML = `
    <h3>Auto-Refresh</h3>
    <div class="refresh-row">
      <span id="swVersionChip" class="chip">SW: —</span>
      <span id="dataHashChip" class="chip">Data: —</span>
      <button id="rfBoost">Boost refresh (15s for 1 min)</button>
    </div>
  `;
  overlay.querySelector('.modal').prepend(box);
}

// Data hash chip support (uses event from app.js)
function updateDataHashChip(h){
  try{
    const el = document.getElementById('dataHashChip');
    if (!el) return;
    let hash = h || (typeof __dataHash !== 'undefined' ? __dataHash : null);
    if (!hash && window.state && Array.isArray(window.state.data)){
      try { hash = btoa(unescape(encodeURIComponent(JSON.stringify(window.state.data)))).slice(0,32); } catch(e){}
    }
    if (!hash) { el.textContent = 'Data: —'; return; }
    const short = String(hash).slice(0,8);
    el.textContent = 'Data: ' + short;
    el.title = 'Hash: ' + hash;
  }catch(e){}
}
window.addEventListener('datahash:updated', (e) => updateDataHashChip(e?.detail?.hash));

// SW version chip
function fetchSwVersion(){
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.getRegistration().then(reg => {
    if (!reg) return;
    const target = (reg.active || reg.waiting || reg.installing);
    if (target) {
      function onMsg(e){
        const d = e.data || {};
        if (d.type === 'SW_VERSION'){
          const el = document.getElementById('swVersionChip');
          if (el) el.textContent = 'SW: ' + d.version;
          navigator.serviceWorker.removeEventListener('message', onMsg);
        }
      }
      navigator.serviceWorker.addEventListener('message', onMsg);
      target.postMessage({type:'GET_VERSION'});
    }
  });
}

// Boost button wiring
function wireBoost(){
  const btn = document.getElementById('rfBoost');
  if (!btn) return;
  const bc = ('BroadcastChannel' in window) ? new BroadcastChannel('peg-settings') : null;
  const ms = 15000, duration = 60000;
  btn.addEventListener('click', () => {
    const until = Date.now() + duration;
    try { localStorage.setItem('refreshOverrideMs', String(ms)); localStorage.setItem('refreshOverrideUntil', String(until)); } catch(e){}
    if (bc) bc.postMessage({type:'refresh-override', ms, until});
    btn.textContent = 'Boost active (1 min)';
    setTimeout(() => btn.textContent = 'Boost refresh (15s for 1 min)', duration + 500);
  });
}

// Overlay open/close
function openOverlay(){
  ensureRefreshControls();
  updateDataHashChip();
  fetchSwVersion();
  overlay.classList.add('show');
  buildTable(window.state.data || []);
}
function closeOverlay(){ overlay.classList.remove('show'); }

// Build / Add / Delete rows
function buildTable(arr){
  const body = tbody();
  body.innerHTML = '';
  (arr || []).forEach((row, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td contenteditable>${row.Product ?? ''}</td>
      <td contenteditable>${row.Method ?? ''}</td>
      <td contenteditable>${row.Pressure ?? ''}</td>
      <td contenteditable>${row.PEG ?? ''}</td>
      <td contenteditable>${row.Dilution ?? ''}</td>
      <td contenteditable>${row.Min ?? ''}</td>
      <td contenteditable>${row.Max ?? ''}</td>
      <td><button class="del">X</button></td>
    `;
    tr.querySelector('.del').addEventListener('click', () => tr.remove());
    body.appendChild(tr);
  });
  wireBoost();
}

function addRow(){
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td contenteditable></td>
    <td contenteditable></td>
    <td contenteditable></td>
    <td contenteditable></td>
    <td contenteditable></td>
    <td contenteditable></td>
    <td contenteditable></td>
    <td><button class="del">X</button></td>
  `;
  tr.querySelector('.del').addEventListener('click', () => tr.remove());
  tbody().appendChild(tr);
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
      Dilution: parseFloat(tds[4].innerText.trim() || '0'),
      Min: tds[5].innerText.trim(),
      Max: tds[6].innerText.trim()
    };
  });
}

// Toolbar actions
document.getElementById('addRow').addEventListener('click', addRow);

document.getElementById('downloadData').addEventListener('click', () => {
  const data = tableToJson();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = suggestedFilename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});

document.getElementById('uploadBtn').addEventListener('click', () => {
  document.getElementById('uploadInput').click();
});

document.getElementById('uploadInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try{
      const parsed = JSON.parse(ev.target.result);
      if (!Array.isArray(parsed)) throw new Error('JSON must be an array');
      buildTable(parsed);
    }catch(err){
      alert('Invalid JSON: ' + err.message);
    }
  };
  reader.readAsText(file, 'utf-8');
  suggestedFilename = file.name || 'data.json';
});

document.getElementById('newVersion').addEventListener('click', () => {
  suggestedFilename = 'data.json';
  buildTable([]);
});

document.getElementById('closeAdmin').addEventListener('click', closeOverlay);

// Keyboard shortcut: double‑tap 'E' → password → open
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
