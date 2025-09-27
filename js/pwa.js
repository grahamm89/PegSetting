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
    const swUrl = new URL('service-worker.js?v=' + (buildId || ''), BASE_URL).toString();
    try {
      return await navigator.serviceWorker.register(swUrl, { scope: BASE_URL.pathname });
    } catch (e) {
      console.warn('SW register failed', e);
      return null;
    }
  });
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


// ---- One-hour auto-refresh watchdog (activity-aware) ----
(function(){
  function getRefreshWindowMs(){
  const now = Date.now();
  const oMs = parseInt(localStorage.getItem('refreshOverrideMs')||'',10);
  const oUntil = parseInt(localStorage.getItem('refreshOverrideUntil')||'',10);
  if (!isNaN(oMs) && oMs>0 && !isNaN(oUntil) && oUntil>now){
    return oMs; // override active
  }
  // clear stale override
  try{ localStorage.removeItem('refreshOverrideMs'); localStorage.removeItem('refreshOverrideUntil'); }catch(e){}
  const d = parseInt(localStorage.getItem('refreshWindowMs')||'',10);
  if (!isNaN(d) && d>0) return d;
  return 12 * 60 * 60 * 1000; // default 12 hours
}
let FORCE_REFRESH_AFTER_MS = getRefreshWindowMs();
  const COUNTDOWN_MS = 30 * 1000; // show banner 30s before refresh
  let lastActivity = Date.now(), FORCE_REFRESH_AFTER_MS = getRefreshWindowMs();
  let refreshTimer = null, countdownTimer = null, banner = null, countdownSpan = null;
  const bc = ('BroadcastChannel' in window) ? new BroadcastChannel('peg-settings') : null;

  function ensureBanner(){
    if (banner) return banner;
    banner = document.getElementById('updateBanner');
    if (!banner){
      banner = document.createElement('div');
      banner.id = 'updateBanner';
      banner.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:9999;background:#111;color:#fff;padding:10px 14px;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,.25);display:none;';
      banner.innerHTML = '<span>Refreshing in <b id="updCountdown">30</b>s to get the latest settings.</span> <button id="updBtn" style="margin-left:8px;padding:6px 10px;border-radius:8px;border:0;cursor:pointer">Refresh now</button> <button id="snoozeBtn" style="margin-left:8px;padding:6px 10px;border-radius:8px;border:0;cursor:pointer">Snooze 10 min</button>';
      document.body.appendChild(banner);
    }
    countdownSpan = document.getElementById('updCountdown');
    banner.querySelector('#updBtn').onclick = () => doRefresh(true);
    banner.querySelector('#snoozeBtn').onclick = snooze;
    return banner;
  }

  function doRefresh(fromUser){
    // Ask SW to skip waiting if there's a new one, then reload
    navigator.serviceWorker && navigator.serviceWorker.getRegistration().then(reg => {
      if (reg && reg.waiting) reg.waiting.postMessage({type:'SKIP_WAITING'});
    }).finally(() => {
      if (!navigator.onLine) { // wait for online if needed
        window.addEventListener('online', () => location.reload(), {once:true});
      } else {
        location.reload();
      }
    });
  }

  function clearTimers(){
    if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null; }
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    if (banner) banner.style.display = 'none';
  }

  function schedule(){
    clearTimers();
    const elapsed = Date.now() - lastActivity;
    FORCE_REFRESH_AFTER_MS = getRefreshWindowMs();
    const remaining = Math.max(FORCE_REFRESH_AFTER_MS - elapsed, 0);
    if (remaining <= COUNTDOWN_MS){
      const b = ensureBanner(); b.style.display = 'block';
      let left = Math.ceil(remaining/1000);
      countdownSpan.textContent = left;
      countdownTimer = setInterval(() => {
        left -= 1; if (left < 0) left = 0;
        countdownSpan.textContent = left;
      }, 1000);
      refreshTimer = setTimeout(() => doRefresh(false), remaining);
    } else {
      refreshTimer = setTimeout(schedule, remaining - COUNTDOWN_MS);
    }
  }

  function snooze(){
    clearTimers();
    lastActivity = Date.now() + (10 * 60 * 1000) - FORCE_REFRESH_AFTER_MS; // push by 10 min
    schedule();
  }

  // Activity events reset the clock
  ['click','keydown','pointerdown','touchstart','scroll'].forEach(ev => {
    window.addEventListener(ev, () => { lastActivity = Date.now(); schedule(); }, {passive:true});
  });
  document.addEventListener('visibilitychange', () => {
    // If user returns to tab, consider that activity
    if (!document.hidden){ lastActivity = Date.now(); schedule(); }
  });

  // Multi-tab coordination: first active tab can owns the refresh. Others reload when controller changes.
  if (bc){
    bc.onmessage = (e) => {
      if (e.data?.type === 'force-refresh') doRefresh(false);
      if (e.data?.type === 'refresh-config' && typeof e.data.ms === 'number'){
        try{ localStorage.setItem('refreshWindowMs', String(e.data.ms)); }catch(e){}
        lastActivity = Date.now(); schedule();
      }
      if (e.data?.type === 'refresh-override' && typeof e.data.ms === 'number' && typeof e.data.until === 'number'){
        try{ localStorage.setItem('refreshOverrideMs', String(e.data.ms)); localStorage.setItem('refreshOverrideUntil', String(e.data.until)); }catch(e){}
        lastActivity = Date.now(); schedule();
      }
    };
  }

  // Kick off
  schedule();
})();


navigator.serviceWorker && navigator.serviceWorker.addEventListener('message', (e) => {
  const d = e.data;
  if (!d) return;
  if (d.type === 'REFRESH_OVERRIDE' && typeof d.ms === 'number' && typeof d.until === 'number') {
    try { localStorage.setItem('refreshOverrideMs', String(d.ms)); localStorage.setItem('refreshOverrideUntil', String(d.until)); } catch(e){}
    // apply immediately
    if (typeof lastActivity !== 'undefined') { lastActivity = Date.now(); }
    if (typeof schedule === 'function') schedule();
  }
});
