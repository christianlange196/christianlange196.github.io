(function () {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinksContainer = document.querySelector('.nav-links');
  const navLinks = Array.from(document.querySelectorAll('.nav-links a[data-section]'));
  const sections = Array.from(document.querySelectorAll('main section[id], header[id]'));
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

  function setActive(sectionId) {
    navLinks.forEach(function (link) {
      const isMatch = link.dataset.section === sectionId;
      link.classList.toggle('active', isMatch);
      if (isMatch) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  if ('IntersectionObserver' in window && sections.length > 0) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-35% 0px -45% 0px',
        threshold: 0.01
      }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  } else {
    const onScroll = function () {
      let currentSection = 'home';
      const offset = window.scrollY + 140;
      sections.forEach(function (section) {
        if (section.offsetTop <= offset) {
          currentSection = section.id;
        }
      });
      setActive(currentSection);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
