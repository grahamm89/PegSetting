
(function(){
  // SW register + auto refresh on activation
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
    let hasRefreshed = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hasRefreshed) return;
      hasRefreshed = true;
      location.reload();
    });
    navigator.serviceWorker.addEventListener('message', (event) => {
      const data = event && event.data;
      if (data && data.type === 'SW_ACTIVATED_RELOAD' && !hasRefreshed) {
        hasRefreshed = true;
        location.reload();
      }
    });
  }
})();

const state = { data: [] };
const product = document.getElementById("product");
const method = document.getElementById("method");
const pressure = document.getElementById("pressure");
const result = document.getElementById("result");
const errorBanner = document.getElementById("errorBanner");

function showError(msg){
  console.error('[QFM Error]', msg);
  errorBanner.textContent = String(msg);
  errorBanner.style.display = 'block';
}

async function loadData() {
  try {
    const res = await fetch('data.json?v=' + Date.now(), { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const arr = await res.json();
    if (!Array.isArray(arr)) throw new Error('data.json is not an array');
    state.data = arr;
    init();
  } catch (e) {
    showError('Failed to load data.json: ' + (e && e.message));
  }
}

function populateSelect(select, values) {
  select.innerHTML = "";
  values.forEach(val => {
    const option = document.createElement("option");
    option.value = val;
    option.textContent = val;
    select.appendChild(option);
  });
}

function updateResult() {
  const p = product.value;
  const m = method.value;
  const pr = pressure.value;
  const match = state.data.find(d => d.Product === p && d.Method === m && d.Pressure === pr);
  result.textContent = match ? `PEG Setting: ${match.PEG}, Dilution: ${match.Dilution}%` : "No data found for selection.";
}

function init() {
  const unique = (arr, key) => [...new Set(arr.map(item => item[key]))];
  populateSelect(product, unique(state.data, "Product"));
  populateSelect(method, unique(state.data, "Method"));
  populateSelect(pressure, unique(state.data, "Pressure"));
  product.addEventListener("change", updateResult);
  method.addEventListener("change", updateResult);
  pressure.addEventListener("change", updateResult);
  if (product.value && method.value && pressure.value) updateResult();
}

// Install prompt (Chromium); Edge label
let deferredPrompt = null;
const installBanner = document.getElementById('installBanner');
const installBtn = document.getElementById('installBtn');
const dismissInstall = document.getElementById('dismissInstall');
const installText = document.getElementById('installText');
const isEdge = navigator.userAgent.includes('Edg/');
if (installText && isEdge) installText.textContent = 'Install in Edge';

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (!localStorage.getItem('installDismissed')) installBanner.style.display = 'flex';
});
if (installBtn) installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  installBanner.style.display = 'none';
  deferredPrompt = null;
});
if (dismissInstall) dismissInstall.addEventListener('click', () => {
  installBanner.style.display = 'none';
  localStorage.setItem('installDismissed', '1');
});

// iOS & macOS Safari tips
(function(){
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isMac = /macintosh/.test(ua);
  const isSafari = /^((?!chrome|chromium|android).)*safari/.test(ua);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const hasBeforeInstall = 'onbeforeinstallprompt' in window;
  const iosTip = document.getElementById('iosTip');
  const macTip = document.getElementById('macSafariTip');
  if (isIOS && !isStandalone && !hasBeforeInstall && iosTip) iosTip.style.display = 'block';
  if (isMac && isSafari && !isStandalone && !hasBeforeInstall && macTip) macTip.style.display = 'block';
})();

// Footer timestamp
(function(){
  const footer = document.querySelector('footer');
  if (footer) footer.textContent = 'Offline ready. Updated: ' + new Date().toLocaleString();
})();

loadData();
