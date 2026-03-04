(function () {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinksContainer = document.querySelector('.nav-links');
  const navLinks = Array.from(document.querySelectorAll('.nav-links a[data-route]'));
  const yearEl = document.getElementById('year');

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  if (navToggle && navLinksContainer) {
    navToggle.addEventListener('click', function () {
      const isOpen = navLinksContainer.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        navLinksContainer.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const pathname = window.location.pathname.replace(/index\.html$/, '');

  navLinks.forEach(function (link) {
    const route = link.getAttribute('data-route');
    const normalized = pathname.endsWith('/') ? pathname : pathname + '/';
    const isRouteMatch = normalized === route || normalized.startsWith(route);

    if (isRouteMatch) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });
})();
