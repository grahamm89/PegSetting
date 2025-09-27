
// Display Min/Max from the same dataset (state.data) — no separate file.
(function(){
  const el = document.getElementById('minmax');
  if (!el) return;

  function getRecommended(){
    try{
      const s = window.state && Array.isArray(window.state.data) ? window.state : {data:[]};
      const prod = document.getElementById('product').value;
      const method = document.getElementById('method').value;
      const pressure = document.getElementById('pressure').value;
      if (!prod || !method || !pressure) return {pending:true, prod, method, pressure};
      const rows = (s.data||[]).filter(r => r.Product===prod && r.Method===method && r.Pressure===pressure);
      if (rows.length) return rows[0];
    }catch(e){}
    return null;
  }
    return null;
  }

  function getMinMax(product){
    const s = window.state && Array.isArray(window.state.data) ? window.state : {data:[]};
    const rows = (s.data||[]).filter(r => r.Product === product);
    if (!rows.length) return null;
    // Rule: last non-empty Min/Max in dataset for that product wins
    const acc = {Min:'', Max:''};
    rows.forEach(r => {
      if ((r.Min||'').trim()) acc.Min = r.Min.trim();
      if ((r.Max||'').trim()) acc.Max = r.Max.trim();
    });
    return {Product: product, Min: acc.Min, Max: acc.Max};
  }

  function render(product){
    if (!product){ el.innerHTML = ''; return; }
    const rec = getRecommended();
    const mm = getMinMax(product);
    if (rec && rec.pending){
      el.innerHTML = '<div class="minmax muted-panel">' +
        '<div class="summary"><span class="pill">Range</span> ' + (mm? (mm.Min + ' <span class="arrow">→</span> ' + mm.Max) : '—') + '</div>' +
        '<div class="hint">Choose method and pressure to see the recommended PEG.</div>' +
      '</div>';
      return;
    }
    if (!mm){ el.innerHTML = '<div class="hint">No min/max limits stored for this product.</div>'; return; }
    el.innerHTML = [
      (function(){
        const recText = rec ? ` — Recommended PEG: <b>${rec.PEG || ''}</b> (at ${rec.Dilution!=null? rec.Dilution+'%':''})` : '';
        return `<div class="summary"><span class="pill">Range</span> ${mm.Min} <span class="arrow">→</span> ${mm.Max}${recText}</div>`;
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
    prodSel.addEventListener('change', () => render(prodSel.value || ''));
    render(prodSel.value || '');
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive'){
    hook();
  } else {
    window.addEventListener('DOMContentLoaded', hook);
  }
})();