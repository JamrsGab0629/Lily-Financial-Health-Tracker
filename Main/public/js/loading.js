// loading.js — shows a branded splash until the page/data is ready
(function () {
  const screen = document.getElementById('loadingScreen');
  const statusEl = document.getElementById('loadingStatus');
  if (!screen) return;

  const MIN_VISIBLE_MS = 500; // avoid a jarring flash on fast loads
  const shownAt = Date.now();
  let dismissed = false;

  function hide() {
    if (dismissed) return;
    dismissed = true;
    const elapsed = Date.now() - shownAt;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    setTimeout(() => {
      screen.classList.add('is-hidden');
      screen.addEventListener('transitionend', () => screen.remove(), { once: true });
    }, wait);
  }

  // Dismiss automatically once the page has finished loading...
  window.addEventListener('load', hide);

  // ...or dismiss immediately when your data code is ready, e.g. in dashboard.js:
  //   window.dispatchEvent(new Event('lily:ready'));
  window.addEventListener('lily:ready', hide);

  // Optional: update the status line from anywhere, e.g.:
  //   window.dispatchEvent(new CustomEvent('lily:loading-status', { detail: 'Fetching transactions…' }));
  window.addEventListener('lily:loading-status', (e) => {
    if (statusEl && e.detail) statusEl.textContent = e.detail;
  });

  // Safety net: never let the splash get stuck forever.
  setTimeout(hide, 8000);
})();
