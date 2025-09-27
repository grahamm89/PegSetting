
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
  const rows = (window.state.data||[]).filter(r => r.Product===p && r.Method===m && r.Pressure===pr);
  if (!rows.length){
    els.result.textContent = 'No match for current selection.';
    return;
  }
  const r = rows[0];
  els.result.innerHTML = `<b>Recommended PEG:</b> ${r.PEG} — <b>Dilution:</b> ${r.Dilution}%`;
}

function initSelectors(){
  const data = window.state.data||[];
  populate(els.product, unique(data,'Product'));
  populate(els.method, unique(data,'Method'));
  populate(els.pressure, unique(data,'Pressure'));
  ['product','method','pressure'].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', updateResult);
  });
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

document.addEventListener('DOMContentLoaded', loadData);
