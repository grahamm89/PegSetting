
// Stamp
document.getElementById('stamp').textContent = new Date().toLocaleString();

// Hidden admin access: double-tap 'E'
(function(){
  let last = 0;
  document.addEventListener('keydown', (e) => {
    if ((e.key || '').toLowerCase() === 'e'){
      const now = Date.now();
      if (now - last < 400) location.href = 'admin.html';
      last = now;
    }
  });
})();

// Auto-refresh on SW update
(function(){
  const el = document.getElementById('swState');
  function set(text){ if (el) el.textContent = text; }
  if (!('serviceWorker' in navigator)){ set('not supported'); return; }
  navigator.serviceWorker.register('service-worker.js').then(() => set('registered')).catch(() => set('failed'));
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return; reloaded = true; location.reload();
  });
  navigator.serviceWorker.addEventListener('message', (event) => {
    const d = event && event.data;
    if (d && d.type === 'SW_ACTIVATED_RELOAD' && !reloaded){ reloaded = true; location.reload(); }
  });
})();
