
// Display Min/Max derived from state.data (no separate limits.json)
(function(){
  const el = document.getElementById('minmax');
  if (!el) return;

  function getRecommended(){
    try{
      const s = window.state && Array.isArray(window.state.data) ? window.state : {data:[]};
      const prod = document.getElementById('product').value;
      const method = document.getElementById('method').value;
      const pressure = document.getElementById('pressure').value;
      const rows = (s.data||[]).filter(r => r.Product===prod && r.Method===method && r.Pressure===pressure);
      if (rows.length) return rows[0];
    }catch(e){}
    return null;
  }

  function getMinMax(product){
    const s = window.state && Array.isArray(window.state.data) ? window.state : {data:[]};
    const rows = (s.data||[]).filter(r => r.Product === product);
    if (!rows.length) return null;
    const acc = {Min:'', Max:''};
    rows.forEach(r => {
      if ((r.Min||'').trim()) acc.Min = r.Min.trim();
      if ((r.Max||'').trim()) acc.Max = r.Max.trim();
    });
    return {Product: product, Min: acc.Min, Max: acc.Max};
  };
    const rows = (s.data||[]).filter(r => r.Product === product);
    let pick = rows.find(r => (r.Min && r.Max)) || rows[0] || null;
    if (!pick) return null;
    return {Product: product, Min: pick.Min || '', Max: pick.Max || ''};
  }

  function render(product){
    const rec = getRecommended();
    const mm = getMinMax(product);
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
    prodSel.addEventListener('change', () => render(prodSel.value));
    render(prodSel.value);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive'){
    hook();
  } else {
    window.addEventListener('DOMContentLoaded', hook);
  }
})();