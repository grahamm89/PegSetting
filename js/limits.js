
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
// Load min/max limits and show for the selected product
=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
<<<<<<< HEAD
// Display Min/Max derived from state.data (no separate limits.json)
=======
// Load min/max limits and show for the selected product
>>>>>>> 0d327ff53cdd05ab12c6b23ee68e447a864cbeae
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
(function(){
  const el = document.getElementById('minmax');
  if (!el) return;

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
  const byProduct = {};

=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
<<<<<<< HEAD
=======
  const byProduct = {};

>>>>>>> 0d327ff53cdd05ab12c6b23ee68e447a864cbeae
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
  function getRecommended(){
    try{
      const s = window.state && Array.isArray(window.state.data) ? window.state : {data:[]};
      const prod = document.getElementById('product').value;
      const method = document.getElementById('method').value;
      const pressure = document.getElementById('pressure').value;
      const rows = (s.data||[]).filter(r => r.Product===prod && r.Method===method && r.Pressure===pressure);
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
      if (rows.length) return rows[0]; // assume first match
=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
<<<<<<< HEAD
      if (rows.length) return rows[0];
=======
      if (rows.length) return rows[0]; // assume first match
>>>>>>> 0d327ff53cdd05ab12c6b23ee68e447a864cbeae
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    }catch(e){}
    return null;
  }

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
<<<<<<< HEAD
  function getMinMax(product){
    const s = window.state && Array.isArray(window.state.data) ? window.state : {data:[]};
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
=======
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
  function render(product){
    const rec = getRecommended();

    const mm = byProduct[product];
    if (!mm){ el.innerHTML = '<div class="hint">No min/max limits stored for this product.</div>'; return; }
    el.innerHTML = [
      (function(){
        if (!mm) return '';
        const recText = rec ? ` — Recommended PEG: <b>${rec.PEG || ''}</b> (at ${rec.Dilution!=null? rec.Dilution+'%':''})` : '';
        return `<div class="hint"><b>Range:</b> ${mm.Min} to ${mm.Max}${recText}</div>`;
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
>>>>>>> 0d327ff53cdd05ab12c6b23ee68e447a864cbeae
>>>>>>> Stashed changes
=======
>>>>>>> 0d327ff53cdd05ab12c6b23ee68e447a864cbeae
>>>>>>> Stashed changes
=======
>>>>>>> 0d327ff53cdd05ab12c6b23ee68e447a864cbeae
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
<<<<<<< HEAD
  if (document.readyState === 'complete' || document.readyState === 'interactive'){
    hook();
  } else {
    window.addEventListener('DOMContentLoaded', hook);
  }
})();
=======
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
>>>>>>> 0d327ff53cdd05ab12c6b23ee68e447a864cbeae
>>>>>>> Stashed changes
=======
>>>>>>> 0d327ff53cdd05ab12c6b23ee68e447a864cbeae
>>>>>>> Stashed changes
=======
>>>>>>> 0d327ff53cdd05ab12c6b23ee68e447a864cbeae
>>>>>>> Stashed changes
