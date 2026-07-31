document.addEventListener('DOMContentLoaded', () => {

  const navWrap = document.getElementById('navWrap');
  const onScroll = () => {
    navWrap.classList.toggle('is-scrolled', window.scrollY > 12);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const navBurger = document.getElementById('navBurger');
  const navMobile = document.getElementById('navMobile');

  navBurger.addEventListener('click', () => {
    const isOpen = navMobile.classList.toggle('is-open');
    navBurger.setAttribute('aria-expanded', String(isOpen));
  });

  navMobile.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navMobile.classList.remove('is-open');
      navBurger.setAttribute('aria-expanded', 'false');
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId.length <= 1) return;
      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      const navHeight = navWrap.offsetHeight + 16;
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;

      window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    });
  });

});
