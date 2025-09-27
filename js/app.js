
// Core app logic: load data.json, populate selectors, and render result
window.state = { data: [] };
function relUrl(p){ return new URL(p, location.href).toString(); }
// Determine base path for GitHub Pages
const __parts = location.pathname.split('/').filter(Boolean);
const BASE = __parts.length ? `/${__parts[0]}/` : '/';

const els = {
  product: document.getElementById('product'),
  method: document.getElementById('method'),
  pressure: document.getElementById('pressure'),
  result: document.getElementById('result'),
  stamp: document.getElementById('stamp')
};

function unique(arr, key){ return [...new Set(arr.map(i => i[key]))].filter(Boolean); }
function insertPlaceholder(sel, label){
  const o=document.createElement('option');
  o.value=''; o.textContent=label||'— Select —';
  sel.appendChild(o);
}

function populate(sel, values){
  if (!sel) return;
  sel.innerHTML = '';
  values.forEach(v => { const o=document.createElement('option'); o.value=v; o.textContent=v; sel.appendChild(o); });
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

function initSelectors(){
  const data = window.state.data||[];
  // Product select (active)
  if (els.product){ els.product.innerHTML=''; insertPlaceholder(els.product, '— Select product —'); populate(els.product, unique(data,'Product')); els.product.selectedIndex = 0; els.product.value = ''; }
  // Method & Pressure start disabled until a product is chosen
  setDisabled(els.method, true, '— Select method —');
  setDisabled(els.pressure, true, '— Select pressure —');

  // Listeners
  if (els.product){
    els.product.addEventListener('change', () => { rebuildDependentSelectors(); if (els.method) { els.method.value = ''; els.method.dispatchEvent(new Event('change')); } if (els.pressure) { els.pressure.value = ''; els.pressure.dispatchEvent(new Event('change')); } updateResult(); });
  }
  if (els.method) els.method.addEventListener('change', updateResult);
  if (els.pressure) els.pressure.addEventListener('change', updateResult);

  updateResult();
}

async function loadData(){
  try {
    const res = await fetch(relUrl('data.json') + '?v=' + Date.now(), {cache:'no-store'}), {cache:'no-store'}), {cache:'no-store'}), {cache:'no-cache'});
    const arr = await res.json();
    window.state.data = Array.isArray(arr) ? arr : [];
    initSelectors();
    if (els.stamp) els.stamp.textContent = 'Updated: ' + new Date().toLocaleString();
  } catch (e){
    console.error('Failed to load data.json', e);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  try {
    const res = await fetch(relUrl('data.json') + '?v=' + Date.now(), {cache:'no-store'}), {cache:'no-store'}), {cache:'no-store'}), {cache:'no-store'});
    const arr = await res.json();
    __dataHash = hashObj(arr);
  __dispatchDataHash();
  } catch(e) {}
  // replaced by smarter scheduler
});


function setDisabled(el, disabled, placeholder){
  if (!el) return;
  el.disabled = !!disabled;
  el.innerHTML = '';
  const o = document.createElement('option');
  o.value = '';
  o.textContent = placeholder || '— Select —';
  el.appendChild(o);
}

function rebuildDependentSelectors(){
  const data = window.state.data || [];
  const p = els.product && els.product.value;
  // Reset method & pressure to disabled by default
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


function hashObj(obj){
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).slice(0, 32); }
  catch(e){ return Math.random().toString(36).slice(2); }
}

let __dataHash = null;

async function refreshDataIfChanged(){
  try {
    const res = await fetch(relUrl('data.json') + '?v=' + Date.now(), {cache:'no-store'}), {cache:'no-store'}), {cache:'no-store'}), {cache:'no-store'});
    const arr = await res.json();
    const newHash = hashObj(arr);
    if (newHash !== __dataHash){
      const prev = window.state.data || [];
      window.state.data = Array.isArray(arr) ? arr : [];
      __dataHash = newHash;
      __dispatchDataHash();
      // Try to preserve current selections if still valid
      const p = els.product && els.product.value;
      const m = els.method && els.method.value;
      const pr = els.pressure && els.pressure.value;

      // Rebuild selectors
      initSelectors();

      // Restore selections when possible
      if (p && [...els.product.options].some(o => o.value === p)) els.product.value = p;
      if (m && [...els.method.options].some(o => o.value === m)) els.method.value = m;
      if (pr && [...els.pressure.options].some(o => o.value === pr)) els.pressure.value = pr;

      updateResult();
      if (els.stamp) els.stamp.textContent = 'Updated: ' + new Date().toLocaleString();
      console.log('data.json updated; UI refreshed.');
    }
  } catch (e){
    console.warn('Data refresh check failed', e);
  }
}


// --- Cross-device refresh prompt (refresh.json) ---
let __lastRefreshPromptId = localStorage.getItem('lastRefreshPromptId') || null;

