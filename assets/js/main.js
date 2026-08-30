(() => {
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let storedTheme = null;

  try {
    storedTheme = localStorage.getItem('iris-theme');
  } catch (error) {
    storedTheme = null;
  }

  if (storedTheme !== 'light' && storedTheme !== 'dark') {
    storedTheme = null;
  }

  const applyTheme = (theme) => {
    const isDark = theme === 'dark';
    root.dataset.theme = isDark ? 'dark' : 'light';

    if (themeToggle) {
      const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
      themeToggle.setAttribute('aria-label', label);
      themeToggle.setAttribute('title', label);
    }

    if (themeColor) {
      themeColor.setAttribute('content', isDark ? '#0B1120' : '#F8FAFC');
    }
  };

  applyTheme(storedTheme || (systemTheme.matches ? 'dark' : 'light'));

  themeToggle?.addEventListener('click', () => {
    const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    storedTheme = nextTheme;

    try {
      localStorage.setItem('iris-theme', nextTheme);
    } catch (error) {
      // The selected theme remains active for the current session.
    }

    window.requestAnimationFrame(() => updateActiveNavigation());
  });

  const followSystemTheme = (event) => {
    if (!storedTheme) {
      applyTheme(event.matches ? 'dark' : 'light');
      window.requestAnimationFrame(() => updateActiveNavigation());
    }
  };

  if (typeof systemTheme.addEventListener === 'function') {
    systemTheme.addEventListener('change', followSystemTheme);
  }

  // Mobile navigation
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('primary-navigation');
  const mobileNavigation = window.matchMedia('(max-width: 1080px)');

  const setNavigationState = (isOpen) => {
    if (!navToggle || !navLinks) return;

    const isMobile = mobileNavigation.matches;
    const shouldOpen = isMobile && isOpen;
    navLinks.classList.toggle('open', shouldOpen);
    navToggle.setAttribute('aria-expanded', String(shouldOpen));
    navToggle.setAttribute('aria-label', shouldOpen ? 'Close navigation menu' : 'Open navigation menu');
    document.body.classList.toggle('menu-open', shouldOpen);

    if (isMobile) {
      navLinks.setAttribute('aria-hidden', String(!shouldOpen));
      navLinks.inert = !shouldOpen;
    } else {
      navLinks.removeAttribute('aria-hidden');
      navLinks.inert = false;
    }
  };

  if (navToggle && navLinks) {
    setNavigationState(false);

    navToggle.addEventListener('click', () => {
      setNavigationState(navToggle.getAttribute('aria-expanded') !== 'true');
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setNavigationState(false));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
        setNavigationState(false);
        navToggle.focus();
      }
    });

    const syncNavigation = () => setNavigationState(false);
    if (typeof mobileNavigation.addEventListener === 'function') {
      mobileNavigation.addEventListener('change', syncNavigation);
    }
  }

  // Keep the navigation highlight synchronized with the current section.
  const sectionLinks = navLinks
    ? Array.from(navLinks.querySelectorAll('a[href^="#"]'))
    : [];
  const sectionNavigation = sectionLinks
    .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
    .filter((item) => item.section);
  const navElement = document.querySelector('.nav');
  const toneRegions = Array.from(document.querySelectorAll('main > section, footer'));
  let navigationFrame = null;

  const updateActiveNavigation = () => {
    navigationFrame = null;
    const navHeight = navElement?.offsetHeight || 74;
    const readingLine = window.scrollY + navHeight + Math.min(window.innerHeight * 0.24, 180);
    let activeItem = sectionNavigation[0] || null;

    sectionNavigation.forEach((item) => {
      if (item.section.offsetTop <= readingLine) activeItem = item;
    });

    sectionNavigation.forEach(({ link }) => {
      const isActive = link === activeItem.link;
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });

    if (navElement && toneRegions.length) {
      const surfaceLine = navHeight + 2;
      let currentRegion = toneRegions.find((region) => {
        const bounds = region.getBoundingClientRect();
        return bounds.top <= surfaceLine && bounds.bottom > surfaceLine;
      });

      if (!currentRegion) {
        currentRegion = toneRegions[0];
        toneRegions.forEach((region) => {
          if (region.offsetTop <= window.scrollY + surfaceLine) currentRegion = region;
        });
      }

      const useDarkSurface = root.dataset.theme === 'dark'
        || currentRegion?.dataset.navTone === 'dark';
      navElement.dataset.surface = useDarkSurface ? 'dark' : 'light';
    }
  };

  const requestNavigationUpdate = () => {
    if (navigationFrame !== null) return;
    navigationFrame = window.requestAnimationFrame(updateActiveNavigation);
  };

  updateActiveNavigation();
  window.addEventListener('scroll', requestNavigationUpdate, { passive: true });
  window.addEventListener('resize', requestNavigationUpdate);

  // Scroll reveal
  const revealElements = document.querySelectorAll('.reveal');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -28px' });

    revealElements.forEach((element) => observer.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add('is-visible'));
  }

  // Product concept explorer
  const productExplorer = document.getElementById('productExplorer');
  const productScreens = Array.from(document.querySelectorAll('.preview-card'));
  let activeProductScreen = 0;

  productExplorer?.addEventListener('click', () => {
    if (!productScreens.length) return;
    activeProductScreen = (activeProductScreen + 1) % productScreens.length;
    productScreens[activeProductScreen].scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  });
})();
