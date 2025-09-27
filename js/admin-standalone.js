
const loginBox = document.getElementById('loginBox');
const adminBox = document.getElementById('adminBox');
const tbody = () => document.querySelector('#dataTable tbody');
let suggestedFilename = 'data.json';

document.getElementById('loginBtn').addEventListener('click', async () => {
  const pw = document.getElementById('password').value;
  if (pw !== 'apex-admin'){ alert('Wrong password'); return; }
  loginBox.style.display = 'none';
  adminBox.style.display = 'block';
  try {
    const res = await fetch('data.json?v=' + Date.now(), {cache:'no-cache'});
    const arr = await res.json();
    buildTable(arr);
  } catch { buildTable([]); }
});

function buildTable(arr){
  const tb = tbody();
  tb.innerHTML = '';
  arr.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td contenteditable="true">${row.Product||''}</td>
      <td contenteditable="true">${row.Method||''}</td>
      <td contenteditable="true">${row.Pressure||''}</td>
      <td contenteditable="true">${row.PEG||''}</td>
      <td contenteditable="true">${row.Dilution??''}</td>
      <td contenteditable="true">${row.Min||''}</td>
      <td contenteditable="true">${row.Max||''}</td>
      <td><button class="del">✕</button></td>
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
      <td contenteditable="true">${row.Product||''}</td>
      <td contenteditable="true">${row.Method||''}</td>
      <td contenteditable="true">${row.Pressure||''}</td>
      <td contenteditable="true">${row.PEG||''}</td>
      <td contenteditable="true">${row.Dilution??''}</td>
      <td contenteditable="true">${row.Min||''}</td>
      <td contenteditable="true">${row.Max||''}</td>
      <td><button class="del">✕</button></td>
    `;
  tr.querySelector('.del').addEventListener('click', () => tr.remove());
  tbody().appendChild(tr);
});

document.getElementById('downloadData').addEventListener('click', () => {
  const data = tableToJson();
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
    buildTable(json);
    alert('Loaded JSON. Edit and Download to save.');
  } catch (err) {
    alert('Invalid JSON: ' + err.message);
  }
});


// === Auto-Refresh Controls (Standalone Admin) ===
(function(){
  const bc = ('BroadcastChannel' in window) ? new BroadcastChannel('peg-settings') : null;
  const s = document.getElementById('rfStatusStandalone');
  function setMs(ms){
    try{ localStorage.setItem('refreshWindowMs', String(ms)); }catch(e){}
    if (bc) bc.postMessage({type:'refresh-config', ms});
    if (s) s.textContent = (ms===30000? 'Will refresh ~30s after activity.' : 'Will refresh every 6 hours.');
  }
  const b30 = document.getElementById('rf30s_standalone');
  const b6h = document.getElementById('rf6h_standalone');
  if (b30) b30.addEventListener('click', () => setMs(30000));
  if (b6h) b6h.addEventListener('click', () => setMs(6*60*60*1000));
  const cur = parseInt(localStorage.getItem('refreshWindowMs')||'',10);
  if (!isNaN(cur) && s) s.textContent = (cur===30000? '30s mode.' : Math.round(cur/3600000)+'h mode.');
})();


// Boost in standalone admin
(function(){
  const btn = document.getElementById('rfBoostStandalone');
  const s = document.getElementById('rfStatusStandalone');
  if (!btn) return;
  const bc = ('BroadcastChannel' in window) ? new BroadcastChannel('peg-settings') : null;
  const ms = 15000, duration = 60000;
  btn.addEventListener('click', () => {
    const until = Date.now() + duration;
    try { localStorage.setItem('refreshOverrideMs', String(ms)); localStorage.setItem('refreshOverrideUntil', String(until)); } catch(e){}
    if (bc) bc.postMessage({type:'refresh-override', ms, until});
    if (s) s.textContent = 'Boost active for ~1 minute.';
  });
})();    
