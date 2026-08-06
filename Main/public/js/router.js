// router.js — fetches landing.html / dashboard.html / chat.html and swaps
// their content into #appRoot, so nothing is hand-merged into one file.
(function () {
  const appRoot = document.getElementById('appRoot');
  const navLinks = document.querySelectorAll('.nav-link[data-route], .brand[data-route]');

  // Map each route to the file that holds its content.
  // "script" is the page's own module script, re-run after each navigation
  // so it can bind to the freshly-injected DOM.
  const routes = {
    '/': {
      file: 'landing.html',
      title: 'Lily — Welcome',
      script: null, // TODO: set to e.g. 'js/landing.js' once landing.html exists
    },
    '/dashboard': {
      file: 'dashboard.html',
      title: 'Lily — Dashboard',
      script: 'js/dashboard/dashboard.js',
    },
    '/chat': {
      file: 'chat.html',
      title: 'Lily — Chat',
      script: 'js/chat.js',
    },
  };

  const FALLBACK_ROUTE = '/';

  // Reverse lookup so plain hrefs like "chat.html" inside injected content
  // still go through the router instead of causing a full page reload.
  const fileToRoute = Object.fromEntries(
    Object.entries(routes).map(([path, route]) => [route.file, path])
  );

  function currentPath() {
    const hash = window.location.hash.replace(/^#/, '');
    return hash || '/';
  }

  function setActiveNav(path) {
    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.dataset.route === path);
    });
  }

  function removePreviousPageScript() {
    document.querySelectorAll('script[data-page-script]').forEach((el) => el.remove());
  }

  function runPageScript(src) {
    if (!src) return;
    const script = document.createElement('script');
    script.type = 'module';
    // cache-bust so the module's top-level code actually re-executes
    script.src = `${src}?route=${Date.now()}`;
    script.dataset.pageScript = 'true';
    document.body.appendChild(script);
  }

  // Pulls the meaningful content out of a fetched page: everything in <body>
  // except the header and loading screen, which the shell already provides.
  function extractContent(doc) {
    const clone = doc.body.cloneNode(true);
    clone.querySelectorAll('header, .loading-screen, script').forEach((el) => el.remove());
    return clone.innerHTML;
  }

  async function render(path) {
    const route = routes[path] || routes[FALLBACK_ROUTE];

    if (!route.file) {
      appRoot.innerHTML = `<main class="dashboard"><p style="padding:2rem;color:var(--ink-700);">This page isn't wired up yet.</p></main>`;
      return;
    }

    try {
      const res = await fetch(route.file);
      if (!res.ok) throw new Error(`Failed to load ${route.file}: ${res.status}`);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      appRoot.innerHTML = extractContent(doc);
      document.title = doc.title || route.title;
      setActiveNav(path);
      removePreviousPageScript();
      runPageScript(route.script);
      window.scrollTo(0, 0);
      window.dispatchEvent(new CustomEvent('lily:route-changed', { detail: { path } }));
      window.dispatchEvent(new Event('lily:ready')); // no-op after first load once the splash is gone
    } catch (err) {
      console.error(err);
      appRoot.innerHTML = `<main class="dashboard"><p style="padding:2rem;color:var(--danger);">Couldn't load this page. Check the console for details.</p></main>`;
    }
  }

  window.addEventListener('hashchange', () => render(currentPath()));

  // Intercept clicks on any link pointing to a known page file (e.g.
  // href="chat.html" inside injected content) and route it through the
  // hash system instead of letting the browser do a full navigation.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('//')) return;

    const fileName = href.split('/').pop();
    const routePath = fileToRoute[fileName];
    if (!routePath) return;

    e.preventDefault();
    window.location.hash = `#${routePath}`;
  });

  window.addEventListener('DOMContentLoaded', () => {
    if (!window.location.hash) window.location.hash = '#/';
    render(currentPath());
  });
})();