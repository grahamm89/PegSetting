
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
  if (els.product){ els.product.innerHTML=''; insertPlaceholder(els.product, '— Select product —'); populate(els.product, unique(data,'Product')); }
  // Method & Pressure start disabled until a product is chosen
  setDisabled(els.method, true, '— Select method —');
  setDisabled(els.pressure, true, '— Select pressure —');

  // Listeners
  if (els.product){
    els.product.addEventListener('change', () => {
      rebuildDependentSelectors();
      // Explicitly clear selections to avoid stale combos
      if (els.method) { els.method.value = ''; els.method.dispatchEvent(new Event('change')); }
      if (els.pressure) { els.pressure.value = ''; els.pressure.dispatchEvent(new Event('change')); }
      updateResult();
    });
  }
  if (els.method) els.method.addEventListener('change', updateResult);
  if (els.pressure) els.pressure.addEventListener('change', updateResult);

  updateResult();
}

async function loadData(){
  try {
    const res = await fetch('data.json?v=' + Date.now(), {cache:'no-cache'});
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
    const res = await fetch('data.json?v=' + Date.now(), {cache:'no-store'});
    const arr = await res.json();
    __dataHash = hashObj(arr);
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
    const res = await fetch('data.json?v=' + Date.now(), {cache:'no-store'});
    const arr = await res.json();
    const newHash = hashObj(arr);
    if (newHash !== __dataHash){
      const prev = window.state.data || [];
      window.state.data = Array.isArray(arr) ? arr : [];
      __dataHash = newHash;

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
