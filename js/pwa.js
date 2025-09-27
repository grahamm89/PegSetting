
(function(){
  const id = 'updateBanner';
  const scriptUrl = (document.currentScript && document.currentScript.src) || new URL('js/pwa.js', window.location.href).href;
  function ensureBanner(){
    let b = document.getElementById(id);
    if (b) return b;
    b = document.createElement('div');
    b.id = id;
    b.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:9999;background:#111;color:#fff;padding:10px 14px;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,.25);display:none;';
    b.innerHTML = '<span>Update available.</span> <button id="updBtn" style="margin-left:8px;padding:6px 10px;border-radius:8px;border:0;cursor:pointer">Refresh</button>';
    document.body.appendChild(b);
    return b;
  }

  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const swUrl = new URL('../service-worker.js', scriptUrl);
      const reg = await navigator.serviceWorker.register(swUrl.pathname);
      function onNewSW(sw){
        const banner = ensureBanner();
        banner.style.display = 'block';
        const btn = banner.querySelector('#updBtn');
        btn.onclick = () => {
          if (sw && sw.state === 'installed') {
            sw.postMessage({type: 'SKIP_WAITING'});
          }
        };
      }
      if (reg.waiting) onNewSW(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            onNewSW(sw);
          }
        });
      });
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Auto-reload when the new SW activates
        window.location.reload();
      });
    } catch (e) {
      console.warn('SW registration failed', e);
    }
  });
})();
