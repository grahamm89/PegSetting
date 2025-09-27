// Display Min/Max from the same dataset (state.data) — no separate file.
(function(){
  const el = document.getElementById('minmax');
  if (!el) return;

  function getRecommended(){
    try{
      const s = (window.state && Array.isArray(window.state.data)) ? window.state : {data:[]};
      const prod = (document.getElementById('product')||{}).value || '';
      const method = (document.getElementById('method')||{}).value || '';
      const pressure = (document.getElementById('pressure')||{}).value || '';
      if (!prod || !method || !pressure) return {pending:true, prod, method, pressure};
      const rows = (s.data||[]).filter(r => r.Product===prod && r.Method===method && r.Pressure===pressure);
      if (rows.length) return rows[0];
    }catch(e){}
    return null;
  }

  function getMinMax(product){
    const s = (window.state && Array.isArray(window.state.data)) ? window.state : {data:[]};
    const rows = (s.data||[]).filter(r => r.Product === product);
    if (!rows.length) return null;

    // Last non-empty wins; fallback to first row if still empty
    const acc = {Min:'', Max:''};
    rows.forEach(r => {
      if ((r.Min||'').trim()) acc.Min = r.Min.trim();
      if ((r.Max||'').trim()) acc.Max = r.Max.trim();
    });
    const first = rows[0] || {};
    return { Product: product, Min: acc.Min || (first.Min||''), Max: acc.Max || (first.Max||'') };
  }

  function render(product){
    if (!product){ el.innerHTML = ''; return; }
    const rec = getRecommended();
    const mm  = getMinMax(product);
    if (!mm){
      el.innerHTML = '<div class="hint">No min/max limits stored for this product.</div>';
      return;
    }

    // If method/pressure not chosen yet, show FULL Range panel (no muted, no hint, no recText)
    if (rec && rec.pending){
      el.innerHTML = [
        '<div class="summary"><span class="pill">Range</span> ' + mm.Min + ' <span class="arrow">→</span> ' + mm.Max + '</div>',
        '<h3>PEG Settings — Min / Max</h3>',
        '<table class="table"><thead><tr><th>Product</th><th>Min</th><th>Max</th></tr></thead>',
        '<tbody><tr><td>' + mm.Product + '</td><td>' + mm.Min + '</td><td>' + mm.Max + '</td></tr></tbody></table>'
      ].join('');
      return;
    }

    const recText = rec ? ' — Recommended PEG: <b>' + (rec.PEG || '') + '</b> ' + (rec.Dilution!=null? '(at ' + rec.Dilution + '%)':'') : '';
    el.innerHTML = [
      '<div class="summary"><span class="pill">Range</span> ' + mm.Min + ' <span class="arrow">→</span> ' + mm.Max + recText + '</div>',
      '<h3>PEG Settings — Min / Max</h3>',
      '<table class="table"><thead><tr><th>Product</th><th>Min</th><th>Max</th></tr></thead>',
      '<tbody><tr><td>' + mm.Product + '</td><td>' + mm.Min + '</td><td>' + mm.Max + '</td></tr></tbody></table>'
    ].join('');
  }

  function hook(){
    const prodSel = document.getElementById('product');
    const methodSel = document.getElementById('method');
    const pressureSel = document.getElementById('pressure');
    if (!prodSel) return;
    const rerender = () => render(prodSel.value || '');
    prodSel.addEventListener('change', rerender);
    if (methodSel) methodSel.addEventListener('change', rerender);
    if (pressureSel) pressureSel.addEventListener('change', rerender);
    rerender();
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive'){
    hook();
  } else {
    window.addEventListener('DOMContentLoaded', hook);
  }
})();