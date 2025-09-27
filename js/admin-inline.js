
/* admin-inline.js — hardened with safe-guards */
(() => {
  const overlay = document.getElementById('adminOverlay');
  const getTbody = () => document.querySelector('#dataTable tbody');
  let suggestedFilename = 'data.json';

  // --- helpers
  const warn = (msg) => console.warn('[admin]', msg);
  const hasEl = (id) => !!document.getElementById(id);

  // === Auto-Refresh Controls (Admin) ===
  function ensureRefreshControls(){
    if (!overlay) { warn('overlay #adminOverlay missing'); return; }
    if (document.getElementById('refreshControls')) return;

    const modal = overlay.querySelector('.modal') || overlay; // fallback to overlay if .modal missing
    const box = document.createElement('div');
    box.id = 'refreshControls';
    box.className = 'card-like';
    box.innerHTML = `
      <h3>Auto-Refresh</h3>
      <div class="refresh-row">
        <span id="swVersionChip" class="chip">SW: —</span>
        <span id="dataHashChip" class="chip">Data: —</span>
        <button id="rfBoost" type="button">Boost refresh (15s for 1 min)</button>
      </div>
    `;
    try { modal.prepend(box); } catch { modal.appendChild(box); }
    wireBoost(); // safe to call; guards internally
  }

  // Data hash chip support (uses event from app.js)
  function updateDataHashChip(h){
    const el = document.getElementById('dataHashChip');
    if (!el) return;
    let hash = h || (typeof window.__dataHash !== 'undefined' ? window.__dataHash : null);
    if (!hash && window.state && Array.isArray(window.state.data)){
      try { hash = btoa(unescape(encodeURIComponent(JSON.stringify(window.state.data)))).slice(0,32); } catch {}
    }
    if (!hash) { el.textContent = 'Data: —'; el.removeAttribute('title'); return; }
    el.textContent = 'Data: ' + String(hash).slice(0,8);
    el.title = 'Hash: ' + hash;
  }

  window.addEventListener('datahash:updated', (e) => updateDataHashChip(e?.detail?.hash));

  // SW version chip
  function fetchSwVersion(){
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.getRegistration?.().then(reg => {
      if (!reg) return;
      const target = (reg.active || reg.waiting || reg.installing);
      if (!target) return;
      function onMsg(e){
        const d = e.data || {};
        if (d.type === 'SW_VERSION'){
          const el = document.getElementById('swVersionChip');
          if (el) el.textContent = 'SW: ' + d.version;
          navigator.serviceWorker.removeEventListener('message', onMsg);
        }
      }
      navigator.serviceWorker.addEventListener('message', onMsg);
      try { target.postMessage({type:'GET_VERSION'}); } catch {}
    }).catch(() => {});
  }

  // Boost button wiring
  function wireBoost(){
    const btn = document.getElementById('rfBoost');
    if (!btn) return;
    const bc = ('BroadcastChannel' in window) ? new BroadcastChannel('peg-settings') : null;
    const ms = 15000, duration = 60000;
    btn.addEventListener('click', () => {
      const until = Date.now() + duration;
      try {
        localStorage.setItem('refreshOverrideMs', String(ms));
        localStorage.setItem('refreshOverrideUntil', String(until));
      } catch {}
      if (bc) bc.postMessage({type:'refresh-override', ms, until});
      btn.textContent = 'Boost active (1 min)';
      setTimeout(() => btn.textContent = 'Boost refresh (15s for 1 min)', duration + 500);
    });
  }

  // Overlay open/close
  function openOverlay(){
    if (!overlay) { warn('overlay missing; cannot open'); return; }
    ensureRefreshControls();
    updateDataHashChip();
    fetchSwVersion();
    overlay.classList.add('show');

    // if state is not present yet, render empty table (no crash)
    const data = (window.state && Array.isArray(window.state.data)) ? window.state.data : [];
    buildTable(data);
  }
  function closeOverlay(){ if (overlay) overlay.classList.remove('show'); }

  // Build / Add / Delete rows
  function buildTable(arr){
    const body = getTbody();
    if (!body) { warn('#dataTable tbody missing'); return; }
    body.innerHTML = '';
    (arr || []).forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td contenteditable>${row?.Product ?? ''}</td>
        <td contenteditable>${row?.Method ?? ''}</td>
        <td contenteditable>${row?.Pressure ?? ''}</td>
        <td contenteditable>${row?.PEG ?? ''}</td>
        <td contenteditable>${row?.Dilution ?? ''}</td>
        <td contenteditable>${row?.Min ?? ''}</td>
        <td contenteditable>${row?.Max ?? ''}</td>
        <td><button class="del" type="button">X</button></td>
      `;
      const del = tr.querySelector('.del');
      if (del) del.addEventListener('click', () => tr.remove());
      body.appendChild(tr);
    });
  }

  function addRow(){
    const body = getTbody();
    if (!body) { warn('cannot add row; tbody missing'); return; }
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td contenteditable></td>
      <td contenteditable></td>
      <td contenteditable></td>
      <td contenteditable></td>
      <td contenteditable></td>
      <td contenteditable></td>
      <td contenteditable></td>
      <td><button class="del" type="button">X</button></td>
    `;
    const del = tr.querySelector('.del');
    if (del) del.addEventListener('click', () => tr.remove());
    body.appendChild(tr);
  }

  function tableToJson(){
    const body = getTbody();
    if (!body) { warn('cannot serialize; tbody missing'); return []; }
    const rows = Array.from(body.querySelectorAll('tr'));
    return rows.map(tr => {
      const tds = tr.querySelectorAll('td');
      const safe = (i) => (tds[i]?.innerText || '').trim();
      return {
        Product: safe(0),
        Method: safe(1),
        Pressure: safe(2),
        PEG: safe(3),
        Dilution: parseFloat(safe(4) || '0'),
        Min: safe(5),
        Max: safe(6)
      };
    });
  }

  // Toolbar actions (all guarded)
  function wireToolbar(){
    const add = document.getElementById('addRow');
    if (add) add.addEventListener('click', addRow);

    const dl = document.getElementById('downloadData');
    if (dl) dl.addEventListener('click', () => {
      const data = tableToJson();
      try {
        const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = suggestedFilename;
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
      } catch (e) { warn('download failed: ' + e.message); }
    });

    const upBtn = document.getElementById('uploadBtn');
    const upInput = document.getElementById('uploadInput');
    if (upBtn && upInput){
      upBtn.addEventListener('click', () => upInput.click());
      upInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          try{
            const parsed = JSON.parse(ev.target.result);
            if (!Array.isArray(parsed)) throw new Error('JSON must be an array');
            buildTable(parsed);
            suggestedFilename = file.name || 'data.json';
          }catch(err){
            alert('Invalid JSON: ' + err.message);
          }
        };
        reader.readAsText(file, 'utf-8');
      });
    } else {
      if (!upBtn) warn('uploadBtn missing');
      if (!upInput) warn('uploadInput missing');
    }

    const newVer = document.getElementById('newVersion');
    if (newVer) newVer.addEventListener('click', () => {
      suggestedFilename = 'data.json';
      buildTable([]);
    });

    const close = document.getElementById('closeAdmin');
    if (close) close.addEventListener('click', closeOverlay);
  }

  // Keyboard shortcut: double-tap 'E' → password → open (guarded)
  (function wireShortcut(){
    let last = 0;
    document.addEventListener('keydown', (e) => {
      if ((e.key||'').toLowerCase() === 'e'){
        const now = Date.now();
        if (now - last < 400){
          const pass = prompt('Enter admin password:');
          if (pass === 'apex-admin') openOverlay();
        }
        last = now;
      }
    });
  })();

  // Button/URL triggers as fallbacks (guarded)
  (function(){
    const btn = document.getElementById('openAdminBtn');
    if (btn) btn.addEventListener('click', openOverlay);
    if (location.hash === '#admin') setTimeout(openOverlay, 0);
  })();

  // Initial wire-up
  document.addEventListener('DOMContentLoaded', () => {
    wireToolbar();
  });
})();
