
// Load min/max limits and show for the selected product
(function(){
  const el = document.getElementById('minmax');
  if (!el) return;

  const byProduct = {};

  function getRecommended(){
    try{
      const s = window.state && Array.isArray(window.state.data) ? window.state : {data:[]};
      const prod = document.getElementById('product').value;
      const method = document.getElementById('method').value;
      const pressure = document.getElementById('pressure').value;
      const rows = (s.data||[]).filter(r => r.Product===prod && r.Method===method && r.Pressure===pressure);
      if (rows.length) return rows[0]; // assume first match
    }catch(e){}
    return null;
  }

  function render(product){
    const rec = getRecommended();

    const mm = byProduct[product];
    if (!mm){ el.innerHTML = '<div class="hint">No min/max limits stored for this product.</div>'; return; }
    el.innerHTML = [
      (function(){
        if (!mm) return '';
        const recText = rec ? ` — Recommended PEG: <b>${rec.PEG || ''}</b> (at ${rec.Dilution!=null? rec.Dilution+'%':''})` : '';
        return `<div class="hint"><b>Range:</b> ${mm.Min} to ${mm.Max}${recText}</div>`;
      })(),
      '<h3>PEG Settings — Min / Max</h3>',
      '<table class="table">',
      '<thead><tr><th>Product</th><th>Min</th><th>Max</th></tr></thead>',
      '<tbody>',
      `<tr><td>${mm.Product}</td><td>${mm.Min}</td><td>${mm.Max}</td></tr>`,
      '</tbody></table>'
    ].join('');
  }

  function hook(){
    const prodSel = document.getElementById('product');
    if (!prodSel) return;
    prodSel.addEventListener('change', () => render(prodSel.value));
    render(prodSel.value);
  }

  fetch('limits.json?v=' + Date.now(), {cache:'no-cache'})
    .then(r => r.json())
    .then(arr => {
      arr.forEach(row => { if (row && row.Product) byProduct[row.Product] = row; });
      if (document.readyState === 'complete' || document.readyState === 'interactive'){
        hook();
      } else {
        window.addEventListener('DOMContentLoaded', hook);
      }
    })
    .catch(() => { el.innerHTML = '<div class="hint">Could not load limits.json</div>'; });
})();
