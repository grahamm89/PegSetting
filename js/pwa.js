// pwa.js — robust PWA helpers: version chip + refresh controls
(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;

  // Base path for GitHub Pages project sites (e.g., /PegSetting/)
  const BASE = location.pathname.replace(/[^/]*$/, '/');
  const BUILD_URL = `${BASE}build.json`;

  // -------- DOM helpers --------
  const $ = (sel) => document.querySelector(sel);
  const chip = $('#version-chip');
  const btnNow = $('#refresh-now');
  const btnSoon = $('#refresh-soon');
  const btnInterval = $('#refresh-interval');

  // -------- Version chip --------
  async function getBuildId() {
    try {
      const res = await fetch(BUILD_URL + '?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error('no build.json');
      const j = await res.json();
      return (j && (j.buildId || j.version || j.hash)) || null;
    } catch {
      return null;
    }
  }
  async function updateVersionChip() {
    const id = await getBuildId();
    if (chip) chip.textContent = 'v' + (id || '?');
  }

  // -------- Service worker register --------
  async function registerSW(buildId) {
    const swUrl = `${BASE}service-worker.js?v=${buildId || ''}`;
    try {
      const reg = await navigator.serviceWorker.register(swUrl, { scope: BASE });
      // If a new worker appears, prompt user
      reg.addEventListener?.('updatefound', () => {
        const sw = reg.installing || reg.waiting;
        if (sw) showUpdateBanner(sw);
      });
      return reg;
    } catch (e) {
      console.warn('SW register failed', e);
      return null;
    }
  }

  // Reload on controller change (after SKIP_WAITING activates)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Small delay to allow takeover, then reload
    setTimeout(() => location.reload(), 200);
  });

  // -------- Update banner --------
  function ensureBanner() {
    let b = document.getElementById('updateBanner');
    if (b) return b;
    b = document.createElement('div');
    b.id = 'updateBanner';
    b.style.cssText = [
      'position:fixed',
      'left:50%',
      'transform:translateX(-50%)',
      'bottom:16px',
      'z-index:9999',
      'background:#0b5',
      'color:#fff',
      'padding:10px 14px',
      'border-radius:10px',
      'box-shadow:0 2px 12px rgba(0,0,0,.25)',
      'display:none',
      'font:14px/1.2 system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
    ].join(';');

    const span = document.createElement('span');
    span.textContent = 'New version available';
    span.style.marginRight = '8px';

    const btn = document.createElement('button');
    btn.id = 'updBtn';
    btn.textContent = 'Update';
    btn.style.cssText = 'background:#fff;color:#0b5;border:0;border-radius:8px;padding:6px 10px;cursor:pointer';

    b.appendChild(span);
    b.appendChild(btn);
    document.body.appendChild(b);
    return b;
  }

  function showUpdateBanner(sw) {
    const b = ensureBanner();
    b.style.display = 'block';
    const btn = b.querySelector('#updBtn');
    btn.onclick = () => sw.postMessage({ type: 'SKIP_WAITING' });
  }

  // Listen to SW messages (e.g., NEW_CONTENT)
  navigator.serviceWorker.addEventListener('message', (e) => {
    const d = e.data;
    if (!d) return;
    if (d.type === 'NEW_CONTENT') {
      const sw = (navigator.serviceWorker.controller && navigator.serviceWorker) ? navigator.serviceWorker : null;
      showUpdateBanner(sw?.controller || { postMessage: () => navigator.serviceWorker.controller && navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' }) });
    }
  });

  // -------- Refresh scheduling --------
  let longInterval = 12 * 60 * 60 * 1000; // 12 hours
  let timerId = null;

  function clearLongSchedule() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  async function hardReload() {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.update) { try { await reg.update(); } catch {} }
    } catch {}
    location.reload();
  }

  function scheduleLongRefresh() {
    clearLongSchedule();
    timerId = setInterval(hardReload, longInterval);
    if (btnInterval) btnInterval.setAttribute('aria-pressed', 'true');
  }

  // Wire UI controls if present
  if (btnNow) btnNow.addEventListener('click', hardReload);

  if (btnSoon) btnSoon.addEventListener('click', () => {
    // One-off quick refresh ~15s; afterwards keep long schedule
    clearLongSchedule();
    setTimeout(hardReload, 15000);
    scheduleLongRefresh();
  });

  if (btnInterval) btnInterval.addEventListener('click', () => {
    // Toggle 12h schedule
    if (timerId) {
      clearLongSchedule();
      btnInterval.setAttribute('aria-pressed', 'false');
    } else {
      scheduleLongRefresh();
    }
  });

  // -------- Init --------
  (async function init() {
    await updateVersionChip();
    const id = await getBuildId();
    await registerSW(id);
    // default long refresh on
    scheduleLongRefresh();
  })();

})();