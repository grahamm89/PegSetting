// js/pwa.js (GitHub Pages friendly, headerless updates)
(function () {
  if (!('serviceWorker' in navigator)) return;

  // Determine base path: "/" for user pages, "/repo/" for project pages
  const parts = location.pathname.split('/').filter(Boolean);
  const BASE = location.pathname.replace(/[^/]*$/, '/');

  const BUILD_URL = `${BASE}build.json`;

  function ensureBanner() {
    let b = document.getElementById('updateBanner');
    if (b) return b;
    b = document.createElement('div');
    b.id = 'updateBanner';
    b.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:9999;background:#111;color:#fff;padding:10px 14px;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,.25);display:none;';
    b.innerHTML = '<span>Update available.</span> <button id="updBtn" style="margin-left:8px;padding:6px 10px;border-radius:8px;border:0;cursor:pointer">Refresh</button>';
    document.body.appendChild(b);
    return b;
  }

  async function getBuildId() {
    try {
      const res = await fetch(`${BUILD_URL}?v=${Date.now()}`, { cache: 'no-store' });
      const j = await res.json();
      return j && j.buildId;
    } catch { return null; }
  }

  async function registerSW(buildId) {
    const url = new URL('service-worker.js?v=' + (buildId || ''), BASE).pathname;
    try {
      return await navigator.serviceWorker.register(url, { scope: BASE });
    } catch (e) {
      console.warn('SW register failed', e);
      return null;
    }
  }

  function showUpdate(sw) {
    const banner = ensureBanner();
    banner.style.display = 'block';
    banner.querySelector('#updBtn').onclick = () => sw.postMessage({ type: 'SKIP_WAITING' });
  }

  async function init() {
    const current = await getBuildId();
    if (!current) return;
    localStorage.setItem('buildId', current);

    const reg = await registerSW(current);
    if (reg) {
      if (reg.waiting) showUpdate(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) showUpdate(sw);
        });
      });
    }

    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());

    // Poll build.json every 5 minutes in visible tabs
    let timer = null;
    async function tick() {
      if (document.hidden) return;
      const cached = localStorage.getItem('buildId');
      const latest = await getBuildId();
      if (latest && latest !== cached) {
        localStorage.setItem('buildId', latest);
        const reg2 = await registerSW(latest);
        if (reg2 && reg2.waiting) showUpdate(reg2.waiting);
      }
    }
    function schedule() {
      if (timer) clearInterval(timer);
      timer = setInterval(tick, 5 * 60 * 1000);
    }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
    schedule();
  }

  window.addEventListener('load', init);
})();
