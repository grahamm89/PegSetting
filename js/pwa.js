
// Relative SW registration with guards
(function(){
  if (!('serviceWorker' in navigator)) return;
  // Allow bypass via localStorage (set by admin if ever needed)
  const bypassUntil = parseInt(localStorage.getItem('swBypassUntil')||'0',10);
  if (!isNaN(bypassUntil) && Date.now() < bypassUntil) return;

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('service-worker.js'); // relative path
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            // New SW available; hint the page (banner may pick this up)
            console.log('[SW] update installed');
          }
        });
      });
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] controller changed');
      });
    } catch (e) {
      console.warn('SW registration failed', e);
    }
  });
})();
