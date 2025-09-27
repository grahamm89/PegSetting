
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
      <button id="rfBoost">Boost refresh (15s for 1 min)</button>
      <span id="rfStatus" class="muted"></span>
    </div>
  `;
  overlay.prepend(box);
}


// === Admin: Refresh Now control ===
function ensureRefreshNowControl(){
  if (!overlay) return;
  if (document.getElementById('rfNow')) return;
  const box = document.createElement('div');
  box.className = 'card-like';
  box.innerHTML = '<h3>Refresh</h3>';
  overlay.prepend(box);

  const bc = ('BroadcastChannel' in window) ? new BroadcastChannel('peg-settings') : null;
  box.querySelector('#rfNow').addEventListener('click', async () => {
    if (bc) bc.postMessage({type:'force-refresh'});
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && (reg.active || reg.waiting)) {
        (reg.waiting || reg.active).postMessage({type:'ADMIN_FORCE_REFRESH'});
      }
    } catch(e){}
    location.reload();
  });
}


// === Auto-Refresh Controls (Admin) ===
function ensureRefreshControls(){
  if (!overlay) return;
  let box = document.getElementById('refreshControls');
  if (box) return box;
  box = document.createElement('div');
  box.id = 'refreshControls';
  box.className = 'card-like';
  box.innerHTML = `
    <h3>Auto-Refresh</h3>
    <div class="refresh-row">
      
      
      <span id="rfStatus" class="muted"></span>
    </div>
  `;
  overlay.prepend(box);

  const bc = ('BroadcastChannel' in window) ? new BroadcastChannel('peg-settings') : null;
  function setMs(ms){
    try{ localStorage.setItem('refreshWindowMs', String(ms)); }catch(e){}
    if (bc) bc.postMessage({type:'refresh-config', ms});
    const s = document.getElementById('rfStatus');
    if (s) s.textContent = (ms===30000? 'Will refresh ~30s after activity.' : 'Will refresh every 6 hours.');
  }
  document.getElementById('rf30s').addEventListener('click', () => setMs(30000));
  document.getElementById('rf6h').addEventListener('click', () => setMs(6*60*60*1000));
  // initialize status
  const cur = parseInt(localStorage.getItem('refreshWindowMs')||'',10);
  if (!isNaN(cur)) { const s = document.getElementById('rfStatus'); if (s) s.textContent = (cur===30000? '30s mode.' : Math.round(cur/3600000)+'h mode.'); }
  return box;
}


function openOverlay(){
  ensureRefreshControls();
  ensureRefreshNowControl();
  ensureRefreshControls();
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
      <td contenteditable>${row.Min ?? ''}</td>
      <td contenteditable>${row.Max ?? ''}</td>
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
    Dilution: parseFloat(tds[4].innerText.trim() || '0'),
    Min: tds[5].innerText.trim(),
    Max: tds[6].innerText.trim()
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
