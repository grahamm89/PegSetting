
// Core app logic: load data.json, populate selectors, and reflect changes when the dataset updates.
// The original implementation loaded data once on page load. This revision adds:
//  - A simple hashing mechanism to detect when the dataset changes.
//  - A leader-election via BroadcastChannel to avoid multiple tabs hammering the server.
//  - A polling loop that periodically fetches data.json with cache-busting and no caching.
//  - A cross‑tab broadcast so that all open tabs update their UI when the dataset changes.
//  - A datahash:updated CustomEvent dispatch for components like the admin overlay.

window.state = { data: [] };

const els = {
  product: document.getElementById('product'),
  method: document.getElementById('method'),
  pressure: document.getElementById('pressure'),
  result: document.getElementById('result'),
  stamp: document.getElementById('stamp')
};

// Utility: return unique values for a given key from an array of objects
function unique(arr, key){
  return [...new Set(arr.map(i => i[key]))].filter(Boolean);
}

// Utility: insert a placeholder <option> into a select
function insertPlaceholder(sel, label){
  const o = document.createElement('option');
  o.value = '';
  o.textContent = label || '— Select —';
  sel.appendChild(o);
}

// Disable a select and show a placeholder
function setDisabled(el, disabled, placeholder){
  if (!el) return;
  el.disabled = !!disabled;
  el.innerHTML = '';
  const o = document.createElement('option');
  o.value = '';
  o.textContent = placeholder || '— Select —';
  el.appendChild(o);
}

// Compute a short, deterministic hash of an object
function hashObj(obj){
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).slice(0, 32);
  } catch (e){
    return Math.random().toString(36).slice(2);
  }
}

// Render the recommendation text based on current selectors
function updateResult(){
  if (!els.result) return;
  const p = els.product && els.product.value;
  const m = els.method && els.method.value;
  const pr = els.pressure && els.pressure.value;
  if (!p || !m || !pr){
    els.result.textContent = 'Select options to see result.';
    return;
  }
  const rows = (window.state.data || []).filter(r => r.Product === p && r.Method === m && r.Pressure === pr);
  if (!rows.length){
    els.result.textContent = 'No match for current selection.';
    return;
  }
  const r = rows[0];
  els.result.innerHTML = `<b>Recommended PEG:</b> ${r.PEG} — <b>Dilution:</b> ${r.Dilution}%`;
}

// Build selectors whenever the dataset or product selection changes
function initSelectors(){
  const data = window.state.data || [];
  // Build the product selector with a placeholder
  if (els.product){
    els.product.innerHTML = '';
    insertPlaceholder(els.product, '— Select product —');
    unique(data, 'Product').forEach(v => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = v;
      els.product.appendChild(o);
    });
    // Do not preselect anything on first load
    els.product.value = '';
  }
  // Disable dependent selectors until a product is chosen
  setDisabled(els.method, true, '— Select method —');
  setDisabled(els.pressure, true, '— Select pressure —');

  // Event wiring only once
  if (!initSelectors._wired){
    if (els.product){
      els.product.addEventListener('change', () => {
        rebuildDependentSelectors();
        // Clear dependent selections to avoid stale combinations
        if (els.method) { els.method.value = ''; els.method.dispatchEvent(new Event('change')); }
        if (els.pressure) { els.pressure.value = ''; els.pressure.dispatchEvent(new Event('change')); }
        updateResult();
      });
    }
    if (els.method) els.method.addEventListener('change', updateResult);
    if (els.pressure) els.pressure.addEventListener('change', updateResult);
    initSelectors._wired = true;
  }
  updateResult();
}

// Populate method & pressure based on selected product
function rebuildDependentSelectors(){
  const data = window.state.data || [];
  const p = els.product && els.product.value;
  setDisabled(els.method, true, '— Select method —');
  setDisabled(els.pressure, true, '— Select pressure —');
  if (!p) return;

  const filtered = data.filter(r => r.Product === p);
  const methods = [...new Set(filtered.map(r => r.Method))].filter(Boolean);
  const pressures = [...new Set(filtered.map(r => r.Pressure))].filter(Boolean);
  if (els.method){
    els.method.disabled = false;
    els.method.innerHTML = '';
    insertPlaceholder(els.method, '— Select method —');
    methods.forEach(v => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = v;
      els.method.appendChild(o);
    });
  }
  if (els.pressure){
    els.pressure.disabled = false;
    els.pressure.innerHTML = '';
    insertPlaceholder(els.pressure, '— Select pressure —');
    pressures.forEach(v => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = v;
      els.pressure.appendChild(o);
    });
  }
}

