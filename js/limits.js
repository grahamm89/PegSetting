// limits.js — show Min/Max for the EXACT selected row (Product + Method + Pressure)
(function () {
  const container = document.getElementById('minmax');
  if (!container) return;

  function selVal(id) {
    const el = document.getElementById(id);
    return el ? (el.value || '') : '';
  }

  function getSelectedRow() {
    const product = selVal('product');
    const method = selVal('method');
    const pressure = selVal('pressure');

    // Require all three to be chosen
    if (!product || !method || !pressure) {
      return { pending: true, product, method, pressure };
    }

    const data = (window.state && Array.isArray(window.state.data)) ? window.state.data : [];
    return data.find(r =>
      r.Product === product &&
      r.Method === method &&
      r.Pressure === pressure
    ) || null;
  }

  function render() {
    const row = getSelectedRow();

    if (row && row.pending) {
      container.innerHTML = `
        <div class="hint">Select <b>Application Method</b> and <b>Pressure</b> to see Min/Max for this setting.</div>
      `;
      return;
    }

    if (!row) {
      container.innerHTML = `
        <div class="hint">No Min/Max found for the current selection.</div>
      `;
      return;
    }

    const min = row.Min || '—';
    const max = row.Max || '—';
    const peg = row.PEG || '—';
    const dil = (row.Dilution !== undefined && row.Dilution !== null && row.Dilution !== '') ? row.Dilution : '—';

    // One compact panel: Range + table for the matched row
    container.innerHTML = `
      <div class="summary">
        <span class="pill">Range</span>
        ${min} <span class="arrow">→</span> ${max}
        — Recommended PEG: <b>${peg}</b>${dil !== '—' ? ` (at ${dil}%)` : ''}
      </div>

      <h3>PEG Settings — Min / Max</h3>
      <table class="table">
        <thead>
          <tr><th>Product</th><th>Min</th><th>Max</th></tr>
        </thead>
        <tbody>
          <tr><td>${row.Product}</td><td>${min}</td><td>${max}</td></tr>
        </tbody>
      </table>
    `;
  }

  function hook() {
    // Re-render when selectors change
    ['product', 'method', 'pressure'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', render);
    });

    // Re-render when data.json changes (app.js dispatches this)
    window.addEventListener('datahash:updated', render);

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hook);
  } else {
    hook();
  }
})();
