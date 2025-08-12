
(function(){
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  let hasRefreshed = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hasRefreshed) return; hasRefreshed = true; location.reload();
  });
  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event && event.data;
    if (data && data.type === 'SW_ACTIVATED_RELOAD' && !hasRefreshed) { hasRefreshed = true; location.reload(); }
  });
})();