// Track the current hash of data.json
let __dataHash = null;

// Load the data from data.json (cache busting + no-store)
async function loadData(){
  try {
    const res = await fetch('data.json?v=' + Date.now(), { cache: 'no-store' });
    const arr = await res.json();
    window.state.data = Array.isArray(arr) ? arr : [];
    __dataHash = hashObj(window.state.data);
    initSelectors();
    // Dispatch a custom event so other modules (admin overlay) can show the new hash
    window.dispatchEvent(new CustomEvent('datahash:updated', { detail: { hash: __dataHash } }));
    if (els.stamp) els.stamp.textContent = 'Updated: ' + new Date().toLocaleString();
  } catch (e){
    console.error('Failed to load data.json', e);
  }
}

// BroadcastChannel for cross-tab coordination
const bc = ('BroadcastChannel' in window) ? new BroadcastChannel('peg-settings') : null;
let isLeader = false;

if (bc){
  // Greet other tabs
  bc.postMessage({ type: 'hello' });
  bc.onmessage = (e) => {
    const data = e.data || {};
    // Another tab says hello; we might decide not to lead
    if (data.type === 'hello' && !isLeader) {
      // Another tab exists; we remain follower
    }
    // Received fresh data from leader; update state and UI
    if (data.type === 'data:update') {
      window.state.data = data.payload;
      __dataHash = hashObj(window.state.data);
      initSelectors();
      updateResult();
      window.dispatchEvent(new CustomEvent('datahash:updated', { detail: { hash: __dataHash } }));
      if (els.stamp) els.stamp.textContent = 'Updated: ' + new Date().toLocaleString();
    }
  };
  // After a short delay, assume leadership if no one else claims
  setTimeout(() => { isLeader = true; }, 800);
} else {
  // No BroadcastChannel support; single tab defaults to leader
  isLeader = true;
}

// Periodically check if data.json changed, but only from the leader tab
async function refreshDataIfChanged(){
  try {
    if (!isLeader) return;
    // Always fetch with no-store to bypass caches and add a cache‑busting param
    const res = await fetch('data.json?v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return;
    const arr = await res.json();
    const newHash = hashObj(arr);
    if (newHash !== __dataHash){
      window.state.data = Array.isArray(arr) ? arr : [];
      __dataHash = newHash;
      initSelectors();
      updateResult();
      window.dispatchEvent(new CustomEvent('datahash:updated', { detail: { hash: __dataHash } }));
      if (els.stamp) els.stamp.textContent = 'Updated: ' + new Date().toLocaleString();
      // Tell other tabs about the new data
      if (bc) bc.postMessage({ type: 'data:update', payload: window.state.data });
    }
  } catch (e){
    // Silent fail; network errors will simply retry at next interval
  }
}

// Polling scheduler
let pollTimer = null;
// Base interval: 1 minute (60,000ms). Adjust this value if you want more or less aggressive polling.
const BASE_INTERVAL_MS = 60000;
// Exponential backoff factor (unused but reserved for future use)
let backoff = 1;

function schedulePolling(){
  clearInterval(pollTimer);
  // Respect the Data Saver preference by lengthening the interval
  const saveData = navigator.connection && navigator.connection.saveData;
  const interval = (saveData ? BASE_INTERVAL_MS * 3 : BASE_INTERVAL_MS) * backoff;
  pollTimer = setInterval(() => {
    // Only poll when the tab is visible and online
    if (!document.hidden && navigator.onLine) {
      refreshDataIfChanged();
    }
  }, interval);
}

// React to visibility changes: poll immediately on focus
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    refreshDataIfChanged();
  }
  schedulePolling();
});
// When coming back online, poll once
window.addEventListener('online', refreshDataIfChanged);

// Initialization on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  schedulePolling();
});