function ensurePromptBanner(){
  let b = document.getElementById('refreshPromptBanner');
  if (b) return b;
  b = document.createElement('div');
  b.id = 'refreshPromptBanner';
  b.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:9999;background:#0b5; color:#fff; padding:10px 14px;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,.25);display:none;';
  b.innerHTML = '<span id="rpMsg">Update available.</span> <button id="rpBtn" style="margin-left:8px;padding:6px 10px;border-radius:8px;border:0;cursor:pointer">Refresh now</button>';
  document.body.appendChild(b);
  return b;
}

async function checkRefreshPrompt(){
  try {
    const res = await fetch('refresh.json?v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return;
    const j = await res.json();
    const id = String(j.id || '');
    const until = parseInt(j.until || 0, 10);
    const now = Date.now();
    if (!id || (until && until < now)) return; // ignore expired/invalid

    if (id !== __lastRefreshPromptId){
      const banner = ensurePromptBanner();
      const msg = (j.message || 'An update is available. Please refresh.');
      document.getElementById('rpMsg').textContent = msg;
      banner.style.display = 'block';
      const btn = document.getElementById('rpBtn');
      btn.onclick = () => {
        try { localStorage.setItem('lastRefreshPromptId', id); } catch(e){}
        location.reload();
      };
      // If action is "force", auto-refresh in 20s with countdown
      if (j.action === 'force'){
        let left = 20;
        const original = msg;
        document.getElementById('rpMsg').textContent = original + ' (refreshing in ' + left + 's)';
        const t = setInterval(() => {
          left -= 1;
          if (left <= 0){ clearInterval(t); btn.click(); return; }
          document.getElementById('rpMsg').textContent = original + ' (refreshing in ' + left + 's)';
        }, 1000);
      }
    }
  } catch (e) {
    // ignore
  }
}



// --- Prompt-if-update scheduler (every 2 hours, visible leader tab only) ---
let __promptTimer = null;

async function swHasUpdateWaiting(){
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.getRegistration) return false;
  try{
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return false;
    // Ask browser to check for an update
    if (reg.update) { try { await reg.update(); } catch(e){} }
    return !!reg.waiting;
  }catch(e){ return false; }
}

async function dataJsonChangedSinceLast(){
  try {
    const res = await fetch('data.json?v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return false;
    const arr = await res.json();
    const newHash = hashObj(arr);
    return (__dataHash && newHash !== __dataHash);
  } catch(e){ return false; }
}

function ensurePromptBanner2(){
  // Reuse the banner from refresh.json feature if present; else create a simple one
  let b = document.getElementById('refreshPromptBanner');
  if (b) return b;
  b = document.createElement('div');
  b.id = 'refreshPromptBanner';
  b.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:9999;background:#0b5; color:#fff; padding:10px 14px;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,.25);display:none;';
  b.innerHTML = '<span id=\"rpMsg\">Update available.</span> <button id=\"rpBtn\" style=\"margin-left:8px;padding:6px 10px;border-radius:8px;border:0;cursor:pointer\">Refresh now</button>';
  document.body.appendChild(b);
  return b;
}

async function promptIfUpdate(){
  // Only the leader tab and only when visible
  if (typeof isLeader !== 'undefined' && !isLeader) return;
  if (document.hidden) return;
  // Check SW + data
  const swWaiting = await swHasUpdateWaiting();
  const dataChanged = await dataJsonChangedSinceLast();
  if (swWaiting || dataChanged){
    const banner = ensurePromptBanner2();
    const msg = swWaiting ? 'A new version is available.' : 'New settings are available.';
    const rpMsg = document.getElementById('rpMsg'); if (rpMsg) rpMsg.textContent = msg + ' Refresh now?';
    banner.style.display = 'block';
    const btn = document.getElementById('rpBtn');
    if (btn && !btn.__wired){
      btn.__wired = true;
      btn.onclick = async () => {
        try {
          // Let the SW take over if waiting
          if ('serviceWorker' in navigator && navigator.serviceWorker.getRegistration){
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg && reg.waiting) reg.waiting.postMessage({type:'SKIP_WAITING'});
          }
        } catch(e){}
        location.reload();
      };
    }
  }
}

function schedulePromptIfUpdate(){
  clearInterval(__promptTimer);
  // Every 2 hours by default
  __promptTimer = setInterval(promptIfUpdate, 2 * 60 * 60 * 1000);
}

// kick off the prompt scheduler, and also check on focus/visibility gain
if (typeof schedulePromptIfUpdate_initialized === 'undefined'){
  var schedulePromptIfUpdate_initialized = true;
  schedulePromptIfUpdate();
  window.addEventListener('focus', promptIfUpdate);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) promptIfUpdate(); });
}


function __dispatchDataHash(){
  try {
    const h = (typeof __dataHash !== 'undefined' && __dataHash) ? __dataHash : hashObj(window.state?.data||[]);
    window.dispatchEvent(new CustomEvent('datahash:updated', { detail: { hash: h } }));
  } catch(e){}
}
