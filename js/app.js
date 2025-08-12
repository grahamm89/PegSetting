
window.state = { data: [] };

const els = {
  product: document.getElementById('product'),
  method: document.getElementById('method'),
  pressure: document.getElementById('pressure'),
  result: document.getElementById('result'),
  stamp: document.getElementById('stamp')
};

function unique(arr, key){ return [...new Set(arr.map(i => i[key]))]; }
function populate(sel, values){
  sel.innerHTML = '';
  values.forEach(v => { const o=document.createElement('option'); o.value=v; o.textContent=v; sel.appendChild(o); });
}

function updateResult(){
  const p = els.product.value, m = els.method.value, pr = els.pressure.value;
  const match = state.data.find(d => d.Product===p && d.Method===m && d.Pressure===pr);
  els.result.textContent = match ? `PEG Setting: ${match.PEG}, Dilution: ${match.Dilution}%` : 'No data found for selection.';
}

function initSelectors(){
  populate(els.product, unique(state.data,'Product'));
  populate(els.method, unique(state.data,'Method'));
  populate(els.pressure, unique(state.data,'Pressure'));
  ['product','method','pressure'].forEach(id=>els[id].addEventListener('change', updateResult));
  updateResult();
}

async function loadData(){
  const res = await fetch('data.json?v=' + Date.now(), {cache:'no-cache'});
  const arr = await res.json();
  state.data = Array.isArray(arr) ? arr : [];
  initSelectors();
  if (els.stamp) els.stamp.textContent = 'Updated: ' + new Date().toLocaleString();
}
loadData();
