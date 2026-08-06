// theme.js — wires up the dark/light toggle button
(function () {
  const STORAGE_KEY = 'lily-theme';
  const toggle = document.getElementById('themeToggle');
  const thumb = document.getElementById('themeToggleIcon');

  function applyIcon(theme) {
    if (thumb) thumb.textContent = theme === 'dark' ? '🌙' : '☀️';
    if (toggle) toggle.setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
  }

  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyIcon(current);

  if (toggle) {
    toggle.addEventListener('click', () => {
      const now = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = now === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
      applyIcon(next);
    });
  }
})();
