
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
function insertPlaceholder(sel, label){
  const o=document.createElement('option');
  o.value=''; o.textContent=label||'— Select —';
  sel.appendChild(o);
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

async function loadData(){
  try {
    const res = await fetch('data.json?v=' + Date.now(), {cache:'no-cache'});
    const arr = await res.json();
    window.state.data = Array.isArray(arr) ? arr : [];
    __dataHash = hashObj(window.state.data);
    refreshSelectors();
    if (els.stamp) els.stamp.textContent = 'Updated: ' + new Date().toLocaleString();
  } catch (e){
    console.error('Failed to load data.json', e);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  wireSelectorEvents();
  await loadData();
  startDataRefreshScheduler();
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

function hashObj(obj){
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).slice(0, 32); }
  catch(e){ return Math.random().toString(36).slice(2); }
}

let __dataHash = null;

function getCurrentSelection(){
  return {
    product: els.product ? els.product.value : '',
    method: els.method ? els.method.value : '',
    pressure: els.pressure ? els.pressure.value : ''
  };
}

function refreshSelectors({ preserveProduct = false, preserveDependents = false } = {}){
  const data = window.state.data || [];
  const current = getCurrentSelection();
  const desiredProduct = preserveProduct ? current.product : '';
  const desiredMethod = preserveDependents ? current.method : '';
  const desiredPressure = preserveDependents ? current.pressure : '';

  if (els.product){
    const products = unique(data, 'Product');
    els.product.innerHTML = '';
    insertPlaceholder(els.product, '— Select product —');
    products.forEach(v => { const o=document.createElement('option'); o.value=v; o.textContent=v; els.product.appendChild(o); });
    if (desiredProduct && products.includes(desiredProduct)){
      els.product.value = desiredProduct;
    } else {
      els.product.value = '';
    }
  }

  const activeProduct = els.product && els.product.value;
  if (!activeProduct){
    setDisabled(els.method, true, '— Select method —');
    setDisabled(els.pressure, true, '— Select pressure —');
    updateResult();
    return;
  }

  const filtered = data.filter(r => r.Product === activeProduct);
  const methods = [...new Set(filtered.map(r => r.Method))].filter(Boolean);
  const pressures = [...new Set(filtered.map(r => r.Pressure))].filter(Boolean);

  if (els.method){
    els.method.disabled = false;
    els.method.innerHTML = '';
    insertPlaceholder(els.method, '— Select method —');
    methods.forEach(v => { const o=document.createElement('option'); o.value=v; o.textContent=v; els.method.appendChild(o); });
    if (desiredMethod && methods.includes(desiredMethod)){
      els.method.value = desiredMethod;
    } else {
      els.method.value = '';
    }
  }

  if (els.pressure){
    els.pressure.disabled = false;
    els.pressure.innerHTML = '';
    insertPlaceholder(els.pressure, '— Select pressure —');
    pressures.forEach(v => { const o=document.createElement('option'); o.value=v; o.textContent=v; els.pressure.appendChild(o); });
    if (desiredPressure && pressures.includes(desiredPressure)){
      els.pressure.value = desiredPressure;
    } else {
      els.pressure.value = '';
    }
  }

  updateResult();
}

let selectorsWired = false;

function wireSelectorEvents(){
  if (selectorsWired) return;
  if (els.product){
    els.product.addEventListener('change', () => {
      refreshSelectors({ preserveProduct: true });
    });
  }
  if (els.method) els.method.addEventListener('change', updateResult);
  if (els.pressure) els.pressure.addEventListener('change', updateResult);
  selectorsWired = true;
}

async function refreshDataIfChanged(){
  try {
    const res = await fetch('data.json?v=' + Date.now(), {cache:'no-store'});
    const arr = await res.json();
    const newHash = hashObj(arr);
    if (newHash !== __dataHash){
      window.state.data = Array.isArray(arr) ? arr : [];
      __dataHash = newHash;

      refreshSelectors({ preserveProduct: true, preserveDependents: true });
      if (els.stamp) els.stamp.textContent = 'Updated: ' + new Date().toLocaleString();
      console.log('data.json updated; UI refreshed.');
    }
  } catch (e){
    console.warn('Data refresh check failed', e);
  }
}

const REFRESH_INTERVAL_MS = 60 * 1000; // 1 minute cadence while the tab is visible
let refreshTimerId = null;

function startDataRefreshScheduler(){
  stopDataRefreshScheduler();
  const tick = () => {
    if (document.visibilityState !== 'hidden') {
      refreshDataIfChanged();
    }
  };
  refreshTimerId = setInterval(tick, REFRESH_INTERVAL_MS);
  tick();
}

function stopDataRefreshScheduler(){
  if (refreshTimerId !== null){
    clearInterval(refreshTimerId);
    refreshTimerId = null;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    startDataRefreshScheduler();
  } else {
    stopDataRefreshScheduler();
  }
});
