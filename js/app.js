
// Core app logic: load data.json, populate selectors, and render result
window.state = { data: [] };

const els = {
  product: document.getElementById('product'),
  method: document.getElementById('method'),
  pressure: document.getElementById('pressure'),
  result: document.getElementById('result'),
  stamp: document.getElementById('stamp')
};

function unique(arr, key){ return [...new Set(arr.map(i => i[key]))].filter(Boolean); }
function insertPlaceholder(sel, label){ const o=document.createElement('option'); o.value=''; o.textContent=label||'— Select —'; sel.appendChild(o); }
function populate(sel, values){ if (!sel) return; values.forEach(v => { const o=document.createElement('option'); o.value=v; o.textContent=v; sel.appendChild(o); }); }

function setDisabled(el, disabled, placeholder){
  if (!el) return;
  el.disabled = !!disabled;
  el.innerHTML = '';
  const o = document.createElement('option');
  o.value = '';
  o.textContent = placeholder || '— Select —';
  el.appendChild(o);
}

function updateResult(){
  if (!els.result) return;
  const p = els.product && els.product.value;
  const m = els.method && els.method.value;
  const pr = els.pressure && els.pressure.value;
  if (!p || !m || !pr){ els.result.textContent = 'Select options to see result.'; return; }
  const rows = (window.state.data||[]).filter(r => r.Product===p && r.Method===m && r.Pressure===pr);
  if (!rows.length){ els.result.textContent = 'No match for current selection.'; return; }
  const r = rows[0];
  els.result.innerHTML = `<b>Recommended PEG:</b> ${r.PEG} — <b>Dilution:</b> ${r.Dilution}%`;
}

function rebuildDependentSelectors(){
  const data = window.state.data || [];
  const p = els.product && els.product.value;
  setDisabled(els.method, true, '— Select method —');
  setDisabled(els.pressure, true, '— Select pressure —');
  if (!p) return;
  const filtered = data.filter(r => r.Product === p);
  const methods = [...new Set(filtered.map(r => r.Method))].filter(Boolean);
  const pressures = [...new Set(filtered.map(r => r.Pressure))].filter(Boolean);
  els.method.disabled = false;
  els.pressure.disabled = false;
  methods.forEach(v => { const o=document.createElement('option'); o.value=v; o.textContent=v; els.method.appendChild(o); });
  pressures.forEach(v => { const o=document.createElement('option'); o.value=v; o.textContent=v; els.pressure.appendChild(o); });
}

function initSelectors(){
  const data = window.state.data||[];
  if (els.product){ els.product.innerHTML=''; insertPlaceholder(els.product, '— Select product —'); populate(els.product, unique(data,'Product')); els.product.selectedIndex=0; els.product.value=''; }
  setDisabled(els.method, true, '— Select method —');
  setDisabled(els.pressure, true, '— Select pressure —');
  if (els.product){
    els.product.addEventListener('change', () => {
      rebuildDependentSelectors();
      if (els.method) { els.method.value = ''; els.method.dispatchEvent(new Event('change')); }
      if (els.pressure) { els.pressure.value = ''; els.pressure.dispatchEvent(new Event('change')); }
      updateResult();
    });
  }
  if (els.method) els.method.addEventListener('change', updateResult);
  if (els.pressure) els.pressure.addEventListener('change', updateResult);
  updateResult();
}

// --- data loading & refresh helpers ---
function hashObj(obj){
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).slice(0, 32); }
  catch(e){ return Math.random().toString(36).slice(2); }
}
let __dataHash = null;

async function loadData(){
  try {
    const res = await fetch('data.json?v=' + Date.now(), {cache:'no-store'});
    const arr = await res.json();
    window.state.data = Array.isArray(arr) ? arr : [];
    initSelectors();
    __dataHash = hashObj(arr);
    window.dispatchEvent(new CustomEvent('datahash:updated', { detail: { hash: __dataHash } }));
    if (els.stamp) els.stamp.textContent = 'Updated: ' + new Date().toLocaleString();
  } catch (e){
    console.error('Failed to load data.json', e);
  }
}

// Smart polling (leader tab, visibility-aware, ETag-like using hash)
const bc = ('BroadcastChannel' in window) ? new BroadcastChannel('peg-settings') : null;
let pollTimer = null, baseInterval = 300000, backoff = 1, isLeader = false; // 5 minutes

if (bc) {
  bc.postMessage({ type: 'hello' });
  bc.onmessage = (e) => {
    if (e.data?.type === 'hello' && !isLeader) { /* another tab exists */ }
    if (e.data?.type === 'data:update') {
      window.state.data = e.data.payload;
      initSelectors(); updateResult();
      __dataHash = hashObj(window.state.data);
      window.dispatchEvent(new CustomEvent('datahash:updated', { detail: { hash: __dataHash } }));
      if (els.stamp) els.stamp.textContent = 'Updated: ' + new Date().toLocaleString();
    }
  };
  setTimeout(() => { isLeader = true; }, 800);
} else {
  isLeader = true;
}

async function refreshDataIfChanged(){
  try {
    if (!isLeader || document.hidden || !navigator.onLine) return;
    const res = await fetch('data.json?v=' + Date.now(), {cache:'no-store'});
    if (!res.ok) return;
    const arr = await res.json();
    const newHash = hashObj(arr);
    if (newHash !== __dataHash){
      window.state.data = Array.isArray(arr) ? arr : [];
      __dataHash = newHash;
      initSelectors(); updateResult();
      window.dispatchEvent(new CustomEvent('datahash:updated', { detail: { hash: __dataHash } }));
      if (els.stamp) els.stamp.textContent = 'Updated: ' + new Date().toLocaleString();
      if (bc) bc.postMessage({ type: 'data:update', payload: window.state.data });
    }
  } catch (e){
    backoff = Math.min(backoff * 2, 10);
  }
}

function schedulePoll(){
  clearInterval(pollTimer);
  const saveData = navigator.connection && navigator.connection.saveData;
  const interval = (saveData ? 480000 : baseInterval) * backoff;
  pollTimer = setInterval(refreshDataIfChanged, interval);
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refreshDataIfChanged();
  schedulePoll();
});
window.addEventListener('online', refreshDataIfChanged);

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  schedulePoll();
});
